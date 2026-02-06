import { prisma } from "../../prisma/client";
import { REWARD_TARGET_THRESHOLDS, MIN_POINTS_START } from "./progress.config";
import type {
  UserProgressResponse,
  RewardTargetProgress,
  UserTradeAnalyticsResponse,
  EquityPoint,
  RecentTradeDto,
} from "./progress.types";
import { tradeAnalyticsDataSource } from "./analytics.datasource.prisma";

/**
 * Resolve MT5 trader ID for a user by linking TradingAccount.accountNumber to Mt5TradingAccount.externalId.
 * Returns the first matching trader ID or null if none.
 */
export async function resolveMt5TraderIdForUser(userId: string): Promise<string | null> {
  const accounts = await prisma.tradingAccount.findMany({
    where: { userId },
    select: { accountNumber: true },
  });
  const accountNumbers = accounts.map((a) => a.accountNumber).filter(Boolean);
  if (accountNumbers.length === 0) return null;

  const mt5Account = await prisma.mt5TradingAccount.findFirst({
    where: { externalId: { in: accountNumbers } },
    select: { traderId: true },
  });
  return mt5Account?.traderId ?? null;
}

/** Get start of ISO week (Monday) for a date */
function getWeekStart(d: Date): Date {
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setUTCDate(diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/** Ensure win rate is 0–100 for API (DB may store 0–1). */
function normalizeWinRate(value: number): number {
  if (value > 1 && value <= 100) return value;
  if (value >= 0 && value <= 1) return value * 100;
  return value;
}

export interface GetTradeAnalyticsOptions {
  /** Limit equity curve to last N days. Omit for all time. */
  equityDays?: number;
}

/**
 * Get trade analytics for the authenticated user (KPIs, equity curve, activity, recent trades).
 * Uses ITradeAnalyticsDataSource (Prisma today; swap for MT5 when ready).
 * Resolves user -> MT5 trader; returns defaults when no linked trader or no data.
 */
export async function getTradeAnalyticsForUser(
  userId: string,
  options?: GetTradeAnalyticsOptions
): Promise<UserTradeAnalyticsResponse> {
  const traderId = await resolveMt5TraderIdForUser(userId);
  const defaults: UserTradeAnalyticsResponse = {
    winRate: 0,
    profitFactor: 0,
    drawdown: 0,
    totalTradingDays: 0,
    payoutPercent: null,
    equityData: [],
    tradesThisWeek: 0,
    tradesLastWeek: 0,
    pathToNextTier: null,
    recentTrades: [],
  };

  if (!traderId) return defaults;

  const ds = tradeAnalyticsDataSource;
  const now = new Date();
  const equityFrom = options?.equityDays
    ? new Date(now.getTime() - options.equityDays * 24 * 60 * 60 * 1000)
    : undefined;

  const [metrics, payout, closedTrades] = await Promise.all([
    ds.getMetrics(traderId),
    ds.getPayout(traderId),
    ds.getClosedTrades(traderId, { fromDate: equityFrom }),
  ]);

  const thisWeekStart = getWeekStart(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);

  let tradesThisWeek = 0;
  let tradesLastWeek = 0;
  const pnlByDay: Record<string, number> = {};
  for (const t of closedTrades) {
    const closeTime = t.closeTime;
    const net = t.profitLoss - t.fees;
    const day = closeTime.toISOString().slice(0, 10);
    pnlByDay[day] = (pnlByDay[day] ?? 0) + net;
    const weekStart = getWeekStart(closeTime);
    if (weekStart.getTime() === thisWeekStart.getTime()) tradesThisWeek++;
    else if (weekStart.getTime() === lastWeekStart.getTime()) tradesLastWeek++;
  }

  const sortedDays = Object.keys(pnlByDay).sort();
  let cumulative = 0;
  const equityData: EquityPoint[] = sortedDays.map((date) => {
    cumulative += pnlByDay[date];
    return { date, cumulativePnl: cumulative };
  });

  const recentTradesRaw = closedTrades.slice(-10).reverse();
  const recentTrades: RecentTradeDto[] = recentTradesRaw.map((t) => ({
    id: t.id,
    symbol: t.symbol,
    profitLoss: t.profitLoss,
    fees: t.fees,
    closeTime: t.closeTime.toISOString(),
    netPnl: t.profitLoss - t.fees,
  }));

  let pathToNextTier: string | null = null;
  if (payout?.payoutPercent !== undefined && payout?.payoutPercent !== null) {
    if (payout.payoutPercent <= 30) pathToNextTier = "Lower your daily average to reach 80% payout.";
    else if (payout.payoutPercent < 95) pathToNextTier = "Lower your daily average to reach 95% payout.";
    else pathToNextTier = "You're at the top payout tier.";
  }

  return {
    winRate: normalizeWinRate(metrics?.winRate ?? 0),
    profitFactor: metrics?.profitFactor ?? 0,
    drawdown: metrics?.drawdown ?? 0,
    totalTradingDays: metrics?.totalTradingDays ?? payout?.totalTradingDays ?? 0,
    payoutPercent: payout?.payoutPercent ?? null,
    equityData,
    tradesThisWeek,
    tradesLastWeek,
    pathToNextTier,
    recentTrades,
  };
}

/**
 * Compute user points from payout tier and trading activity.
 * Points increase with higher payout % and more trading days.
 */
function computePointsFromPayout(payoutPercent: number | null, totalTradingDays: number): number {
  const base = payoutPercent ?? 0;
  const activityBonus = Math.min(totalTradingDays * 2, 45);
  return Math.round(base + activityBonus);
}

/**
 * Get dashboard progress for the authenticated user: current POINTS (from payout),
 * next reward threshold in points, and which targets are unlocked.
 * Points are increased based on payout tier (30/80/95) and trading days.
 */
export async function getProgressForUser(userId: string): Promise<UserProgressResponse> {
  const traderId = await resolveMt5TraderIdForUser(userId);
  let currentPoints = 0;

  if (traderId) {
    const [payout, metrics] = await Promise.all([
      prisma.traderPayout.findUnique({
        where: { traderId },
        select: { payoutPercent: true, totalTradingDays: true },
      }),
      prisma.mt5TraderMetrics.findUnique({
        where: { traderId },
        select: { totalTradingDays: true },
      }),
    ]);
    const totalTradingDays = metrics?.totalTradingDays ?? payout?.totalTradingDays ?? 0;
    currentPoints = computePointsFromPayout(payout?.payoutPercent ?? null, totalTradingDays);
  }

  const pointsToReturn = Math.max(currentPoints, MIN_POINTS_START);

  const rewardTargets: RewardTargetProgress[] = REWARD_TARGET_THRESHOLDS.map((requiredPoints, index) => {
    const id = index + 1;
    const unlocked = pointsToReturn >= requiredPoints;
    const canUnlock = unlocked;
    return {
      id,
      label: id === 1 ? "Unlocked" : `Target ${id}`,
      unlocked,
      canUnlock,
      requiredPoints,
      requiredLevel: requiredPoints,
    };
  });

  const firstLocked = rewardTargets.find((t) => !t.unlocked);
  const nextRewardThreshold = firstLocked?.requiredPoints ?? 100;

  return {
    currentPoints: pointsToReturn,
    nextRewardThreshold,
    rewardTargets,
    currentLevel: pointsToReturn,
  };
}
