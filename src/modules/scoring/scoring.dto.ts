import { TraderTier } from "../../types";

export interface TraderScoreDTO {
  traderId: string;
  score: number;
  tier: TraderTier;
  calculatedAt: Date;
}

export interface ScoringMetricsDTO {
  profitFactor: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  consistencyScore: number;
  riskScore: number;
}

export interface ScoringResultDTO {
  traderId: string;
  score: number;
  tier: TraderTier;
  metrics: ScoringMetricsDTO;
  calculatedAt: Date;
}
