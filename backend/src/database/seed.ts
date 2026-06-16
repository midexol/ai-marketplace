import { AppDataSource } from './data-source';
import { Agent } from '@/models/Agent';
import { AgentToken } from '@/models/AgentToken';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import { ContractService } from '@/services/ContractService';

// The deployer/operator wallet — owns the seeded agents on-chain, so it earns
// the creator fee on trades and the agents appear under its profile.
const DEPLOYER_ADDRESS = '0x06fd7eDeb4fbCB626357222aDC2f8Eb5a051535b';

const MOCK_AGENTS: Partial<Agent>[] = [
  {
    name: 'Lexicon',
    description: 'Long-form writing agent that drafts articles, threads, and release notes in your brand voice.',
    creatorAddress: DEPLOYER_ADDRESS,
    type: 'writing',
    chains: ['base'],
    tokenAddresses: {},
    totalHolders: 0,
    marketCap: '5000000000000000000000',
  },
  {
    name: 'Oracle Prime',
    description: 'On-demand research analyst that summarizes whitepapers, audits tokenomics, and cites sources.',
    creatorAddress: DEPLOYER_ADDRESS,
    type: 'research',
    chains: ['base'],
    tokenAddresses: {},
    totalHolders: 0,
    marketCap: '3000000000000000000000',
  },
  {
    name: 'Quorum',
    description: 'Governance strategist that analyzes proposals, models voting outcomes, and drafts delegate statements.',
    creatorAddress: DEPLOYER_ADDRESS,
    type: 'governance',
    chains: ['base'],
    tokenAddresses: {},
    totalHolders: 0,
    marketCap: '8000000000000000000000',
  },
  {
    name: 'Jeeves',
    description: 'Personal butler agent that schedules, triages your inbox, and automates repetitive on-chain tasks.',
    creatorAddress: DEPLOYER_ADDRESS,
    type: 'butler',
    chains: ['base'],
    tokenAddresses: {},
    totalHolders: 0,
    marketCap: '2000000000000000000000',
  },
  {
    name: 'Sentinel',
    description: 'Security research agent that scans contracts for known vulnerability patterns and flags risky approvals.',
    creatorAddress: DEPLOYER_ADDRESS,
    type: 'research',
    chains: ['base'],
    tokenAddresses: {},
    totalHolders: 0,
    marketCap: '4500000000000000000000',
  },
  {
    name: 'Maestro',
    description: 'Content butler that turns rough notes into polished posts, schedules them, and tracks engagement.',
    creatorAddress: DEPLOYER_ADDRESS,
    type: 'writing',
    chains: ['base'],
    tokenAddresses: {},
    totalHolders: 0,
    marketCap: '2700000000000000000000',
  },
];

const MOCK_USERS: Partial<User>[] = [
  {
    address: DEPLOYER_ADDRESS,
    username: 'synapse',
    bio: 'Creator of the seeded Synapse agents.',
    metadata: { joined: 'early' },
  },
];

export async function seedDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const agentRepository = AppDataSource.getRepository(Agent);
  const userRepository = AppDataSource.getRepository(User);
  const tokenRepository = AppDataSource.getRepository(AgentToken);

  try {
    // Check if data already exists
    const agentCount = await agentRepository.count();
    if (agentCount > 0) {
      logger.info('Database already seeded, skipping');
      return;
    }

    // Seed users
    logger.info('Seeding users...');
    for (const userData of MOCK_USERS) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
    }
    logger.info(`Created ${MOCK_USERS.length} users`);

    // Seed agents. When the on-chain operator is configured, each seeded agent
    // is minted for real via the Factory (real token seeded into the curve), so
    // the whole marketplace is consistent and tradable. Otherwise DB-only.
    const contractService = new ContractService();
    const onchainEnabled = contractService.isEnabled();
    logger.info(`Seeding agents (on-chain minting: ${onchainEnabled ? 'ON' : 'OFF'})...`);

    let minted = 0;
    for (const agentData of MOCK_AGENTS) {
      const onchain = onchainEnabled
        ? await contractService.createOnchainAgent(
            agentData.name!,
            agentData.description!,
            agentData.type as string,
            agentData.creatorAddress!
          )
        : null;

      const agent = agentRepository.create({
        ...agentData,
        // On-chain agents live on Base; DB-only keep their listed chains.
        chains: onchain ? ['base'] : agentData.chains,
        onchainId: onchain?.agentId,
        tokenAddresses: onchain ? { base: onchain.tokenAddress } : {},
      });
      const savedAgent = await agentRepository.save(agent);

      if (onchain) {
        await tokenRepository.save(
          tokenRepository.create({
            agentId: savedAgent.id,
            chain: 'base',
            contractAddress: onchain.tokenAddress,
            totalSupply: '1000000000000000000000000',
            circulatingSupply: '1000000000000000000000000',
            price: '0',
            marketCap: agentData.marketCap || '0',
          })
        );
        minted++;
      } else {
        // DB-only placeholder token (untradable; local dev only).
        for (const chain of agentData.chains || []) {
          await tokenRepository.save(
            tokenRepository.create({
              agentId: savedAgent.id,
              chain,
              contractAddress: '0x0000000000000000000000000000000000000000',
              totalSupply: '0',
              circulatingSupply: '0',
              price: '0',
              marketCap: '0',
            })
          );
        }
      }
    }
    logger.info(`Seeding complete — ${MOCK_AGENTS.length} agents (${minted} minted on-chain)`);
  } catch (error) {
    logger.error('Failed to seed database:', error);
    throw error;
  }
}

export async function clearDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const agentRepository = AppDataSource.getRepository(Agent);
  const userRepository = AppDataSource.getRepository(User);

  try {
    logger.info('Clearing database...');
    await agentRepository.delete({});
    await userRepository.delete({});
    logger.info('Database cleared');
  } catch (error) {
    logger.error('Failed to clear database:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding complete');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}

