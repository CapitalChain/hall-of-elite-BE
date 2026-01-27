import { TraderTier } from "../../types";
import { TraderScoreDTO, ScoringResultDTO, ScoringMetricsDTO } from "./scoring.dto";
import { TIER_THRESHOLDS, SCORING_WEIGHTS, SCORING_CONFIG } from "./scoring.constants";
import { prisma } from "../../prisma/client";

export class ScoringService {
  async calculateTraderScore(traderId: string): Promise<ScoringResultDTO> {
    try {
      console.log(`📊 Calculating score for trader: ${traderId}`);

      // Placeholder for actual scoring logic
      // This would:
      // 1. Fetch trader metrics from database
      // 2. Calculate individual component scores
      // 3. Apply weights and combine
      // 4. Return final score

      // Mock implementation for MVP
      const mockMetrics = await this.getMockMetrics(traderId);
      const score = this.calculateMockScore(mockMetrics);
      const tier = this.assignTier(score);

      return {
        traderId,
        score,
        tier,
        metrics: mockMetrics,
        calculatedAt: new Date(),
      };
    } catch (error) {
      console.error(`❌ Error calculating score for trader ${traderId}:`, error);
      throw error;
    }
  }

  assignTier(score: number): TraderTier {
    // Placeholder for actual tier assignment logic
    // This would check score against TIER_THRESHOLDS

    if (score >= TIER_THRESHOLDS[TraderTier.ELITE].min) {
      return TraderTier.ELITE;
    }
    if (score >= TIER_THRESHOLDS[TraderTier.DIAMOND].min) {
      return TraderTier.DIAMOND;
    }
    if (score >= TIER_THRESHOLDS[TraderTier.PLATINUM].min) {
      return TraderTier.PLATINUM;
    }
    if (score >= TIER_THRESHOLDS[TraderTier.GOLD].min) {
      return TraderTier.GOLD;
    }
    if (score >= TIER_THRESHOLDS[TraderTier.SILVER].min) {
      return TraderTier.SILVER;
    }
    return TraderTier.BRONZE;
  }

  async getTraderScore(traderId: string): Promise<TraderScoreDTO | null> {
    try {
      // Try to fetch from database
      const traderScore = await prisma.traderScore.findUnique({
        where: { tradingAccountId: traderId },
      });

      if (traderScore) {
        return {
          traderId,
          score: traderScore.score,
          tier: traderScore.tier as TraderTier,
          calculatedAt: traderScore.updatedAt,
        };
      }

      // Calculate new score if not found
      const result = await this.calculateTraderScore(traderId);
      return {
        traderId: result.traderId,
        score: result.score,
        tier: result.tier,
        calculatedAt: result.calculatedAt,
      };
    } catch (error) {
      console.error(`❌ Error getting trader score for ${traderId}:`, error);
      return null;
    }
  }

  private async getMockMetrics(traderId: string): Promise<ScoringMetricsDTO> {
    // Placeholder: Fetch actual metrics from database
    // const metrics = await prisma.traderMetrics.findUnique({
    //   where: { tradingAccountId: traderId },
    // });

    // Mock metrics for MVP
    return {
      profitFactor: 2.5,
      winRate: 65.0,
      maxDrawdown: 10.0,
      sharpeRatio: 1.8,
      consistencyScore: 75.0,
      riskScore: 80.0,
    };
  }

  private calculateMockScore(metrics: ScoringMetricsDTO): number {
    // Placeholder for actual scoring formula
    // This would apply SCORING_WEIGHTS to each metric component

    const profitFactorScore = Math.min(metrics.profitFactor * 20, 100);
    const winRateScore = metrics.winRate;
    const drawdownScore = Math.max(0, 100 - metrics.maxDrawdown * 5);
    const sharpeScore = Math.min(metrics.sharpeRatio * 30, 100);
    const consistencyScore = metrics.consistencyScore;
    const riskScore = metrics.riskScore;

    const weightedScore =
      profitFactorScore * SCORING_WEIGHTS.profitFactor +
      winRateScore * SCORING_WEIGHTS.winRate +
      drawdownScore * SCORING_WEIGHTS.maxDrawdown +
      sharpeScore * SCORING_WEIGHTS.sharpeRatio +
      consistencyScore * SCORING_WEIGHTS.consistency +
      riskScore * SCORING_WEIGHTS.riskManagement;

    return Math.round(weightedScore * 100) / 100;
  }
}
