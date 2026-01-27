import { TraderTier } from "../../types";

export const SCORING_RULES = {
  eligibility: {
    minTradingDays: 30,
    minTotalTrades: 20,
    minProfitFactor: 1.2,
    maxDrawdownPct: 25,
    minWinRatePct: 50,
  },
  weights: {
    profitFactor: 0.35,
    winRatePct: 0.25,
    drawdownPct: 0.25,
    tradingDays: 0.15,
  },
  normalization: {
    profitFactor: { min: 1.0, max: 3.0 },
    winRatePct: { min: 40, max: 80 },
    drawdownPct: { min: 0, max: 40 },
    tradingDays: { min: 30, max: 365 },
  },
  tiers: [
    { tier: TraderTier.ELITE, min: 85, max: 100 },
    { tier: TraderTier.DIAMOND, min: 70, max: 84.99 },
    { tier: TraderTier.PLATINUM, min: 55, max: 69.99 },
    { tier: TraderTier.GOLD, min: 40, max: 54.99 },
    { tier: TraderTier.SILVER, min: 25, max: 39.99 },
    { tier: TraderTier.BRONZE, min: 0, max: 24.99 },
  ],
  precision: 2,
} as const;
