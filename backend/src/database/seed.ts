import { AppDataSource } from './data-source';
import { Agent } from '@/models/Agent';
import { AgentToken } from '@/models/AgentToken';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';

const MOCK_AGENTS: Partial<Agent>[] = [
  {
    name: 'Lexicon',
    description: 'Long-form writing agent that drafts articles, threads, and release notes in your brand voice.',
    creatorAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f42aE0',
    type: 'writing',
    chains: ['ethereum', 'polygon', 'base'],
    tokenAddresses: {},
    totalHolders: 1284,
    marketCap: '5000000000000000000000',
  },
  {
    name: 'Oracle Prime',
    description: 'On-demand research analyst that summarizes whitepapers, audits tokenomics, and cites sources.',
    creatorAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f42aE0',
    type: 'research',
    chains: ['ethereum', 'arbitrum'],
    tokenAddresses: {},
    totalHolders: 2041,
    marketCap: '3000000000000000000000',
  },
  {
    name: 'Quorum',
    description: 'Governance strategist that analyzes proposals, models voting outcomes, and drafts delegate statements.',
    creatorAddress: '0x123456789abcdef0123456789abcdef012345678',
    type: 'governance',
    chains: ['ethereum', 'polygon', 'arbitrum', 'base'],
    tokenAddresses: {},
    totalHolders: 768,
    marketCap: '8000000000000000000000',
  },
  {
    name: 'Jeeves',
    description: 'Personal butler agent that schedules, triages your inbox, and automates repetitive on-chain tasks.',
    creatorAddress: '0x987654321fedcba0987654321fedcba098765432',
    type: 'butler',
    chains: ['polygon', 'base'],
    tokenAddresses: {},
    totalHolders: 3320,
    marketCap: '2000000000000000000000',
  },
];

const MOCK_USERS: Partial<User>[] = [
  {
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f42aE0',
    ensName: 'alice.eth',
    username: 'alice',
    bio: 'AI enthusiast and early adopter',
    profileImage: 'https://api.placeholder.com/alice.jpg',
    metadata: { joined: 'early', newsletter: true },
  },
  {
    address: '0x123456789abcdef0123456789abcdef012345678',
    ensName: 'bob.eth',
    username: 'bob',
    bio: 'Governance advocate',
    profileImage: 'https://api.placeholder.com/bob.jpg',
    metadata: { joined: 'early', newsletter: false },
  },
  {
    address: '0xaaaabbbbccccddddeeeeffffaabbccddee112233',
    username: 'charlie',
    bio: 'Trading bot developer',
    profileImage: 'https://api.placeholder.com/charlie.jpg',
    metadata: { joined: 'recent' },
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

    // Seed agents
    logger.info('Seeding agents...');
    for (const agentData of MOCK_AGENTS) {
      const agent = agentRepository.create(agentData);
      const savedAgent = await agentRepository.save(agent);

      // Create tokens for each chain
      for (const chain of agentData.chains || []) {
        const token = tokenRepository.create({
          agentId: savedAgent.id,
          chain,
          contractAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
          totalSupply: '1000000000000000000000',
          circulatingSupply: '500000000000000000000',
          price: '1000000000000000',
          marketCap: (BigInt(agentData.marketCap || '0') / BigInt(agentData.chains?.length || 1)).toString(),
        });
        await tokenRepository.save(token);
      }
    }
    logger.info(`Created ${MOCK_AGENTS.length} agents with tokens`);
    logger.info('Database seeding completed successfully');
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
