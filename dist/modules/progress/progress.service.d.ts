import type { UserProgressResponse, UserTradeAnalyticsResponse } from "./progress.types";
/**
 * Resolve MT5 trader ID for a user by linking TradingAccount.accountNumber to Mt5TradingAccount.externalId.
 * Returns the first matching trader ID or null if none.
 */
export declare function resolveMt5TraderIdForUser(userId: string): Promise<string | null>;
export interface GetTradeAnalyticsOptions {
    /** Limit equity curve to last N days. Omit for all time. */
    equityDays?: number;
}
/**
 * Get trade analytics for the authenticated user (KPIs, equity curve, activity, recent trades).
 * Uses ITradeAnalyticsDataSource (Prisma today; swap for MT5 when ready).
 * Resolves user -> MT5 trader; returns defaults when no linked trader or no data.
 */
export declare function getTradeAnalyticsForUser(userId: string, options?: GetTradeAnalyticsOptions): Promise<UserTradeAnalyticsResponse>;
/**
 * Get dashboard progress for the authenticated user: current POINTS (from payout),
 * next reward threshold in points, and which targets are unlocked.
 * Points are increased based on payout tier (30/80/95) and trading days.
 */
export declare function getProgressForUser(userId: string): Promise<UserProgressResponse>;
//# sourceMappingURL=progress.service.d.ts.map