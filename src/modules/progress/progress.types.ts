export interface RewardTargetProgress {
  id: number;
  label: string;
  unlocked: boolean;
  canUnlock: boolean;
  /** Required points to unlock this target (e.g. 75 for Target 2). */
  requiredPoints: number;
  /** @deprecated Use requiredPoints. Kept for backward compatibility. */
  requiredLevel: number;
}

export interface UserProgressResponse {
  /** Current points (increased based on payout tier + trading activity). */
  currentPoints: number;
  /** Points required for the next reward (e.g. 75 for Target 2). */
  nextRewardThreshold: number;
  rewardTargets: RewardTargetProgress[];
  /** @deprecated Use currentPoints. Kept for backward compatibility. */
  currentLevel: number;
}

/** Single point on the equity curve (cumulative P&L over time) */
export interface EquityPoint {
  date: string; // YYYY-MM-DD
  cumulativePnl: number;
}

/** One row in the recent trades list */
export interface RecentTradeDto {
  id: string;
  symbol: string;
  profitLoss: number;
  fees: number;
  closeTime: string; // ISO
  netPnl: number; // profitLoss - fees
}

export interface UserTradeAnalyticsResponse {
  /** From Mt5TraderMetrics; 0 if no metrics */
  winRate: number;
  profitFactor: number;
  drawdown: number;
  totalTradingDays: number;
  /** From TraderPayout; null if not calculated */
  payoutPercent: number | null;
  /** Cumulative P&L by date (oldest first) for chart */
  equityData: EquityPoint[];
  /** Count of closed trades in the current week (Mon–Sun) */
  tradesThisWeek: number;
  /** Count of closed trades in the previous week */
  tradesLastWeek: number;
  /** Human-readable hint for reaching next payout tier */
  pathToNextTier: string | null;
  /** Last 10 closed trades, newest first */
  recentTrades: RecentTradeDto[];
}
