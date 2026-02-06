import { prisma } from "../../prisma/client";
import type {
  ITradeAnalyticsDataSource,
  TraderMetricsRow,
  TraderPayoutRow,
  ClosedTradeRow,
} from "./analytics.datasource.types";

/**
 * Prisma-backed data source for trade analytics.
 * Replace or wrap this with an MT5 client when MT5 integration is ready.
 */
export const tradeAnalyticsDataSource: ITradeAnalyticsDataSource = {
  async getMetrics(traderId: string): Promise<TraderMetricsRow | null> {
    const row = await prisma.mt5TraderMetrics.findUnique({
      where: { traderId },
      select: { winRate: true, profitFactor: true, drawdown: true, totalTradingDays: true },
    });
    if (!row) return null;
    return {
      winRate: row.winRate,
      profitFactor: row.profitFactor,
      drawdown: row.drawdown,
      totalTradingDays: row.totalTradingDays,
    };
  },

  async getPayout(traderId: string): Promise<TraderPayoutRow | null> {
    const row = await prisma.traderPayout.findUnique({
      where: { traderId },
      select: { payoutPercent: true, averageTradesPerDay: true, totalTradingDays: true },
    });
    if (!row) return null;
    return {
      payoutPercent: row.payoutPercent,
      averageTradesPerDay: row.averageTradesPerDay,
      totalTradingDays: row.totalTradingDays,
    };
  },

  async getClosedTrades(
    traderId: string,
    options?: { fromDate?: Date; toDate?: Date; limit?: number }
  ): Promise<ClosedTradeRow[]> {
    const accounts = await prisma.mt5TradingAccount.findMany({
      where: { traderId },
      select: { id: true },
    });
    const accountIds = accounts.map((a) => a.id);
    if (accountIds.length === 0) return [];

    const closeTimeFilter: { not: null; gte?: Date; lte?: Date } = { not: null };
    if (options?.fromDate) closeTimeFilter.gte = options.fromDate;
    if (options?.toDate) closeTimeFilter.lte = options.toDate;

    const where = {
      accountId: { in: accountIds },
      closeTime: closeTimeFilter,
    };

    const trades = await prisma.mt5Trade.findMany({
      where,
      select: { id: true, symbol: true, profitLoss: true, fees: true, closeTime: true },
      orderBy: { closeTime: "asc" },
      ...(options?.limit != null && { take: options.limit }),
    });

    return trades.map((t) => ({
      id: t.id,
      symbol: t.symbol,
      profitLoss: t.profitLoss,
      fees: t.fees,
      closeTime: t.closeTime as Date,
    }));
  },
};
