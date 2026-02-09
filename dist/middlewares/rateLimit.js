"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRateLimiter = exports.authRateLimiter = void 0;
const express_rate_limit_1 = require("express-rate-limit");
const env_1 = require("../config/env");
const WINDOW_15_MIN = 15 * 60 * 1000;
function parseRateLimitEnv(value, fallback) {
    if (value === undefined || value === "")
        return fallback;
    const n = parseInt(value, 10);
    return Number.isNaN(n) || n < 1 ? fallback : n;
}
function rateLimitHandler(req, res) {
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
exports.authRateLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: parseRateLimitEnv(env_1.env.RATE_LIMIT_AUTH_WINDOW_MS, WINDOW_15_MIN),
    limit: parseRateLimitEnv(env_1.env.RATE_LIMIT_AUTH_MAX, 10),
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});
/**
 * General rate limit for public API routes (traders, rewards, scoring, payout, health, etc.).
 * Mitigates abuse and DDoS.
 */
exports.apiRateLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: parseRateLimitEnv(env_1.env.RATE_LIMIT_API_WINDOW_MS, WINDOW_15_MIN),
    limit: parseRateLimitEnv(env_1.env.RATE_LIMIT_API_MAX, 200),
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});
//# sourceMappingURL=rateLimit.js.map