import { TraderTier } from "../../../types";
import { TraderSnapshotBadges, TraderSnapshotMetricsSummary } from "../types/snapshot.types";
export interface TraderProfileSnapshot {
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
 * Read model for /elite/[id] – snapshot tables (snapshot_runs, trader_snapshots) were dropped.
 * Returns null so trader controller uses MT5 tables (getTraderProfile from mt5_traders/scores/metrics).
 */
export declare const getTraderProfileFromLatestSnapshot: (_traderId: string) => Promise<TraderProfileSnapshot | null>;
//# sourceMappingURL=traderProfile.read.d.ts.map