import { Request, Response, NextFunction } from "express";
import { TraderService } from "../services/trader.service";
import { TraderTier } from "../types";
import type { TraderProfile } from "../types";
import { getEliteLeaderboard } from "../modules/snapshots/read-models/elite.read";
import { getTraderProfileFromLatestSnapshot } from "../modules/snapshots/read-models/traderProfile.read";
import { getTraderProfileFromConclave } from "../modules/progress/conclave-elite";

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

/** Elite list from cc-conclave only (mt5_traders + mt5_trader_scores). No mock data. */
export const getAllTraders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const tier = req.query.tier as string | undefined;

    let list: Awaited<ReturnType<typeof getEliteLeaderboard>> = [];
    try {
      list = await getEliteLeaderboard(limit * 10);
    } catch {
      list = [];
    }

    const traders = list.map((item) => ({
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

    res.json({
      success: true,
      data: paginated,
      pagination: { page, limit, total: filtered.length },
    });
  } catch (error) {
    next(error);
  }
};

/** Trader profile: CC Conclave (accounts + deals) by login first, else mt5_traders + scores + metrics. 404 when not found. */
export const getTraderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : req.params.id?.[0] ?? "";

    if (/^\d+$/.test(id.trim())) {
      const conclaveProfile = await getTraderProfileFromConclave(id);
      if (conclaveProfile) {
        return res.json({ success: true, data: conclaveProfile });
      }
    }

    try {
      const snapshotProfile = await getTraderProfileFromLatestSnapshot(id);
      const mapped = snapshotToTraderProfile(snapshotProfile);
      if (mapped) {
        return res.json({ success: true, data: mapped });
      }
    } catch {
      // Snapshot tables dropped; use MT5 only
    }

    const profile = await traderService.getTraderProfile(id);
    if (profile) {
      return res.json({ success: true, data: profile });
    }

    res.status(404).json({ success: false, error: "Trader not found" });
  } catch (error) {
    next(error);
  }
};
