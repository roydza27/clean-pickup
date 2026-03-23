const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  NODE_ENV:      z.enum(['development', 'staging', 'production']).default('development'),
  PORT:          z.string().default('3000'),
  DB_HOST:       z.string().default('localhost'),
  DB_PORT:       z.string().default('5432'),
  DB_USER:       z.string().min(1, 'DB_USER is required'),
  DB_PASSWORD:   z.string().min(1, 'DB_PASSWORD is required'),
  DB_NAME:       z.string().min(1, 'DB_NAME is required'),
  REDIS_URL:     z.string().default('redis://localhost:6379'),
  JWT_SECRET:    z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  LOG_LEVEL:     z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Environment variable validation failed:');
  parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

const env = parsed.data;

module.exports = { env };
