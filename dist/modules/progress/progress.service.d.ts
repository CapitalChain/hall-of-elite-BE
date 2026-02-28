import type { UserProgressResponse, UserTradeAnalyticsResponse } from "./progress.types";
/**
 * Multi-account model: one Capital Chain account (email/user) can have multiple MT5 account IDs.
 * Each MT5 ID is one MT5 account; progress and analytics are always for a single resolved account.
 *
 * Resolves which MT5 account ID to use for this CC user, in order:
 * 1. selectedTraderId (from query/header) if the user has that MT5 account linked
 * 2. Primary MT5 account from user_trader_links
 * 3. First linked MT5 account (by creation date)
 * 4. Legacy: mt5TraderId from auth_tokens (e.g. from initial store-token)
 * 5. null (no account → default progress/empty analytics)
 */
export declare function resolveMt5TraderIdForUser(ccUserId: string, selectedTraderId?: string | null): Promise<string | null>;
export interface GetTradeAnalyticsOptions {
    /** Limit equity curve to last N days. Omit for all time. */
    equityDays?: number;
}
/**
 * Get trade analytics for the authenticated Capital Chain user.
 * Resolves to a single MT5 account ID (see resolveMt5TraderIdForUser); returns analytics for that account only.
 * Returns defaults when no linked MT5 account or no data.
 */
export declare function getTradeAnalyticsForUser(userId: string, options?: GetTradeAnalyticsOptions & {
    selectedTraderId?: string | null;
}): Promise<UserTradeAnalyticsResponse>;
/**
 * Get dashboard progress for the authenticated Capital Chain user.
 * Resolves to a single MT5 account ID; progress (points, targets) is for that account only.
 * Never throws: returns default progress on any DB/error.
 */
export declare function getProgressForUser(userId: string, selectedTraderId?: string | null): Promise<UserProgressResponse>;
//# sourceMappingURL=progress.service.d.ts.map