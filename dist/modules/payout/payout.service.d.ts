import { PayoutCalculationInput, PayoutCalculationResult, TraderPayoutDTO } from "./payout.types";
export declare class PayoutService {
    /**
     * Initialize default payout tiers if they don't exist
     */
    initializePayoutTiers(): Promise<void>;
    /**
     * Calculate payout tier based on trading activity
     * Formula: average = maxTradesPerDay / totalTradingDays
     */
    calculatePayoutTier(input: PayoutCalculationInput): PayoutCalculationResult;
    /**
     * Update or create trader payout record
     */
    updateTraderPayout(input: PayoutCalculationInput): Promise<TraderPayoutDTO>;
    /**
     * Get trader payout information
     */
    getTraderPayout(traderId: string): Promise<TraderPayoutDTO | null>;
    /**
     * Get all payout tiers
     */
    getPayoutTiers(): Promise<{
        tier: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        color: string;
        description: string | null;
        isActive: boolean;
        payoutPercent: number;
        minAverage: number;
        maxAverage: number;
        order: number;
    }[]>;
    /**
     * Derive max trades per day and total trading days from MT5 trades for a trader.
     * Formula: average = maxTradesPerDay / totalTradingDays.
     * Used when calculating payout from actual trade data.
     * Returns null if MT5 tables are missing or no data (e.g. before MT5 integration is set up).
     */
    getTradeStatsForTrader(traderId: string): Promise<{
        maxTradesPerDay: number;
        totalTradingDays: number;
    } | null>;
    /**
     * Calculate and update trader payout from actual MT5 trade data.
     * Uses: average = maxTradesPerDay / totalTradingDays; then tier by average (< 20% → 95%, < 40% → 80%, else 30%).
     */
    calculatePayoutFromTrades(traderId: string): Promise<TraderPayoutDTO | null>;
    /**
     * Map database record to DTO
     */
    private mapToDTO;
}
export declare const payoutService: PayoutService;
//# sourceMappingURL=payout.service.d.ts.map