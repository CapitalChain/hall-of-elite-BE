import { TraderTier } from "../../../types";
import { TraderSnapshotBadges, TraderSnapshotMetricsSummary } from "../types/snapshot.types";
export interface EliteListItem {
    readonly traderId: string;
    readonly externalTraderId: string;
    readonly displayName: string;
    readonly score: number;
    readonly rank: number;
    readonly tier: TraderTier;
    readonly badges: TraderSnapshotBadges;
    readonly metrics: TraderSnapshotMetricsSummary;
}
/**
 * Fetch elite leaderboard from mt5_traders + mt5_trader_scores when no snapshot exists.
 * Use this so DB data (cc-conclave) shows on /elite even before running the snapshot pipeline.
 * Uses rank when set; otherwise orders by consistencyScore and assigns implicit rank.
 */
export declare const getEliteLeaderboardFromTraderScores: (limit?: number) => Promise<EliteListItem[]>;
/**
 * Fetch elite leaderboard data from the latest snapshot run.
 * Read-only, snapshot-based view for the /elite page.
 */
export declare const getEliteLeaderboardFromLatestSnapshot: (limit?: number) => Promise<EliteListItem[]>;
/**
 * Get elite leaderboard: snapshot first, then mt5_trader_scores, so DB data always shows.
 */
export declare const getEliteLeaderboard: (limit?: number) => Promise<EliteListItem[]>;
//# sourceMappingURL=elite.read.d.ts.map