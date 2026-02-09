/**
 * Stricter rate limit for auth routes (login, register, logout).
 * Reduces brute-force and credential-stuffing risk.
 */
export declare const authRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * General rate limit for public API routes (traders, rewards, scoring, payout, health, etc.).
 * Mitigates abuse and DDoS.
 */
export declare const apiRateLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimit.d.ts.map