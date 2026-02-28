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
 * Fetch elite leaderboard from snapshot (snapshot_runs / trader_snapshots).
 * Tables were dropped – return [] so getEliteLeaderboard uses MT5 tables only.
 */
export declare const getEliteLeaderboardFromLatestSnapshot: (_limit?: number) => Promise<EliteListItem[]>;
/**
 * Get elite leaderboard: CC Conclave (accounts + deals) first when available, else mt5_traders + mt5_trader_scores.
 */
export declare const getEliteLeaderboard: (limit?: number) => Promise<EliteListItem[]>;
//# sourceMappingURL=elite.read.d.ts.map