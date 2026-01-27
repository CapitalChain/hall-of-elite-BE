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

  async getTraderProfile(id: string): Promise<TraderProfile | null> {
    try {
      // Try to fetch from database first
      const traderScore = await prisma.traderScore.findUnique({
        where: { tradingAccountId: id },
        include: {
          // Note: Adjust based on actual Prisma schema relationships
        },
      });

      if (!traderScore) {
        return null;
      }

      // Fetch related data
      const metrics = await prisma.traderMetrics.findUnique({
        where: { tradingAccountId: id },
      });

      const rewardEntitlements = await prisma.rewardEntitlement.findMany({
        where: { traderId: id },
      });

      // Calculate account age (days since creation)
      const tradingAccount = await prisma.tradingAccount.findUnique({
        where: { id },
      });

      const accountAge = tradingAccount
        ? Math.floor((Date.now() - tradingAccount.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      // Map reward entitlements to reward flags
      const rewards = {
        phoenixAddOn: rewardEntitlements.some(
          (r) => r.rewardType === "BONUS" && r.status === "PENDING"
        ),
        payoutBoost: rewardEntitlements.some(
          (r) => r.rewardType === "BONUS" && r.status === "PENDING"
        ),
        cashback: rewardEntitlements.some(
          (r) => r.rewardType === "CASH" && r.status === "PENDING"
        ),
        merchandise: rewardEntitlements.some(
          (r) => r.rewardType === "MERCHANDISE" && r.status === "PENDING"
        ),
      };

      // Build profile DTO
      if (!metrics) {
        return null;
      }

      return {
        id,
        displayName: `Trader ${id}`, // Should come from user table
        tier: traderScore.tier as TraderTier,
        rank: traderScore.rank,
        accountAge,
        overallScore: traderScore.score,
        metrics: {
          profitFactor: metrics.profitFactor,
          winRate: metrics.winRate,
          maxDrawdown: metrics.maxDrawdown,
          totalProfit: metrics.totalProfit,
          totalTrades: metrics.totalTrades,
          sharpeRatio: metrics.sharpeRatio,
          averageWin: metrics.averageWin,
          averageLoss: metrics.averageLoss,
          largestWin: metrics.largestWin,
          largestLoss: metrics.largestLoss,
          currentDrawdown: metrics.currentDrawdown,
        },
        rewards,
      };
    } catch (error) {
      console.error("Error fetching trader profile:", error);
      return null;
    }
  }

  async getTraderProfileMock(id: string): Promise<TraderProfile> {
    // Mock data for development/testing
    return {
      id,
      displayName: "Elite Trader Alpha",
      tier: TraderTier.ELITE,
      rank: 1,
      accountAge: 365,
      overallScore: 95.5,
      metrics: {
        profitFactor: 2.78,
        winRate: 70.0,
        maxDrawdown: 12.5,
        totalProfit: 125000,
        totalTrades: 1250,
        tradingDays: 180,
        sharpeRatio: 2.15,
        averageWin: 142.86,
        averageLoss: 120.0,
        largestWin: 5000,
        largestLoss: 2000,
        currentDrawdown: 5.2,
      },
      rewards: {
        phoenixAddOn: true,
        payoutBoost: true,
        cashback: true,
        merchandise: false,
      },
    };
  }
}
