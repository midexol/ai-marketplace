import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Portfolio } from '@/types';
import { PortfolioService } from '@/services/PortfolioService';
import { AppError } from '@/middleware/errorHandler';
import { authorizeUser } from '@/middleware/authMiddleware';
import { logger } from '@/utils/logger';

const router = Router();
const portfolioService = new PortfolioService();

// Validation schemas
const addHoldingSchema = z.object({
  agentId: z.string().uuid(),
  chain: z.string().min(1),
  balance: z.string().regex(/^\d+$/),
  averageBuyPrice: z.string().regex(/^\d+$/),
});

const updateUserSchema = z.object({
  ensName: z.string().optional(),
  username: z.string().optional(),
  profileImage: z.string().url().optional(),
  bio: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/portfolio/user/:userAddress - Get user profile (must be before /:userAddress)
router.get('/user/:userAddress', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.params;

    // Validate address format
    if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new AppError('Invalid wallet address format', 400, 'INVALID_ADDRESS');
    }

    const user = await portfolioService.getUserProfile(userAddress);
    res.json(user);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Failed to get user profile:', error);
    throw new AppError('Failed to get user profile', 500, 'PROFILE_FETCH_ERROR');
  }
});

// GET /api/portfolio/:userAddress - Get user portfolio
router.get('/:userAddress', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    // Validate address format
    if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new AppError('Invalid wallet address format', 400, 'INVALID_ADDRESS');
    }

    const result = await portfolioService.getPortfolio(userAddress, page, limit);
    res.json(result);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Failed to get portfolio:', error);
    throw new AppError('Failed to get portfolio', 500, 'PORTFOLIO_FETCH_ERROR');
  }
});

// GET /api/portfolio/:userAddress/value - Get portfolio value
router.get('/:userAddress/value', async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.params;

    // Validate address format
    if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new AppError('Invalid wallet address format', 400, 'INVALID_ADDRESS');
    }

    const value = await portfolioService.getPortfolioValue(userAddress);
    res.json(value);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Failed to get portfolio value:', error);
    throw new AppError('Failed to get portfolio value', 500, 'VALUE_CALC_ERROR');
  }
});

// POST /api/portfolio/:userAddress/holdings - Add holding
router.post('/:userAddress/holdings', authorizeUser('userAddress'), async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.params;
    const validated = addHoldingSchema.parse(req.body);

    // Validate address format
    if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new AppError('Invalid wallet address format', 400, 'INVALID_ADDRESS');
    }

    const holding = await portfolioService.addHolding(
      userAddress,
      validated.agentId,
      validated.chain,
      validated.balance,
      validated.averageBuyPrice
    );

    res.status(201).json(holding);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    if (error instanceof AppError) throw error;
    logger.error('Failed to add holding:', error);
    throw new AppError('Failed to add holding', 500, 'HOLDING_ADD_ERROR');
  }
});

// DELETE /api/portfolio/:userAddress/holdings/:agentId - Remove holding
router.delete('/:userAddress/holdings/:agentId', authorizeUser('userAddress'), async (req: Request, res: Response) => {
  try {
    const { userAddress, agentId } = req.params;
    const { chain } = req.query;

    if (!chain) {
      throw new AppError('Missing chain parameter', 400, 'VALIDATION_ERROR');
    }

    // Validate address format
    if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new AppError('Invalid wallet address format', 400, 'INVALID_ADDRESS');
    }

    await portfolioService.removeHolding(userAddress, agentId, chain as string);
    res.json({ success: true, message: 'Holding removed' });
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Failed to remove holding:', error);
    throw new AppError('Failed to remove holding', 500, 'HOLDING_REMOVE_ERROR');
  }
});

// PATCH /api/portfolio/user/:userAddress - Update user profile
router.patch('/user/:userAddress', authorizeUser('userAddress'), async (req: Request, res: Response) => {
  try {
    const { userAddress } = req.params;
    const validated = updateUserSchema.parse(req.body);

    // Validate address format
    if (!userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new AppError('Invalid wallet address format', 400, 'INVALID_ADDRESS');
    }

    const user = await portfolioService.updateUser(userAddress, validated);
    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError('Invalid request data', 400, 'VALIDATION_ERROR');
    }
    if (error instanceof AppError) throw error;
    logger.error('Failed to update user profile:', error);
    throw new AppError('Failed to update user profile', 500, 'PROFILE_UPDATE_ERROR');
  }
});

// GET /api/portfolio/agents/:agentId/holders - Get top holders
router.get('/agents/:agentId/holders', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const holders = await portfolioService.getTopHolders(agentId, limit);
    res.json(holders);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Failed to get top holders:', error);
    throw new AppError('Failed to get top holders', 500, 'HOLDERS_FETCH_ERROR');
  }
});

export default router;
