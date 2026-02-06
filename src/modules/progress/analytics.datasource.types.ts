/**
 * Trade analytics data-source types.
 * Implement these interfaces to provide analytics from the current DB (Prisma)
 * or from MT5 when integration is ready. The rest of the analytics pipeline
 * (aggregation, equity curve, week counts, response shape) stays unchanged.
 */

/** Raw metrics for a trader (from DB or MT5). */
export interface TraderMetricsRow {
  /** Win rate as percentage 0–100. */
  winRate: number;
  profitFactor: number;
  /** Max drawdown as percentage 0–100. */
  drawdown: number;
  totalTradingDays: number;
}

/** Payout info for a trader (from DB or payout service). */
export interface TraderPayoutRow {
  payoutPercent: number;
  averageTradesPerDay: number;
  totalTradingDays: number;
}

/** Single closed trade (from DB or MT5). */
export interface ClosedTradeRow {
  id: string;
  symbol: string;
  profitLoss: number;
  fees: number;
  closeTime: Date;
}

/**
 * Data source for trade analytics. Implement this with Prisma (current)
 * or with MT5 API client when integration is ready.
 */
export interface ITradeAnalyticsDataSource {
  getMetrics(traderId: string): Promise<TraderMetricsRow | null>;
  getPayout(traderId: string): Promise<TraderPayoutRow | null>;
  getClosedTrades(traderId: string, options?: { fromDate?: Date; toDate?: Date; limit?: number }): Promise<ClosedTradeRow[]>;
}
