"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
/**
 * Environment configuration loader.
 * Created to validate and expose app config from .env at startup.
 */
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
// Load environment variables from .env file
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    PORT: zod_1.z.string().default("6200"),
    DATABASE_URL: zod_1.z.string().url(),
    CORS_ORIGIN: zod_1.z.string().default("http://localhost:6100"),
    /** Comma-separated list of additional CORS origins (e.g. production frontend URL) */
    CORS_ORIGINS: zod_1.z.string().optional(),
    JWT_SECRET: zod_1.z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: zod_1.z.string().default("7d"),
    // MT5 Configuration
    MT5_SERVER: zod_1.z.string().optional(),
    MT5_LOGIN: zod_1.z.string().optional(),
    MT5_PASSWORD: zod_1.z.string().optional(),
    MT5_API_URL: zod_1.z.string().url().optional(),
    MT5_API_KEY: zod_1.z.string().optional(),
    MT5_RETRY_ATTEMPTS: zod_1.z.string().default("3"),
    MT5_RETRY_DELAY_MS: zod_1.z.string().default("1000"),
    // Rate limiting (optional; defaults below)
    RATE_LIMIT_AUTH_MAX: zod_1.z.string().optional(),
    RATE_LIMIT_AUTH_WINDOW_MS: zod_1.z.string().optional(),
    RATE_LIMIT_API_MAX: zod_1.z.string().optional(),
    RATE_LIMIT_API_WINDOW_MS: zod_1.z.string().optional(),
});
exports.env = envSchema.parse({
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
});
//# sourceMappingURL=env.js.map