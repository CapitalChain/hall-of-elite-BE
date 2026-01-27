import { TraderTier } from "../../types";
import { prisma } from "../../prisma/client";
import { SCORING_RULES } from "./scoring.config";
import { SCORING_REJECTION_REASONS, SCORING_SCOPE } from "./scoring.constants";
import {
  EligibilityResultDTO,
  ScoringMetricsDTO,
  ScoringResultDTO,
  ScoringRunSummaryDTO,
  TraderScoreDTO,
} from "./scoring.dto";

type ClosedTrade = {
  profitLoss: number;
  fees: number;
  closeTime: Date;
};

const roundTo = (value: number, precision: number): number => {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const normalizeRange = (value: number, min: number, max: number): number => {
  if (max <= min) {
    return 0;
  }
  const clamped = clamp(value, min, max);
  return ((clamped - min) / (max - min)) * 100;
};

const normalizeInverse = (value: number, min: number, max: number): number => {
  const normalized = normalizeRange(value, min, max);
  return 100 - normalized;
};

export class ScoringService {
  async runScoring(): Promise<{ summary: ScoringRunSummaryDTO; results: ScoringResultDTO[] }> {
    const traders = await prisma.mt5Trader.findMany({
      select: {
        id: true,
        externalId: true,
        name: true,
        accountStatus: true,
        accounts: { select: { id: true } },
        metrics: true,
      },
    });

    this.logInfo("Starting scoring run", { totalTraders: traders.length });

    const results: ScoringResultDTO[] = [];
    let eligibleCount = 0;
    let rejectedCount = 0;

    for (const trader of traders) {
      const accountIds = trader.accounts.map((account) => account.id);
      const closedTrades = await this.fetchClosedTrades(accountIds);
      const metrics = this.computeMetrics(trader.metrics?.[0] ?? null, closedTrades);
      const eligibility = this.evaluateEligibility(metrics, closedTrades.length > 0);

      let score = 0;
      let tier: TraderTier | null = null;
      let rank: number | null = null;

      if (eligibility.eligible) {
        score = this.calculateScore(metrics);
        tier = this.assignTier(score);
        eligibleCount += 1;
      } else {
        rejectedCount += 1;
      }

      results.push({
        traderId: trader.id,
        externalId: trader.externalId,
        score,
        tier,
        rank,
        eligible: eligibility.eligible,
        metrics,
        eligibility,
        calculatedAt: new Date(),
      });
    }

    const ranked = this.rankEligible(results);
    await this.persistScores(ranked);

    const summary = this.buildSummary(ranked, eligibleCount, rejectedCount);
    this.logInfo("Scoring run complete", summary);

    return { summary, results: ranked };
  }

  async getTraderScore(traderId: string): Promise<TraderScoreDTO | null> {
    const score = await prisma.mt5TraderScore.findUnique({
      where: { traderId },
    });

    if (!score) {
      return null;
    }

    return {
      traderId,
      score: score.consistencyScore,
      tier: score.tier as TraderTier | null,
      rank: score.rank ?? null,
      eligible: score.eligible,
      calculatedAt: score.lastCalculatedAt,
    };
  }

  private async fetchClosedTrades(accountIds: string[]): Promise<ClosedTrade[]> {
    if (accountIds.length === 0) {
      return [];
    }

    const trades = await prisma.mt5Trade.findMany({
      where: {
        accountId: { in: accountIds },
        closeTime: { not: null },
      },
      select: {
        profitLoss: true,
        fees: true,
        closeTime: true,
      },
      orderBy: { closeTime: "asc" },
    });

    return trades.map((trade) => ({
      profitLoss: trade.profitLoss,
      fees: trade.fees,
      closeTime: trade.closeTime as Date,
    }));
  }

  private computeMetrics(
    storedMetrics: { profitFactor: number; winRate: number; drawdown: number; totalTradingDays: number } | null,
    trades: ClosedTrade[]
  ): ScoringMetricsDTO {
    const derived = this.deriveMetricsFromTrades(trades);

    return {
      profitFactor: storedMetrics?.profitFactor ?? derived.profitFactor,
      winRatePct: storedMetrics?.winRate ?? derived.winRatePct,
      drawdownPct: storedMetrics?.drawdown ?? derived.drawdownPct,
      totalTrades: derived.totalTrades,
      tradingDays: storedMetrics?.totalTradingDays ?? derived.tradingDays,
    };
  }

  private deriveMetricsFromTrades(trades: ClosedTrade[]): ScoringMetricsDTO {
    const netResults = trades.map((trade) => trade.profitLoss - trade.fees);
    const totalTrades = trades.length;

    let totalProfit = 0;
    let totalLoss = 0;
    let winningTrades = 0;
    let equity = 0;
    let peak = 0;
    let maxDrawdown = 0;

    const tradingDaysSet = new Set<string>();

    trades.forEach((trade, index) => {
      const net = netResults[index];
      if (net > 0) {
        totalProfit += net;
        winningTrades += 1;
      } else if (net < 0) {
        totalLoss += Math.abs(net);
      }

      equity += net;
      if (equity > peak) {
        peak = equity;
      }
      const drawdown = peak - equity;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }

      tradingDaysSet.add(trade.closeTime.toISOString().slice(0, 10));
    });

    const profitFactor =
      totalLoss === 0 ? (totalProfit > 0 ? totalProfit : 0) : totalProfit / totalLoss;
    const winRatePct = totalTrades === 0 ? 0 : (winningTrades / totalTrades) * 100;
    const drawdownPct = peak <= 0 ? 0 : (maxDrawdown / peak) * 100;

    return {
      profitFactor: roundTo(profitFactor, SCORING_RULES.precision),
      winRatePct: roundTo(winRatePct, SCORING_RULES.precision),
      drawdownPct: roundTo(drawdownPct, SCORING_RULES.precision),
      totalTrades,
      tradingDays: tradingDaysSet.size,
    };
  }

  private evaluateEligibility(metrics: ScoringMetricsDTO, hasTrades: boolean): EligibilityResultDTO {
    const reasons: string[] = [];
    const rules = SCORING_RULES.eligibility;

    if (!hasTrades) {
      reasons.push(SCORING_REJECTION_REASONS.MISSING_TRADES);
    }

    if (metrics.totalTrades < rules.minTotalTrades) {
      reasons.push(SCORING_REJECTION_REASONS.MIN_TOTAL_TRADES);
    }

    if (metrics.tradingDays < rules.minTradingDays) {
      reasons.push(SCORING_REJECTION_REASONS.MIN_TRADING_DAYS);
    }

    if (metrics.profitFactor < rules.minProfitFactor) {
      reasons.push(SCORING_REJECTION_REASONS.MIN_PROFIT_FACTOR);
    }

    if (metrics.winRatePct < rules.minWinRatePct) {
      reasons.push(SCORING_REJECTION_REASONS.MIN_WIN_RATE);
    }

    if (metrics.drawdownPct > rules.maxDrawdownPct) {
      reasons.push(SCORING_REJECTION_REASONS.MAX_DRAWDOWN);
    }

    return {
      eligible: reasons.length === 0,
      rejectionReasons: reasons,
    };
  }

  private calculateScore(metrics: ScoringMetricsDTO): number {
    const { weights, normalization, precision } = SCORING_RULES;

    const profitFactorScore = normalizeRange(
      metrics.profitFactor,
      normalization.profitFactor.min,
      normalization.profitFactor.max
    );
    const winRateScore = normalizeRange(
      metrics.winRatePct,
      normalization.winRatePct.min,
      normalization.winRatePct.max
    );
    const drawdownScore = normalizeInverse(
      metrics.drawdownPct,
      normalization.drawdownPct.min,
      normalization.drawdownPct.max
    );
    const tradingDaysScore = normalizeRange(
      metrics.tradingDays,
      normalization.tradingDays.min,
      normalization.tradingDays.max
    );

    const weighted =
      profitFactorScore * weights.profitFactor +
      winRateScore * weights.winRatePct +
      drawdownScore * weights.drawdownPct +
      tradingDaysScore * weights.tradingDays;

    return clamp(roundTo(weighted, precision), 0, 100);
  }

  private assignTier(score: number): TraderTier | null {
    for (const tierRule of SCORING_RULES.tiers) {
      if (score >= tierRule.min && score <= tierRule.max) {
        return tierRule.tier;
      }
    }
    return null;
  }

  private rankEligible(results: ScoringResultDTO[]): ScoringResultDTO[] {
    const eligible = results
      .filter((result) => result.eligible)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (b.metrics.profitFactor !== a.metrics.profitFactor) {
          return b.metrics.profitFactor - a.metrics.profitFactor;
        }
        if (a.metrics.drawdownPct !== b.metrics.drawdownPct) {
          return a.metrics.drawdownPct - b.metrics.drawdownPct;
        }
        return a.traderId.localeCompare(b.traderId);
      });

    eligible.forEach((result, index) => {
      result.rank = index + 1;
    });

    return results;
  }

  private async persistScores(results: ScoringResultDTO[]): Promise<void> {
    const now = new Date();
    const operations = results.map((result) =>
      prisma.mt5TraderScore.upsert({
        where: { traderId: result.traderId },
        create: {
          traderId: result.traderId,
          consistencyScore: result.score,
          tier: result.tier ?? null,
          rank: result.rank ?? null,
          eligible: result.eligible,
          lastCalculatedAt: now,
        },
        update: {
          consistencyScore: result.score,
          tier: result.tier ?? null,
          rank: result.rank ?? null,
          eligible: result.eligible,
          lastCalculatedAt: now,
        },
      })
    );

    await prisma.$transaction(operations);
  }

  private buildSummary(
    results: ScoringResultDTO[],
    eligibleCount: number,
    rejectedCount: number
  ): ScoringRunSummaryDTO {
    const tierDistribution: Record<string, number> = {};
    for (const result of results) {
      if (!result.eligible || !result.tier) {
        continue;
      }
      tierDistribution[result.tier] = (tierDistribution[result.tier] || 0) + 1;
    }

    return {
      evaluated: results.length,
      eligible: eligibleCount,
      rejected: rejectedCount,
      tierDistribution,
    };
  }

  private logInfo(message: string, context?: Record<string, unknown>) {
    console.log({
      scope: SCORING_SCOPE,
      message,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }
}
