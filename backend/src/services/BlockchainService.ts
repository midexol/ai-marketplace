import { ethers } from 'ethers';
import { logger } from '@/utils/logger';
import { AppError } from '@/middleware/errorHandler';
import { CHAINS, RPC_URLS } from '@/config/chains';

export class BlockchainService {
  private providers: Record<string, ethers.JsonRpcProvider>;

  constructor() {
    this.providers = {};
    this.initializeProviders();
  }

  private initializeProviders() {
    Object.entries(RPC_URLS).forEach(([chainName, rpcUrl]) => {
      try {
        this.providers[chainName] = new ethers.JsonRpcProvider(rpcUrl);
        const chain = CHAINS[chainName];
        logger.info(`Blockchain provider initialized for ${chain.name}`);
      } catch (error) {
        const chain = CHAINS[chainName];
        logger.error(`Failed to initialize provider for ${chain.name}:`, error);
      }
    });
  }

  private getProvider(chain: string): ethers.JsonRpcProvider {
    const provider = this.providers[chain];
    if (!provider) {
      throw new AppError(`Unsupported chain: ${chain}`, 400, 'CHAIN_NOT_SUPPORTED');
    }
    return provider;
  }

  async getBalance(address: string, chain: string = 'ethereum'): Promise<string> {
    try {
      const provider = this.getProvider(chain);
      const balance = await provider.getBalance(address);
      return balance.toString();
    } catch (error) {
      logger.error(`Failed to get balance for ${address} on ${chain}:`, error);
      throw new AppError('Failed to get balance', 500, 'BALANCE_FETCH_ERROR');
    }
  }

  async getTokenBalance(tokenAddress: string, holderAddress: string, chain: string = 'ethereum'): Promise<string> {
    try {
      const provider = this.getProvider(chain);

      // ERC-20 balanceOf call
      const erc20Abi = [
        'function balanceOf(address account) external view returns (uint256)',
        'function decimals() external view returns (uint8)',
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
      const balance = await contract.balanceOf(holderAddress);

      return balance.toString();
    } catch (error) {
      logger.error(`Failed to get token balance for ${holderAddress} on ${chain}:`, error);
      throw new AppError('Failed to get token balance', 500, 'TOKEN_BALANCE_ERROR');
    }
  }

  async getTokenInfo(
    tokenAddress: string,
    chain: string = 'ethereum'
  ): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  }> {
    try {
      const provider = this.getProvider(chain);

      const erc20Abi = [
        'function name() external view returns (string)',
        'function symbol() external view returns (string)',
        'function decimals() external view returns (uint8)',
        'function totalSupply() external view returns (uint256)',
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
      ]);

      return {
        name,
        symbol,
        decimals,
        totalSupply: totalSupply.toString(),
      };
    } catch (error) {
      logger.error(`Failed to get token info for ${tokenAddress} on ${chain}:`, error);
      throw new AppError('Failed to get token info', 500, 'TOKEN_INFO_ERROR');
    }
  }

  async getTransactionReceipt(txHash: string, chain: string = 'ethereum') {
    try {
      const provider = this.getProvider(chain);
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt) {
        throw new AppError('Transaction not found', 404, 'TX_NOT_FOUND');
      }

      return {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        from: receipt.from,
        to: receipt.to,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to get transaction receipt for ${txHash} on ${chain}:`, error);
      throw new AppError('Failed to get transaction receipt', 500, 'TX_RECEIPT_ERROR');
    }
  }

  async getBlockNumber(chain: string = 'ethereum'): Promise<number> {
    try {
      const provider = this.getProvider(chain);
      return await provider.getBlockNumber();
    } catch (error) {
      logger.error(`Failed to get block number for ${chain}:`, error);
      throw new AppError('Failed to get block number', 500, 'BLOCK_NUMBER_ERROR');
    }
  }

  async getGasPrice(chain: string = 'ethereum'): Promise<{
    standard: string;
    fast: string;
    instant: string;
  }> {
    try {
      const provider = this.getProvider(chain);
      const feeData = await provider.getFeeData();

      // Mock gas price calculation (in production, use proper gas estimation)
      const baseFee = feeData.gasPrice || ethers.parseEther('0.00001');
      const standard = baseFee.toString();
      const fast = (baseFee * BigInt(120)) / BigInt(100);
      const instant = (baseFee * BigInt(150)) / BigInt(100);

      return {
        standard,
        fast: fast.toString(),
        instant: instant.toString(),
      };
    } catch (error) {
      logger.error(`Failed to get gas price for ${chain}:`, error);
      throw new AppError('Failed to get gas price', 500, 'GAS_PRICE_ERROR');
    }
  }

  async validateAddress(address: string): Promise<boolean> {
    try {
      return ethers.isAddress(address);
    } catch (error) {
      return false;
    }
  }

  async getChainInfo(chain: string) {
    try {
      const chainConfig = CHAINS[chain as keyof typeof CHAINS];
      if (!chainConfig) {
        throw new AppError(`Chain not found: ${chain}`, 404, 'CHAIN_NOT_FOUND');
      }

      const provider = this.getProvider(chain);
      const blockNumber = await provider.getBlockNumber();
      const network = await provider.getNetwork();

      return {
        chain,
        name: chainConfig.name,
        chainId: chainConfig.chainId,
        blockNumber,
        networkName: network.name,
        rpcUrl: chainConfig.rpcUrl,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`Failed to get chain info for ${chain}:`, error);
      throw new AppError('Failed to get chain info', 500, 'CHAIN_INFO_ERROR');
    }
  }

  async getSupportedChains() {
    return Object.entries(CHAINS).map(([key, config]) => ({
      key,
      name: config.name,
      chainId: config.id,
    }));
  }
}
