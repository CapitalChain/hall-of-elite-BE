"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTraderProfileFromLatestSnapshot = void 0;
const client_1 = require("../../../prisma/client");
/**
 * Read model for /elite/[id] – snapshot tables (snapshot_runs, trader_snapshots) were dropped.
 * Returns null so trader controller uses MT5 tables (getTraderProfile from mt5_traders/scores/metrics).
 */
const getTraderProfileFromLatestSnapshot = async (_traderId) => {
    try {
        const latestRun = await client_1.prisma.snapshotRun.findFirst({
            orderBy: { createdAt: "desc" },
        });
        if (!latestRun)
            return null;
        const row = await client_1.prisma.traderSnapshot.findFirst({
            where: { snapshotId: latestRun.id, traderId: _traderId },
        });
        if (!row)
            return null;
        const trader = await client_1.prisma.mt5Trader.findUnique({
            where: { id: _traderId },
        });
        return {
            traderId: row.traderId,
            externalTraderId: row.externalTraderId,
            displayName: trader?.name ?? row.externalTraderId,
            score: row.score,
            rank: row.rank,
            tier: row.tier,
            badges: row.badges,
            metrics: row.metrics,
        };
    }
    catch {
        return null;
    }
};
exports.getTraderProfileFromLatestSnapshot = getTraderProfileFromLatestSnapshot;
//# sourceMappingURL=traderProfile.read.js.map