import { DataSource } from 'typeorm';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

// Import entities
import { Agent } from '@/models/Agent';
import { AgentToken } from '@/models/AgentToken';
import { Trade } from '@/models/Trade';
import { Portfolio } from '@/models/Portfolio';
import { User } from '@/models/User';

// Turso speaks libSQL over libsql:// (or https://). For remote databases the
// auth token is appended as a query param. Anything else is treated as a local
// SQLite file path — the `file:` scheme is stripped so the sqlite driver gets a
// plain filesystem path rather than trying to mkdir "file:.".
const isRemote = /^(libsql|https):\/\//.test(env.DATABASE_URL);

// Local files must use a `file:` URL for the libsql driver, but TypeORM derives
// the dir to create via path.dirname() — so a leading "./" turns into "file:."
// and mkdir fails. Strip "file:" and "./" then re-prefix to keep dirname = ".".
const localFile = `file:${env.DATABASE_URL.replace(/^file:/, '').replace(/^\.\//, '')}`;

const database = isRemote
  ? env.DATABASE_AUTH_TOKEN
    ? `${env.DATABASE_URL}?authToken=${env.DATABASE_AUTH_TOKEN}`
    : env.DATABASE_URL
  : localFile;

export const AppDataSource = new DataSource({
  type: 'sqlite',
  // @libsql/sqlite3 is a drop-in for node-sqlite3 that also talks to Turso.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  driver: require('@libsql/sqlite3'),
  database,
  synchronize: env.NODE_ENV === 'development',
  logging: env.NODE_ENV === 'development',
  entities: [Agent, AgentToken, Trade, Portfolio, User],
});

export async function initializeDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Database connection established');
    }
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
}

export async function closeDatabase() {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
  } catch (error) {
    logger.error('Database closure failed:', error);
  }
}
