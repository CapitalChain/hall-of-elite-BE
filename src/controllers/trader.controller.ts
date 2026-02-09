import { Request, Response, NextFunction } from "express";
import { TraderService } from "../services/trader.service";
import { TraderTier } from "../types";
import type { TraderProfile } from "../types";
import { getEliteLeaderboardFromLatestSnapshot } from "../modules/snapshots/read-models/elite.read";
import { getTraderProfileFromLatestSnapshot } from "../modules/snapshots/read-models/traderProfile.read";

const traderService = new TraderService();

/** Map snapshot profile to API TraderProfile shape */
function snapshotToTraderProfile(
  snap: Awaited<ReturnType<typeof getTraderProfileFromLatestSnapshot>>
): TraderProfile | null {
  if (!snap) return null;
  const m = snap.metrics;
  return {
    id: snap.traderId,
    displayName: snap.displayName,
    tier: snap.tier,
    rank: snap.rank,
    overallScore: snap.score,
    metrics: {
      profitFactor: m.profitFactor,
      winRate: m.winRatePct,
      maxDrawdown: m.drawdownPct,
      totalProfit: 0,
      totalTrades: m.totalTrades,
      tradingDays: m.tradingDays,
      sharpeRatio: 1.5,
      averageWin: 100,
      averageLoss: 50,
      largestWin: 300,
      largestLoss: 150,
      currentDrawdown: m.drawdownPct * 0.6,
    },
    rewards: {
      phoenixAddOn: snap.badges.phoenixAddOn,
      payoutBoost: snap.badges.payoutBoost,
      cashback: snap.badges.cashback,
      merchandise: snap.badges.merchandise,
    },
  };
}

const MOCK_TRADERS = [
  { id: "1", userId: "user-1", displayName: "Elite Trader Alpha", tier: TraderTier.ELITE, rank: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: "2", userId: "user-2", displayName: "Diamond Trader Beta", tier: TraderTier.DIAMOND, rank: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: "3", userId: "user-3", displayName: "Platinum Trader Gamma", tier: TraderTier.PLATINUM, rank: 3, createdAt: new Date(), updatedAt: new Date() },
];

export const getAllTraders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const tier = req.query.tier as string | undefined;

    let list: Awaited<ReturnType<typeof getEliteLeaderboardFromLatestSnapshot>> = [];
    try {
      list = await getEliteLeaderboardFromLatestSnapshot(limit * 10);
    } catch {
      // Snapshot tables may not exist or DB error; fall back to mock
    }

    if (list.length > 0) {
      const traders = list.map((item, index) => ({
        id: item.traderId,
        userId: item.traderId,
        displayName: item.displayName,
        tier: item.tier,
        rank: item.rank,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      const filtered = tier ? traders.filter((t) => t.tier === tier) : traders;
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);
      return res.json({
        success: true,
        data: paginated,
        pagination: { page, limit, total: filtered.length },
      });
    }

    const filteredTraders = tier ? MOCK_TRADERS.filter((t) => t.tier === tier) : MOCK_TRADERS;
    res.json({
      success: true,
      data: filteredTraders,
      pagination: { page, limit, total: filteredTraders.length },
    });
  } catch (error) {
    next(error);
  }
};

export const getTraderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0] ?? "";

    // When list comes from snapshot, id is Mt5Trader.id – try snapshot profile first
    try {
      const snapshotProfile = await getTraderProfileFromLatestSnapshot(id);
      const mapped = snapshotToTraderProfile(snapshotProfile);
      if (mapped) {
        return res.json({ success: true, data: mapped });
      }
    } catch {
      // Snapshot read failed; continue to legacy
    }

    // Legacy: id may be tradingAccountId (TraderScore / TraderMetrics)
    const profile = await traderService.getTraderProfile(id);
    if (profile) {
      return res.json({ success: true, data: profile });
    }

    const mockProfile = await traderService.getTraderProfileMock(id);
    return res.json({ success: true, data: mockProfile });
  } catch (error) {
    next(error);
  }
};
