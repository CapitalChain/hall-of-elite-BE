"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradeAnalyticsDataSource = void 0;
const client_1 = require("../../prisma/client");
/**
 * Prisma-backed data source for trade analytics.
 * Replace or wrap this with an MT5 client when MT5 integration is ready.
 */
exports.tradeAnalyticsDataSource = {
    async getMetrics(traderId) {
        const row = await client_1.prisma.mt5TraderMetrics.findUnique({
            where: { traderId },
            select: { winRate: true, profitFactor: true, drawdown: true, totalTradingDays: true },
        });
        if (!row)
            return null;
        return {
            winRate: row.winRate,
            profitFactor: row.profitFactor,
            drawdown: row.drawdown,
            totalTradingDays: row.totalTradingDays,
        };
    },
    async getPayout(traderId) {
        const row = await client_1.prisma.traderPayout.findUnique({
            where: { traderId },
            select: { payoutPercent: true, averageTradesPerDay: true, totalTradingDays: true },
        });
        if (!row)
            return null;
        return {
            payoutPercent: row.payoutPercent,
            averageTradesPerDay: row.averageTradesPerDay,
            totalTradingDays: row.totalTradingDays,
        };
    },
    async getClosedTrades(traderId, options) {
        const accounts = await client_1.prisma.mt5TradingAccount.findMany({
            where: { traderId },
            select: { id: true },
        });
        const accountIds = accounts.map((a) => a.id);
        if (accountIds.length === 0)
            return [];
        const closeTimeFilter = { not: null };
        if (options?.fromDate)
            closeTimeFilter.gte = options.fromDate;
        if (options?.toDate)
            closeTimeFilter.lte = options.toDate;
        const where = {
            accountId: { in: accountIds },
            closeTime: closeTimeFilter,
        };
        const trades = await client_1.prisma.mt5Trade.findMany({
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
            closeTime: t.closeTime,
        }));
    },
};
//# sourceMappingURL=analytics.datasource.prisma.js.map