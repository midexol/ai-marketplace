import { Repository } from 'typeorm';
import { AppDataSource } from '@/database/data-source';
import { Portfolio } from '@/models/Portfolio';
import { User } from '@/models/User';
import { logger } from '@/utils/logger';
import { AppError } from '@/middleware/errorHandler';

interface PortfolioHolding {
  agentId: string;
  agentName: string;
  chain: string;
  balance: string;
  currentPrice: string;
  currentValue: string;
  averageBuyPrice: string;
  gainLoss: string;
  gainLossPercentage: number;
}

export class PortfolioService {
  private portfolioRepository: Repository<Portfolio>;
  private userRepository: Repository<User>;

  constructor() {
    this.portfolioRepository = AppDataSource.getRepository(Portfolio);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async getOrCreateUser(address: string): Promise<User> {
    try {
      let user = await this.userRepository.findOne({
        where: { address },
      });

      if (!user) {
        user = this.userRepository.create({
          address,
          metadata: {},
        });
        user = await this.userRepository.save(user);
        logger.info(`User created: ${address}`);
      }

      return user;
    } catch (error) {
      logger.error('Failed to get or create user:', error);
      throw new AppError('Failed to get or create user', 500, 'USER_FETCH_ERROR');
    }
  }

  async addHolding(
    userAddress: string,
    agentId: string,
    chain: string,
    balance: string,
    averageBuyPrice: string
  ): Promise<Portfolio> {
    try {
      await this.getOrCreateUser(userAddress);

      let portfolio = await this.portfolioRepository.findOne({
        where: { userAddress, agentId, chain },
        relations: ['agent', 'agentToken'],
      });

      if (portfolio) {
        portfolio.balance = balance;
        portfolio.averageBuyPrice = averageBuyPrice;
      } else {
        portfolio = this.portfolioRepository.create({
          userAddress,
          agentId,
          chain,
          balance,
          averageBuyPrice,
          currentPrice: '0',
          currentValue: '0',
        });
      }

      const saved = await this.portfolioRepository.save(portfolio);
      logger.info(`Portfolio holding added: ${userAddress} - ${agentId}`);

      return saved;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to add holding:', error);
      throw new AppError('Failed to add holding', 400, 'HOLDING_ADD_ERROR');
    }
  }

  async removeHolding(userAddress: string, agentId: string, chain: string): Promise<void> {
    try {
      await this.portfolioRepository.delete({
        userAddress,
        agentId,
        chain,
      });
      logger.info(`Portfolio holding removed: ${userAddress} - ${agentId}`);
    } catch (error) {
      logger.error('Failed to remove holding:', error);
      throw new AppError('Failed to remove holding', 400, 'HOLDING_REMOVE_ERROR');
    }
  }

  async getPortfolio(userAddress: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [holdings, total] = await this.portfolioRepository.findAndCount({
        where: { userAddress },
        relations: ['agent', 'agentToken'],
        order: { updatedAt: 'DESC' },
        skip,
        take: limit,
      });

      const formattedHoldings: PortfolioHolding[] = holdings.map((h) => {
        const balance = BigInt(h.balance || '0');
        const currentPrice = BigInt(h.currentPrice || '0');
        const averageBuyPrice = BigInt(h.averageBuyPrice || '0');
        const currentValue = (balance * currentPrice) / BigInt(1e18);
        const gainLoss = currentValue - (balance * averageBuyPrice) / BigInt(1e18);
        const gainLossPercentage =
          averageBuyPrice > BigInt(0)
            ? (Number(gainLoss) / Number((balance * averageBuyPrice) / BigInt(1e18))) * 100
            : 0;

        return {
          agentId: h.agentId,
          agentName: h.agent?.name || 'Unknown',
          chain: h.chain,
          balance: h.balance,
          currentPrice: h.currentPrice,
          currentValue: currentValue.toString(),
          averageBuyPrice: h.averageBuyPrice,
          gainLoss: gainLoss.toString(),
          gainLossPercentage,
        };
      });

      return {
        holdings: formattedHoldings,
        total,
        page,
        limit,
      };
    } catch (error) {
      logger.error('Failed to fetch portfolio:', error);
      throw new AppError('Failed to fetch portfolio', 500, 'PORTFOLIO_FETCH_ERROR');
    }
  }

