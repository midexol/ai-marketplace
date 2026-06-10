import { Repository } from 'typeorm';
import { AppDataSource } from '@/database/data-source';
import { AgentToken } from '@/models/AgentToken';
import { Trade } from '@/models/Trade';
import { logger } from '@/utils/logger';
import { AppError } from '@/middleware/errorHandler';

interface BondingCurveParams {
  initialPrice: bigint;
  priceMultiplier: number; // Typically 1.0001 or similar
}

export class MarketplaceService {
  private agentTokenRepository: Repository<AgentToken>;
  private tradeRepository: Repository<Trade>;

  // Standard bonding curve parameters (can be made configurable)
  private readonly DEFAULT_BONDING_CURVE_PARAMS: BondingCurveParams = {
    initialPrice: BigInt('1000000000000000'), // 0.001 ETH in wei
    priceMultiplier: 1.0001,
  };

  constructor() {
    this.agentTokenRepository = AppDataSource.getRepository(AgentToken);
    this.tradeRepository = AppDataSource.getRepository(Trade);
  }

  /**
   * Calculate price using bonding curve: price = initialPrice * (multiplier ^ totalSupply)
   */
  private calculateBondingCurvePrice(supply: bigint, params: BondingCurveParams = this.DEFAULT_BONDING_CURVE_PARAMS): bigint {
    const supplyNumber = Number(supply);
    const exponent = Math.pow(params.priceMultiplier, supplyNumber / 1e18);
    const priceFloat = Number(params.initialPrice) * exponent;
    return BigInt(Math.floor(priceFloat));
  }

  /**
   * Calculate proceeds from selling tokens using bonding curve
   */
  private calculateSellProceeds(
    currentSupply: bigint,
    tokensToSell: bigint,
    params: BondingCurveParams = this.DEFAULT_BONDING_CURVE_PARAMS
  ): bigint {
    const newSupply = currentSupply - tokensToSell;

    if (newSupply < BigInt(0)) {
      throw new Error('Cannot sell more tokens than available');
    }

    const priceAtStart = this.calculateBondingCurvePrice(currentSupply, params);
    const priceAtEnd = this.calculateBondingCurvePrice(newSupply, params);
    const averagePrice = (priceAtStart + priceAtEnd) / BigInt(2);

    return (averagePrice * tokensToSell) / BigInt(1e18);
  }

  async getTokenPrice(agentTokenId: string, _chain: string): Promise<{
    price: string;
    marketCap: string;
    priceChange24h: number;
  }> {
    try {
      const token = await this.agentTokenRepository.findOne({
        where: { id: agentTokenId },
      });

      if (!token) {
        throw new AppError('Token not found', 404, 'TOKEN_NOT_FOUND');
      }

      const supply = BigInt(token.totalSupply);
      const currentPrice = this.calculateBondingCurvePrice(supply);
      const marketCap = (currentPrice * supply) / BigInt(1e18);

      return {
        price: currentPrice.toString(),
        marketCap: marketCap.toString(),
        priceChange24h: token.priceChange24h,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to get token price:', error);
      throw new AppError('Failed to get token price', 500, 'PRICE_FETCH_ERROR');
    }
  }

  async calculateBuyQuote(agentTokenId: string, amountToSpend: string): Promise<{
    tokenAmount: string;
    averagePrice: string;
    priceImpact: number;
  }> {
    try {
      const token = await this.agentTokenRepository.findOne({
        where: { id: agentTokenId },
      });

      if (!token) {
        throw new AppError('Token not found', 404, 'TOKEN_NOT_FOUND');
      }

      const amountBN = BigInt(amountToSpend);
      const currentSupply = BigInt(token.totalSupply);
      const currentPrice = this.calculateBondingCurvePrice(currentSupply);

      // Approximate token amount based on average price (simplified)
      const estimatedTokenAmount = (amountBN * BigInt(1e18)) / currentPrice;

      // Check price impact (rough estimate)
      const newPrice = this.calculateBondingCurvePrice(currentSupply + estimatedTokenAmount);
      const priceImpact = ((Number(newPrice) - Number(currentPrice)) / Number(currentPrice)) * 100;

      return {
        tokenAmount: estimatedTokenAmount.toString(),
        averagePrice: currentPrice.toString(),
        priceImpact,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to calculate buy quote:', error);
      throw new AppError('Failed to calculate buy quote', 400, 'QUOTE_CALC_ERROR');
    }
  }

  async calculateSellQuote(agentTokenId: string, tokenAmount: string): Promise<{
    proceeds: string;
    averagePrice: string;
    priceImpact: number;
  }> {
    try {
      const token = await this.agentTokenRepository.findOne({
        where: { id: agentTokenId },
      });

      if (!token) {
        throw new AppError('Token not found', 404, 'TOKEN_NOT_FOUND');
      }

      const amountBN = BigInt(tokenAmount);
      const currentSupply = BigInt(token.totalSupply);
      const currentPrice = this.calculateBondingCurvePrice(currentSupply);

      const proceeds = this.calculateSellProceeds(currentSupply, amountBN);
      const newPrice = this.calculateBondingCurvePrice(currentSupply - amountBN);
      const averagePrice = proceeds / (amountBN / BigInt(1e18));
      const priceImpact = ((Number(newPrice) - Number(currentPrice)) / Number(currentPrice)) * 100;

      return {
        proceeds: proceeds.toString(),
        averagePrice: averagePrice.toString(),
        priceImpact,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to calculate sell quote:', error);
      throw new AppError('Failed to calculate sell quote', 400, 'QUOTE_CALC_ERROR');
    }
  }

  async getTradeHistory(agentId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [trades, total] = await this.tradeRepository.findAndCount({
        where: { agentId },
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

      return { trades, total, page, limit };
    } catch (error) {
      logger.error('Failed to fetch trade history:', error);
      throw new AppError('Failed to fetch trade history', 500, 'TRADES_FETCH_ERROR');
    }
  }

  async getMarketStats(agentId: string) {
    try {
      // Get 24h volume
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const trades24h = await this.tradeRepository.find({
        where: { agentId, createdAt: { _gt: oneDayAgo } as any },
      });

      const volume24h = trades24h.reduce((sum, trade) => sum + BigInt(trade.totalValue), BigInt(0));

      // Get trade count
      const allTrades = await this.tradeRepository.find({
        where: { agentId },
      });

      return {
        volume24h: volume24h.toString(),
        tradeCount: allTrades.length,
        trades24h: trades24h.length,
      };
    } catch (error) {
      logger.error('Failed to fetch market stats:', error);
      throw new AppError('Failed to fetch market stats', 500, 'STATS_FETCH_ERROR');
    }
  }

  async updateTokenMetrics(agentTokenId: string): Promise<AgentToken> {
    try {
      const token = await this.agentTokenRepository.findOne({
        where: { id: agentTokenId },
      });

      if (!token) {
        throw new AppError('Token not found', 404, 'TOKEN_NOT_FOUND');
      }

      const supply = BigInt(token.totalSupply);
      const price = this.calculateBondingCurvePrice(supply);
      const marketCap = (price * supply) / BigInt(1e18);

      token.price = price.toString();
      token.marketCap = marketCap.toString();

      const updated = await this.agentTokenRepository.save(token);
      logger.info(`Token metrics updated: ${agentTokenId}`);

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to update token metrics:', error);
      throw new AppError('Failed to update token metrics', 500, 'METRICS_UPDATE_ERROR');
    }
  }
}
