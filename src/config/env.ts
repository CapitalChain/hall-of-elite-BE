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
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
});
