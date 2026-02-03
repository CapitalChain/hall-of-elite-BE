import { prisma } from "../../../prisma/client";
import { TraderTier } from "../../../types";
import {
  TraderSnapshotBadges,
  TraderSnapshotMetricsSummary,
} from "../types/snapshot.types";

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
 * Fetch elite leaderboard data from the latest snapshot run.
 * Read-only, snapshot-based view for the /elite page.
 */
export const getEliteLeaderboardFromLatestSnapshot = async (
  limit = 100
): Promise<EliteListItem[]> => {
  const latestRun = await prisma.snapshotRun.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!latestRun) {
    return [];
  }

  const rows = await prisma.traderSnapshot.findMany({
    where: { snapshotId: latestRun.id },
    orderBy: { rank: "asc" },
    take: limit,
  });

  if (rows.length === 0) {
    return [];
  }

  const traderIds = rows.map((row) => row.traderId);
  const traders = await prisma.mt5Trader.findMany({
    where: {
      id: { in: traderIds },
    },
  });

  const nameById = new Map(traders.map((t) => [t.id, t.name]));

  return rows.map((row) => ({
    traderId: row.traderId,
    externalTraderId: row.externalTraderId,
    displayName: nameById.get(row.traderId) ?? row.externalTraderId,
    score: row.score,
    rank: row.rank,
    tier: row.tier as TraderTier,
    badges: row.badges as TraderSnapshotBadges,
    metrics: row.metrics as TraderSnapshotMetricsSummary,
  }));
};
