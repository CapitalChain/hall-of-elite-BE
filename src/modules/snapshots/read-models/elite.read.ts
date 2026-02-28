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

const DEFAULT_BADGES: TraderSnapshotBadges = {
  phoenixAddOn: false,
  payoutBoost: false,
  cashback: false,
  merchandise: false,
};

const DEFAULT_METRICS: TraderSnapshotMetricsSummary = {
  profitFactor: 0,
  winRatePct: 0,
  drawdownPct: 0,
  tradingDays: 0,
  totalTrades: 0,
};

const VALID_TIERS = new Set<string>(Object.values(TraderTier));

function toTraderTier(tier: string | null): TraderTier {
  if (tier && VALID_TIERS.has(tier)) return tier as TraderTier;
  return TraderTier.BRONZE;
}

/**
 * Fetch elite leaderboard from mt5_traders + mt5_trader_scores when no snapshot exists.
 * Use this so DB data (cc-conclave) shows on /elite even before running the snapshot pipeline.
 * Uses rank when set; otherwise orders by consistencyScore and assigns implicit rank.
 */
export const getEliteLeaderboardFromTraderScores = async (
  limit = 100
): Promise<EliteListItem[]> => {
  const scores = await prisma.mt5TraderScore.findMany({
    take: limit * 2,
    include: { trader: true },
  });

  if (scores.length === 0) return [];

  // Prefer rank when set; else sort by consistencyScore and assign rank 1,2,3...
  const withRank = scores.filter((s) => s.rank != null).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const withoutRank = scores.filter((s) => s.rank == null).sort((a, b) => b.consistencyScore - a.consistencyScore);
  const ordered = withRank.length > 0 ? withRank : withoutRank;
  const takeScores = ordered.slice(0, limit);

  const metricsByTraderId = new Map<string, { profitFactor: number; winRate: number; drawdown: number; totalTradingDays: number }>();
  const metricsRows = await prisma.mt5TraderMetrics.findMany({
    where: { traderId: { in: takeScores.map((s) => s.traderId) } },
  });
  metricsRows.forEach((m) => {
    metricsByTraderId.set(m.traderId, {
      profitFactor: m.profitFactor,
      winRate: m.winRate,
      drawdown: m.drawdown,
      totalTradingDays: m.totalTradingDays,
    });
  });

  return takeScores.map((row, index) => {
    const metrics = metricsByTraderId.get(row.traderId);
    return {
      traderId: row.traderId,
      externalTraderId: row.trader.externalId,
      displayName: row.trader.name,
      score: row.consistencyScore,
      rank: row.rank ?? index + 1,
      tier: toTraderTier(row.tier),
      badges: DEFAULT_BADGES,
      metrics: metrics
        ? {
            profitFactor: metrics.profitFactor,
            winRatePct: metrics.winRate * 100,
            drawdownPct: metrics.drawdown * 100,
            tradingDays: metrics.totalTradingDays,
            totalTrades: 0,
          }
        : DEFAULT_METRICS,
    };
  });
};

/**
 * Fetch elite leaderboard from snapshot (snapshot_runs / trader_snapshots).
 * Tables were dropped – return [] so getEliteLeaderboard uses MT5 tables only.
 */
export const getEliteLeaderboardFromLatestSnapshot = async (
  _limit = 100
): Promise<EliteListItem[]> => {
  try {
    const latestRun = await prisma.snapshotRun.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (!latestRun) return [];

    const rows = await prisma.traderSnapshot.findMany({
      where: { snapshotId: latestRun.id },
      orderBy: { rank: "asc" },
      take: _limit,
    });
    if (rows.length === 0) return [];

    const traderIds = rows.map((row) => row.traderId);
    const traders = await prisma.mt5Trader.findMany({
      where: { id: { in: traderIds } },
    });
    const nameById = new Map(traders.map((t) => [t.id, t.name]));

    return rows.map((row) => ({
      traderId: row.traderId,
      externalTraderId: row.externalTraderId,
      displayName: nameById.get(row.traderId) ?? row.externalTraderId,
      score: row.score,
      rank: row.rank,
      tier: row.tier as TraderTier,
      badges: row.badges as unknown as TraderSnapshotBadges,
      metrics: row.metrics as unknown as TraderSnapshotMetricsSummary,
    }));
  } catch {
    return [];
  }
};

import { getEliteLeaderboardFromConclave, isConclaveAvailable } from "../../progress/conclave-elite";

/**
 * Get elite leaderboard: CC Conclave (accounts + deals) first when available, else mt5_traders + mt5_trader_scores.
 */
export const getEliteLeaderboard = async (limit = 100): Promise<EliteListItem[]> => {
  try {
    if (await isConclaveAvailable()) {
      const list = await getEliteLeaderboardFromConclave(limit);
      if (list.length > 0) return list as EliteListItem[];
    }
  } catch {
    // fallback to mt5 tables
  }
  return getEliteLeaderboardFromTraderScores(limit);
};
