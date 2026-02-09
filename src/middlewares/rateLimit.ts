import { rateLimit } from "express-rate-limit";
import { Request, Response } from "express";
import { env } from "../config/env";

const WINDOW_15_MIN = 15 * 60 * 1000;

function parseRateLimitEnv(value: string | undefined, fallback: number): number {
  if (value === undefined || value === "") return fallback;
  const n = parseInt(value, 10);
  return Number.isNaN(n) || n < 1 ? fallback : n;
}

function rateLimitHandler(req: Request, res: Response): void {
  res.status(429).json({
    success: false,
    error: "Too many requests. Please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  });
}

/**
 * Stricter rate limit for auth routes (login, register, logout).
 * Reduces brute-force and credential-stuffing risk.
 */
export const authRateLimiter = rateLimit({
  windowMs: parseRateLimitEnv(env.RATE_LIMIT_AUTH_WINDOW_MS, WINDOW_15_MIN),
  limit: parseRateLimitEnv(env.RATE_LIMIT_AUTH_MAX, 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * General rate limit for public API routes (traders, rewards, scoring, payout, health, etc.).
 * Mitigates abuse and DDoS.
 */
export const apiRateLimiter = rateLimit({
  windowMs: parseRateLimitEnv(env.RATE_LIMIT_API_WINDOW_MS, WINDOW_15_MIN),
  limit: parseRateLimitEnv(env.RATE_LIMIT_API_MAX, 200),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
