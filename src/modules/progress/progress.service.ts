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
import {
  conclaveAnalyticsDataSource,
  getConclaveBalanceAndHwm,
  isConclaveAvailable,
} from "./conclave.datasource";

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
export async function resolveMt5TraderIdForUser(
  ccUserId: string,
  selectedTraderId?: string | null
): Promise<string | null> {
  try {
    if (selectedTraderId?.trim()) {
      const link = await prisma.userTraderLink.findUnique({
        where: { ccUserId_mt5TraderId: { ccUserId, mt5TraderId: selectedTraderId.trim() } },
      });
      if (link) return link.mt5TraderId;
    }
    const primary = await prisma.userTraderLink.findFirst({
      where: { ccUserId, isPrimary: true },
      select: { mt5TraderId: true },
    });
    if (primary) return primary.mt5TraderId;
    const anyLink = await prisma.userTraderLink.findFirst({
      where: { ccUserId },
      select: { mt5TraderId: true },
      orderBy: { createdAt: "asc" },
    });
    if (anyLink) return anyLink.mt5TraderId;
    const token = await prisma.storedAuthToken.findFirst({
      where: { ccUserId },
      select: { mt5TraderId: true },
    });
    return token?.mt5TraderId?.trim() ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve Conclave login (MT5 account number) from stored mt5TraderId.
 * In cc-conclave setup, user_trader_links.mt5TraderId is the login (number as string). If numeric, use as-is; else try mt5_traders.externalId if that table exists.
 */
async function resolveConclaveLogin(traderId: string): Promise<string | null> {
  const trimmed = traderId.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  try {
    const t = await prisma.mt5Trader.findUnique({
      where: { id: trimmed },
      select: { externalId: true },
    });
    return t?.externalId?.trim() ?? null;
  } catch {
    return null;
  }
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
 * Get trade analytics for the authenticated Capital Chain user.
 * Resolves to a single MT5 account ID (see resolveMt5TraderIdForUser); returns analytics for that account only.
 * Returns defaults when no linked MT5 account or no data.
 */
export async function getTradeAnalyticsForUser(
  userId: string,
  options?: GetTradeAnalyticsOptions & { selectedTraderId?: string | null }
): Promise<UserTradeAnalyticsResponse> {
  const traderId = await resolveMt5TraderIdForUser(userId, options?.selectedTraderId);
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
    currentBalance: null,
    hwmBalance: null,
  };

  if (!traderId) return defaults;

  const now = new Date();
  const equityFrom = options?.equityDays
    ? new Date(now.getTime() - options.equityDays * 24 * 60 * 60 * 1000)
    : undefined;

  const conclaveLogin = await resolveConclaveLogin(traderId);
  const useConclave =
    (await isConclaveAvailable()) && conclaveLogin !== null && conclaveLogin !== "";

  let metrics: Awaited<ReturnType<typeof tradeAnalyticsDataSource.getMetrics>> = null;
  let payout: Awaited<ReturnType<typeof tradeAnalyticsDataSource.getPayout>> = null;
  let closedTrades: Awaited<ReturnType<typeof tradeAnalyticsDataSource.getClosedTrades>> = [];
  let currentBalance: number | null = null;
  let hwmBalance: number | null = null;

  if (useConclave) {
    const [m, p, trades, balanceHwm] = await Promise.all([
      conclaveAnalyticsDataSource.getMetrics(conclaveLogin),
      conclaveAnalyticsDataSource.getPayout(conclaveLogin),
      conclaveAnalyticsDataSource.getClosedTrades(conclaveLogin, { fromDate: equityFrom }),
      getConclaveBalanceAndHwm(conclaveLogin),
    ]);
    metrics = m;
    payout = p;
    closedTrades = trades;
    currentBalance = balanceHwm.currentBalance;
    hwmBalance = balanceHwm.hwmBalance;
  }

  if (!useConclave) {
    const ds = tradeAnalyticsDataSource;
    const [m, p, trades, accountBalances] = await Promise.all([
      ds.getMetrics(traderId),
      ds.getPayout(traderId),
      ds.getClosedTrades(traderId, { fromDate: equityFrom }),
      prisma.mt5TradingAccount.findMany({
        where: { traderId },
        select: { balance: true },
      }),
    ]);
    metrics = m;
    payout = p;
    closedTrades = trades;
    currentBalance =
      accountBalances.length > 0
        ? accountBalances.reduce((sum, a) => sum + Number(a.balance), 0)
        : null;
  }

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

  let avgTradeSize = 0;
  let avgTradeDuration = "0m";
  if (closedTrades.length > 0) {
    const withVolume = closedTrades.filter((t) => t.volume != null);
    avgTradeSize = withVolume.length > 0
      ? withVolume.reduce((s, t) => s + (t.volume ?? 0), 0) / withVolume.length
      : 0;
    const withOpen = closedTrades.filter((t) => t.openTime != null && t.closeTime != null);
    if (withOpen.length > 0) {
      const totalMs = withOpen.reduce(
        (s, t) => s + (t.closeTime.getTime() - (t.openTime?.getTime() ?? t.closeTime.getTime())),
        0
      );
      const avgMs = totalMs / withOpen.length;
      const h = Math.floor(avgMs / 3600000);
      const m = Math.floor((avgMs % 3600000) / 60000);
      const sec = Math.floor((avgMs % 60000) / 1000);
      avgTradeDuration = h > 0 ? `${h}h:${m}m:${sec}s` : m > 0 ? `${m}m:${sec}s` : `${sec}s`;
    }
  }

  let pathToNextTier: string | null = null;
  if (payout?.payoutPercent !== undefined && payout?.payoutPercent !== null) {
    if (payout.payoutPercent <= 30) pathToNextTier = "Lower your daily average to reach 80% payout.";
    else if (payout.payoutPercent < 95) pathToNextTier = "Lower your daily average to reach 95% payout.";
    else pathToNextTier = "You're at the top payout tier.";
  }

  const netProfit = equityData.length > 0 ? equityData[equityData.length - 1].cumulativePnl : 0;
  const maxCumulativePnl =
    equityData.length > 0 ? Math.max(...equityData.map((e) => e.cumulativePnl), 0) : 0;
  const derivedHwm =
    currentBalance != null
      ? currentBalance - netProfit + maxCumulativePnl
      : null;
  if (hwmBalance == null) hwmBalance = derivedHwm;

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
    avgTradeSize,
    avgTradeDuration,
    currentBalance: currentBalance ?? undefined,
    hwmBalance: hwmBalance ?? undefined,
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

function getDefaultProgressResponse(): UserProgressResponse {
  const pointsToReturn = MIN_POINTS_START;
  const rewardTargets: RewardTargetProgress[] = REWARD_TARGET_THRESHOLDS.map((requiredPoints, index) => {
    const id = index + 1;
    const unlocked = pointsToReturn >= requiredPoints;
    return {
      id,
      label: id === 1 ? "Unlocked" : `Target ${id}`,
      unlocked,
      canUnlock: unlocked,
      requiredPoints,
      requiredLevel: requiredPoints,
    };
  });
  const firstLocked = rewardTargets.find((t) => !t.unlocked);
  return {
    currentPoints: pointsToReturn,
    nextRewardThreshold: firstLocked?.requiredPoints ?? 100,
    rewardTargets,
    currentLevel: pointsToReturn,
  };
}

/**
 * Get dashboard progress for the authenticated Capital Chain user.
 * Resolves to a single MT5 account ID; progress (points, targets) is for that account only.
 * Never throws: returns default progress on any DB/error.
 */
export async function getProgressForUser(
  userId: string,
  selectedTraderId?: string | null
): Promise<UserProgressResponse> {
  try {
    const traderId = await resolveMt5TraderIdForUser(userId, selectedTraderId);
    let currentPoints = 0;

    if (traderId) {
      try {
        const conclaveLogin = await resolveConclaveLogin(traderId);
        const useConclave =
          (await isConclaveAvailable()) && conclaveLogin !== null && conclaveLogin !== "";
        if (useConclave) {
          const metrics = await conclaveAnalyticsDataSource.getMetrics(conclaveLogin);
          const totalTradingDays = metrics?.totalTradingDays ?? 0;
          currentPoints = computePointsFromPayout(null, totalTradingDays);
        } else {
          const metrics = await prisma.mt5TraderMetrics.findUnique({
            where: { traderId },
            select: { totalTradingDays: true },
          });
          const totalTradingDays = metrics?.totalTradingDays ?? 0;
          currentPoints = computePointsFromPayout(null, totalTradingDays);
        }
      } catch {
        // metrics may be missing; keep currentPoints 0
      }
    }

    const pointsToReturn = Math.max(currentPoints, MIN_POINTS_START);
    const rewardTargets: RewardTargetProgress[] = REWARD_TARGET_THRESHOLDS.map((requiredPoints, index) => {
      const id = index + 1;
      const unlocked = pointsToReturn >= requiredPoints;
      return {
        id,
        label: id === 1 ? "Unlocked" : `Target ${id}`,
        unlocked,
        canUnlock: unlocked,
        requiredPoints,
        requiredLevel: requiredPoints,
      };
    });
    const firstLocked = rewardTargets.find((t) => !t.unlocked);
    return {
      currentPoints: pointsToReturn,
      nextRewardThreshold: firstLocked?.requiredPoints ?? 100,
      rewardTargets,
      currentLevel: pointsToReturn,
    };
  } catch {
    return getDefaultProgressResponse();
  }
}
