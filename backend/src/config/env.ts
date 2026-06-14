import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Database - Turso (libSQL / SQLite). Falls back to a local file for dev.
  DATABASE_URL: z.string().default('./synapse.db'),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  // Auto-create/update schema from entities. Needed on first prod deploy to a
  // fresh Turso DB. Set to "false" once the schema is stable to avoid surprises.
  DB_SYNCHRONIZE: z
    .string()
    .default('true')
    .transform((v) => v !== 'false'),

  // Blockchain - Single Alchemy API key for all chains (optional for local demo)
  ALCHEMY_API_KEY: z.string().default('demo'),

  // LLM API - Venice & Gemini
  VENICE_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Contract Addresses (will be set during deployment)
  AGENT_CONTRACT_ADDRESS: z.string().optional(),
  MARKETPLACE_CONTRACT_ADDRESS: z.string().optional(),
  GOVERNANCE_CONTRACT_ADDRESS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
