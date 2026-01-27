import { TraderTier } from "../../types";

export const TIER_THRESHOLDS: Record<TraderTier, { min: number; max?: number }> = {
  [TraderTier.BRONZE]: { min: 0, max: 20 },
  [TraderTier.SILVER]: { min: 20, max: 40 },
  [TraderTier.GOLD]: { min: 40, max: 60 },
  [TraderTier.PLATINUM]: { min: 60, max: 80 },
  [TraderTier.DIAMOND]: { min: 80, max: 95 },
  [TraderTier.ELITE]: { min: 95 },
};

export const SCORING_WEIGHTS = {
  profitFactor: 0.25,
  winRate: 0.20,
  maxDrawdown: 0.20,
  sharpeRatio: 0.15,
  consistency: 0.15,
  riskManagement: 0.05,
} as const;

export const SCORING_CONFIG = {
  minTradesForScoring: 10,
  minTradingDays: 30,
  maxDrawdownPenalty: 0.5,
  consistencyBonus: 0.1,
} as const;
