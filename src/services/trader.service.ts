import { TraderTier, TraderProfile } from "../types";
import { prisma } from "../prisma/client";

export class TraderService {
  async getAllTraders(filters: { page?: number; limit?: number; tier?: string }) {
    // Placeholder - will be implemented with actual database queries
    return [];
  }

  async getTraderById(id: string) {
    // Placeholder - will be implemented with actual database queries
    return null;
  }

  async getTraderMetrics(traderId: string) {
    // Placeholder - will be implemented with actual database queries
    return null;
  }

  /**
   * Get trader profile from current DB tables only: mt5_traders, mt5_trader_scores, mt5_trader_metrics.
   * id = mt5_traders.id (UUID).
   */
  async getTraderProfile(id: string): Promise<TraderProfile | null> {
    try {
      const [trader, score, metrics] = await Promise.all([
        prisma.mt5Trader.findUnique({ where: { id } }),
        prisma.mt5TraderScore.findUnique({ where: { traderId: id } }),
        prisma.mt5TraderMetrics.findUnique({ where: { traderId: id } }),
      ]);

      if (!trader) return null;

      const accountAge = trader.createdAt
        ? Math.floor((Date.now() - trader.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      const tier = (score?.tier as TraderTier) ?? TraderTier.BRONZE;
      const rank = score?.rank ?? 0;
      const overallScore = score?.consistencyScore ?? 0;
      const m = metrics;

      return {
        id: trader.id,
        displayName: trader.name,
        tier,
        rank,
        accountAge,
        overallScore,
        metrics: {
          profitFactor: m?.profitFactor ?? 0,
          winRate: m?.winRate ?? 0,
          maxDrawdown: m?.drawdown ?? 0,
          totalProfit: 0,
          totalTrades: 0,
          tradingDays: m?.totalTradingDays ?? 0,
          sharpeRatio: 0,
          averageWin: 0,
          averageLoss: 0,
          largestWin: 0,
          largestLoss: 0,
          currentDrawdown: m?.drawdown ?? 0,
        },
        rewards: {
          phoenixAddOn: false,
          payoutBoost: false,
          cashback: false,
          merchandise: false,
        },
      };
    } catch (error) {
      console.error("Error fetching trader profile:", error);
      return null;
    }
  }

}
