import { prisma } from "../../../prisma/client";
import { TraderTier } from "../../../types";
import {
  TraderSnapshotBadges,
  TraderSnapshotMetricsSummary,
} from "../types/snapshot.types";

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
export const getTraderProfileFromLatestSnapshot = async (
  _traderId: string
): Promise<TraderProfileSnapshot | null> => {
  try {
    const latestRun = await prisma.snapshotRun.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (!latestRun) return null;

    const row = await prisma.traderSnapshot.findFirst({
      where: { snapshotId: latestRun.id, traderId: _traderId },
    });
    if (!row) return null;

    const trader = await prisma.mt5Trader.findUnique({
      where: { id: _traderId },
    });
    return {
      traderId: row.traderId,
      externalTraderId: row.externalTraderId,
      displayName: trader?.name ?? row.externalTraderId,
      score: row.score,
      rank: row.rank,
      tier: row.tier as TraderTier,
      badges: row.badges as unknown as TraderSnapshotBadges,
      metrics: row.metrics as unknown as TraderSnapshotMetricsSummary,
    };
  } catch {
    return null;
  }
};
