import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

import { env } from '@/config/env';
import { errorHandler } from '@/middleware/errorHandler';
import { rateLimiter } from '@/middleware/rateLimiter';
import { authMiddleware, requireAuth } from '@/middleware/authMiddleware';
import { logger } from '@/utils/logger';

// Import routes
import agentRoutes from '@/api/agents/routes';
import marketplaceRoutes from '@/api/marketplace/routes';
import portfolioRoutes from '@/api/portfolio/routes';
import inferenceRoutes from '@/api/inference/routes';
import governanceRoutes from '@/api/governance/routes';
import healthRoutes from '@/api/health/routes';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting - global
  app.use(rateLimiter(60000, 300)); // 300 requests per minute

  // Health check (no auth required)
  app.use('/health', healthRoutes);

  // API Routes with authentication
  app.use('/api/agents', authMiddleware, agentRoutes);
  app.use('/api/marketplace', authMiddleware, marketplaceRoutes);
  app.use('/api/portfolio', authMiddleware, portfolioRoutes);
  app.use('/api/inference', authMiddleware, inferenceRoutes);
  app.use('/api/governance', authMiddleware, governanceRoutes);

  // Error handling
  app.use(errorHandler);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Not Found',
      code: 'NOT_FOUND',
    });
  });

  return app;
}
