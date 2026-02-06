"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutService = exports.PayoutService = void 0;
const client_1 = require("../../prisma/client");
const payout_types_1 = require("./payout.types");
/**
 * Default payout tier configuration
 * Formula: average = max trades per day / total trading days
 */
const DEFAULT_PAYOUT_TIERS = [
    {
        minAverage: 0.4,
        maxAverage: 1.0,
        payoutPercent: 30,
        tier: payout_types_1.PayoutLevel.BRONZE,
        color: "#10B981",
        description: "High activity trader - 30% payout",
    },
    {
        minAverage: 0.2,
        maxAverage: 0.4,
        payoutPercent: 80,
        tier: payout_types_1.PayoutLevel.SILVER,
        color: "#F59E0B",
        description: "Medium activity trader - 80% payout",
    },
    {
        minAverage: 0,
        maxAverage: 0.2,
        payoutPercent: 95,
        tier: payout_types_1.PayoutLevel.GOLD,
        color: "#FBBF24",
        description: "Low activity trader - 95% payout",
    },
];
class PayoutService {
    /**
     * Initialize default payout tiers if they don't exist
     */
    async initializePayoutTiers() {
        for (const tierConfig of DEFAULT_PAYOUT_TIERS) {
            const existing = await client_1.prisma.payoutTier.findFirst({
                where: {
                    tier: tierConfig.tier,
                },
            });
            if (!existing) {
                await client_1.prisma.payoutTier.create({
                    data: tierConfig,
                });
            }
        }
    }
    /**
     * Calculate payout tier based on trading activity
     * Formula: average = maxTradesPerDay / totalTradingDays
     */
    calculatePayoutTier(input) {
        const { traderId, maxTradesPerDay, totalTradingDays } = input;
        if (totalTradingDays === 0) {
            throw new Error("Total trading days must be greater than 0");
        }
        const averageTradesPerDay = maxTradesPerDay / totalTradingDays;
        let payoutTier = DEFAULT_PAYOUT_TIERS[0]; // Default to BRONZE
        if (averageTradesPerDay < 0.2) {
            payoutTier = DEFAULT_PAYOUT_TIERS[2]; // GOLD - 95%
        }
        else if (averageTradesPerDay < 0.4) {
            payoutTier = DEFAULT_PAYOUT_TIERS[1]; // SILVER - 80%
        }
        return {
            traderId,
            averageTradesPerDay,
            payoutPercent: payoutTier.payoutPercent,
            tier: payoutTier.tier,
            color: payoutTier.color,
            description: payoutTier.description,
        };
    }
    /**
     * Update or create trader payout record
     */
    async updateTraderPayout(input) {
        const calculation = this.calculatePayoutTier(input);
        const payoutTier = await client_1.prisma.payoutTier.findFirst({
            where: {
                tier: calculation.tier,
            },
        });
        if (!payoutTier) {
            throw new Error(`Payout tier not found for tier: ${calculation.tier}`);
        }
        const traderPayout = await client_1.prisma.traderPayout.upsert({
            where: { traderId: input.traderId },
            create: {
                traderId: input.traderId,
                payoutTierId: payoutTier.id,
                payoutPercent: calculation.payoutPercent,
                averageTradesPerDay: calculation.averageTradesPerDay,
                totalTradingDays: input.totalTradingDays,
                maxTradesPerDay: input.maxTradesPerDay,
            },
            update: {
                payoutTierId: payoutTier.id,
                payoutPercent: calculation.payoutPercent,
                averageTradesPerDay: calculation.averageTradesPerDay,
                totalTradingDays: input.totalTradingDays,
                maxTradesPerDay: input.maxTradesPerDay,
            },
            include: {
                payoutTier: true,
            },
        });
        return this.mapToDTO(traderPayout);
    }
    /**
     * Get trader payout information
     */
    async getTraderPayout(traderId) {
        const traderPayout = await client_1.prisma.traderPayout.findUnique({
            where: { traderId },
            include: {
                payoutTier: true,
            },
        });
        if (!traderPayout) {
            return null;
        }
        return this.mapToDTO(traderPayout);
    }
    /**
     * Get all payout tiers
     */
    async getPayoutTiers() {
        return await client_1.prisma.payoutTier.findMany({
            orderBy: { order: "asc" },
        });
    }
    /**
     * Derive max trades per day and total trading days from MT5 trades for a trader.
     * Formula: average = maxTradesPerDay / totalTradingDays.
     * Used when calculating payout from actual trade data.
     * Returns null if MT5 tables are missing or no data (e.g. before MT5 integration is set up).
     */
    async getTradeStatsForTrader(traderId) {
        try {
            const accounts = await client_1.prisma.mt5TradingAccount.findMany({
                where: { traderId },
                select: { id: true },
            });
            if (accounts.length === 0)
                return null;
            const accountIds = accounts.map((a) => a.id);
            const trades = await client_1.prisma.mt5Trade.findMany({
                where: {
                    accountId: { in: accountIds },
                    closeTime: { not: null },
                },
                select: { closeTime: true },
            });
            if (trades.length === 0)
                return null;
            const tradesPerDay = {};
            for (const t of trades) {
                const day = t.closeTime.toISOString().slice(0, 10);
                tradesPerDay[day] = (tradesPerDay[day] ?? 0) + 1;
            }
            const counts = Object.values(tradesPerDay);
            const maxTradesPerDay = Math.max(...counts);
            const totalTradingDays = counts.length;
            return { maxTradesPerDay, totalTradingDays };
        }
        catch {
            // MT5 tables (mt5_trading_accounts, mt5_trades) may not exist yet; return null so UI can show "no data"
            return null;
        }
    }
    /**
     * Calculate and update trader payout from actual MT5 trade data.
     * Uses: average = maxTradesPerDay / totalTradingDays; then tier by average (< 20% → 95%, < 40% → 80%, else 30%).
     */
    async calculatePayoutFromTrades(traderId) {
        const stats = await this.getTradeStatsForTrader(traderId);
        if (!stats || stats.totalTradingDays === 0)
            return null;
        return this.updateTraderPayout({
            traderId,
            maxTradesPerDay: stats.maxTradesPerDay,
            totalTradingDays: stats.totalTradingDays,
        });
    }
    /**
     * Map database record to DTO
     */
    mapToDTO(record) {
        return {
            id: record.id,
            traderId: record.traderId,
            payoutPercent: record.payoutPercent,
            averageTradesPerDay: record.averageTradesPerDay,
            totalTradingDays: record.totalTradingDays,
            maxTradesPerDay: record.maxTradesPerDay,
            payoutTier: {
                id: record.payoutTier.id,
                minAverage: record.payoutTier.minAverage,
                maxAverage: record.payoutTier.maxAverage,
                payoutPercent: record.payoutTier.payoutPercent,
                tier: record.payoutTier.tier,
                color: record.payoutTier.color,
                description: record.payoutTier.description,
            },
            nextUpdateAt: record.nextUpdateAt,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }
}
exports.PayoutService = PayoutService;
exports.payoutService = new PayoutService();
//# sourceMappingURL=payout.service.js.map