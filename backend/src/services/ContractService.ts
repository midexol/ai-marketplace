import { ethers } from 'ethers';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

/**
 * On-chain bridge: mints real Agent NFTs + AgentTokens via the deployed Factory
 * (Base Sepolia), so DB agents are backed by tradable on-chain tokens seeded
 * into the BondingCurve.
 *
 * Backend-signed with an operator wallet (OPERATOR_PRIVATE_KEY). When the key or
 * Factory address is absent, on-chain minting is disabled and agents stay
 * DB-only — the rest of the app keeps working.
 */

const FACTORY_ABI = [
  'function createAgentWithTokenFor(address creator, string name, string description, string agentType, string tokenName, string tokenSymbol) returns (uint256 agentTokenId, address tokenAddress)',
  'event AgentTokenCreated(uint256 indexed agentTokenId, address indexed tokenAddress, string name, string symbol, address indexed creator)',
];

const REPUTATION_ABI = [
  'function initializeReputation(uint256 agentId)',
  'function recordTaskCompletion(uint256 agentId, bool success)',
];

export interface OnchainAgent {
  agentId: string; // numeric token ID, as string
  tokenAddress: string;
  txHash: string;
}

export class ContractService {
  private provider?: ethers.JsonRpcProvider;
  private wallet?: ethers.Wallet;
  private factory?: ethers.Contract;
  private reputation?: ethers.Contract;

  constructor() {
    const key = env.OPERATOR_PRIVATE_KEY;
    const factoryAddr = env.FACTORY_ADDRESS;
    if (!key || !factoryAddr) {
      logger.warn('ContractService disabled (set OPERATOR_PRIVATE_KEY + FACTORY_ADDRESS to enable on-chain minting)');
      return;
    }
    try {
      this.provider = new ethers.JsonRpcProvider(env.BASE_SEPOLIA_RPC);
      this.wallet = new ethers.Wallet(key, this.provider);
      this.factory = new ethers.Contract(factoryAddr, FACTORY_ABI, this.wallet);
      if (env.REPUTATION_ADDRESS) {
        this.reputation = new ethers.Contract(env.REPUTATION_ADDRESS, REPUTATION_ABI, this.wallet);
      }
      logger.info(`ContractService ready (operator ${this.wallet.address})`);
    } catch (err) {
      logger.error('ContractService init failed:', err);
    }
  }

  /** Initialize an agent's on-chain reputation (operator-only). Best-effort. */
  async initReputation(agentId: string): Promise<void> {
    if (!this.reputation) return;
    try {
      const tx = await this.reputation.initializeReputation(agentId);
      await tx.wait();
      logger.info(`Reputation initialized for agent ${agentId}`);
    } catch (err) {
      logger.warn(`initReputation failed for ${agentId}: ${(err as Error)?.message}`);
    }
  }

  /** Record a completed task on-chain to move the reputation score. Best-effort. */
  async recordTask(agentId: string, success: boolean): Promise<void> {
    if (!this.reputation || !agentId) return;
    try {
      const tx = await this.reputation.recordTaskCompletion(agentId, success);
      await tx.wait();
    } catch (err) {
      logger.warn(`recordTask failed for ${agentId}: ${(err as Error)?.message}`);
    }
  }

  /** True when on-chain minting is configured and ready. */
  isEnabled(): boolean {
    return !!this.factory;
  }

  /** A read-only provider (works even when minting/operator is disabled). */
  private readProvider(): ethers.JsonRpcProvider {
    return this.provider ?? new ethers.JsonRpcProvider(env.BASE_SEPOLIA_RPC);
  }

  /**
   * Read an address's real ERC-20 balance for an AgentToken, returned as a
   * whole-token decimal string. This is the on-chain source of truth — used to
   * keep holder counts honest (can't be faked by a forged API call).
   */
  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    try {
      const erc20 = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        this.readProvider()
      );
      const balWei: bigint = await erc20.balanceOf(userAddress);
      return ethers.formatEther(balWei);
    } catch (err) {
      logger.warn(`getTokenBalance failed for ${tokenAddress}/${userAddress}: ${(err as Error)?.message}`);
      return '0';
    }
  }

  /** Derive a 3–6 char ticker from an agent name. */
  private symbolFor(name: string): string {
    const cleaned = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    return (cleaned.slice(0, 5) || 'AGENT');
  }

  /**
   * Mint an Agent NFT + its AgentToken on-chain via the Factory. The Factory
   * seeds the token's full supply into the BondingCurve (fair launch).
   * Returns the on-chain agent id + token address, or null if disabled/failed.
   */
  async createOnchainAgent(
    name: string,
    description: string,
    type: string,
    creator: string
  ): Promise<OnchainAgent | null> {
    if (!this.factory) return null;
    try {
      const symbol = this.symbolFor(name);
      // Mint the agent to the real user so they own it + earn creator fees.
      const tx = await this.factory.createAgentWithTokenFor(
        creator,
        name,
        description,
        type,
        `${name} Token`,
        symbol
      );
      const receipt = await tx.wait();

      // Parse the AgentTokenCreated event for the real token address + id.
      let agentId = '';
      let tokenAddress = '';
      for (const log of receipt.logs) {
        try {
          const parsed = this.factory.interface.parseLog(log);
          if (parsed?.name === 'AgentTokenCreated') {
            agentId = parsed.args.agentTokenId.toString();
            tokenAddress = parsed.args.tokenAddress;
            break;
          }
        } catch {
          /* not our event — skip */
        }
      }

      if (!tokenAddress) {
        logger.error('AgentTokenCreated event not found in receipt');
        return null;
      }

      logger.info(`On-chain agent minted: id=${agentId} token=${tokenAddress} tx=${tx.hash}`);

      // Seed the agent's on-chain reputation (best-effort; won't block the mint).
      await this.initReputation(agentId);

      return { agentId, tokenAddress, txHash: tx.hash };
    } catch (err) {
      logger.error('On-chain agent mint failed:', err);
      return null;
    }
  }
}
