import { TraderTier } from "../../types";

export interface TraderScoreDTO {
  traderId: string;
  score: number;
  tier: TraderTier | null;
  rank: number | null;
  eligible: boolean;
  calculatedAt: Date;
}

export interface ScoringMetricsDTO {
  profitFactor: number;
  winRatePct: number;
  drawdownPct: number;
  totalTrades: number;
  tradingDays: number;
}

export interface EligibilityResultDTO {
  eligible: boolean;
  rejectionReasons: string[];
}

export interface ScoringResultDTO {
  traderId: string;
  externalId: string;
  score: number;
  tier: TraderTier | null;
  rank: number | null;
  eligible: boolean;
  metrics: ScoringMetricsDTO;
  eligibility: EligibilityResultDTO;
  calculatedAt: Date;
}

export interface ScoringRunSummaryDTO {
  evaluated: number;
  eligible: number;
  rejected: number;
  tierDistribution: Record<string, number>;
}
