import 'reflect-metadata';
import { createApp } from './app';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';
import { initializeDatabase, closeDatabase } from '@/database/data-source';
import { seedDatabase } from '@/database/seed';

let server: any;

async function main() {
  try {
    // Initialize database
    await initializeDatabase();

    // Populate demo data when the database is empty (idempotent).
    // Keeps the marketplace populated for the demo even after a fresh deploy.
    try {
      await seedDatabase();
    } catch (seedError) {
      logger.warn('Seeding skipped due to error (continuing):', seedError);
    }

    // Create and start Express app
    const app = createApp();

    server = app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  logger.info('Shutdown signal received');

  if (server) {
    server.close(async () => {
      await closeDatabase();
      logger.info('Server closed');
      process.exit(0);
    });
  } else {
    await closeDatabase();
    process.exit(0);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