  async getPortfolioValue(userAddress: string) {
    try {
      const holdings = await this.portfolioRepository.find({
        where: { userAddress },
        relations: ['agentToken'],
      });

      let totalValue = BigInt(0);
      let totalCost = BigInt(0);
      const byChain: Record<string, { value: bigint; cost: bigint }> = {};

      holdings.forEach((h) => {
        const balance = BigInt(h.balance || '0');
        const currentPrice = BigInt(h.currentPrice || '0');
        const averageBuyPrice = BigInt(h.averageBuyPrice || '0');
        const value = (balance * currentPrice) / BigInt(1e18);
        const cost = (balance * averageBuyPrice) / BigInt(1e18);

        totalValue += value;
        totalCost += cost;

        if (!byChain[h.chain]) {
          byChain[h.chain] = { value: BigInt(0), cost: BigInt(0) };
        }
        byChain[h.chain].value += value;
        byChain[h.chain].cost += cost;
      });

      const gainLoss = totalValue - totalCost;
      const gainLossPercentage = totalCost > BigInt(0) ? (Number(gainLoss) / Number(totalCost)) * 100 : 0;

      return {
        totalValue: totalValue.toString(),
        totalCost: totalCost.toString(),
        gainLoss: gainLoss.toString(),
        gainLossPercentage,
        byChain: Object.entries(byChain).reduce(
          (acc, [chain, { value, cost }]) => {
            acc[chain] = {
              value: value.toString(),
              cost: cost.toString(),
            };
            return acc;
          },
          {} as Record<string, { value: string; cost: string }>
        ),
      };
    } catch (error) {
      logger.error('Failed to calculate portfolio value:', error);
      throw new AppError('Failed to calculate portfolio value', 500, 'VALUE_CALC_ERROR');
    }
  }

  async updateUser(address: string, data: Partial<User>): Promise<User> {
    try {
      const user = await this.getOrCreateUser(address);

      if (data.ensName) user.ensName = data.ensName;
      if (data.username) user.username = data.username;
      if (data.profileImage) user.profileImage = data.profileImage;
      if (data.bio) user.bio = data.bio;
      if (data.metadata) user.metadata = { ...user.metadata, ...data.metadata };

      const updated = await this.userRepository.save(user);
      logger.info(`User updated: ${address}`);

      return updated;
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw new AppError('Failed to update user', 500, 'USER_UPDATE_ERROR');
    }
  }

  async getUserProfile(address: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { address },
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to fetch user profile:', error);
      throw new AppError('Failed to fetch user profile', 500, 'PROFILE_FETCH_ERROR');
    }
  }

  async updatePortfolioValue(userAddress: string): Promise<void> {
    try {
      const portfolioValue = await this.getPortfolioValue(userAddress);
      const user = await this.getOrCreateUser(userAddress);

      user.totalPortfolioValue = portfolioValue.totalValue;
      await this.userRepository.save(user);

      logger.info(`Portfolio value updated for ${userAddress}`);
    } catch (error) {
      logger.error('Failed to update portfolio value:', error);
    }
  }

  async getTopHolders(agentId: string, limit: number = 20) {
    try {
      const holders = await this.portfolioRepository.find({
        where: { agentId },
        relations: ['user'],
        order: { balance: 'DESC' },
        take: limit,
      });

      return holders.map((h) => ({
        userAddress: h.userAddress,
        balance: h.balance,
        currentValue: h.currentValue,
        ensName: h.user?.ensName,
      }));
    } catch (error) {
      logger.error('Failed to fetch top holders:', error);
      throw new AppError('Failed to fetch top holders', 500, 'HOLDERS_FETCH_ERROR');
    }
  }
}
