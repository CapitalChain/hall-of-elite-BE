/**
 * Environment configuration loader.
 * Created to validate and expose app config from .env at startup.
 */
import { config } from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("6200"),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default("http://localhost:6100"),
  /** Comma-separated list of additional CORS origins (e.g. production frontend URL) */
  CORS_ORIGINS: z.string().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  // MT5 Configuration
  MT5_SERVER: z.string().optional(),
  MT5_LOGIN: z.string().optional(),
  MT5_PASSWORD: z.string().optional(),
  MT5_API_URL: z.string().url().optional(),
  MT5_API_KEY: z.string().optional(),
  MT5_RETRY_ATTEMPTS: z.string().default("3"),
  MT5_RETRY_DELAY_MS: z.string().default("1000"),
  // Rate limiting (optional; defaults below)
  RATE_LIMIT_AUTH_MAX: z.string().optional(),
  RATE_LIMIT_AUTH_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_API_MAX: z.string().optional(),
  RATE_LIMIT_API_WINDOW_MS: z.string().optional(),
  /** Capital Chain auth API base URL (e.g. https://capitalchain-c.tradetechsolutions.app). If set, Bearer tokens can be validated via GET /authentication/user/ */
  AUTH_API_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  MT5_SERVER: process.env.MT5_SERVER,
  MT5_LOGIN: process.env.MT5_LOGIN,
  MT5_PASSWORD: process.env.MT5_PASSWORD,
  MT5_API_URL: process.env.MT5_API_URL,
  MT5_API_KEY: process.env.MT5_API_KEY,
  MT5_RETRY_ATTEMPTS: process.env.MT5_RETRY_ATTEMPTS,
  MT5_RETRY_DELAY_MS: process.env.MT5_RETRY_DELAY_MS,
  RATE_LIMIT_AUTH_MAX: process.env.RATE_LIMIT_AUTH_MAX,
  RATE_LIMIT_AUTH_WINDOW_MS: process.env.RATE_LIMIT_AUTH_WINDOW_MS,
  RATE_LIMIT_API_MAX: process.env.RATE_LIMIT_API_MAX,
  RATE_LIMIT_API_WINDOW_MS: process.env.RATE_LIMIT_API_WINDOW_MS,
  AUTH_API_URL: process.env.AUTH_API_URL,
});
