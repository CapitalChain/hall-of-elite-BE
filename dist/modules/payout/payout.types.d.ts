/**
 * Payout tier levels based on trading consistency
 */
export declare enum PayoutLevel {
    BRONZE = "BRONZE",// 30% payout - high activity (>= 40% average)
    SILVER = "SILVER",// 80% payout - medium activity (20-40% average)
    GOLD = "GOLD"
}
export interface PayoutTierDTO {
    id: string;
    minAverage: number;
    maxAverage: number;
    payoutPercent: number;
    tier: PayoutLevel;
    color: string;
    description?: string;
}
export interface TraderPayoutDTO {
    id: string;
    traderId: string;
    payoutPercent: number;
    averageTradesPerDay: number;
    totalTradingDays: number;
    maxTradesPerDay: number;
    payoutTier: PayoutTierDTO;
    nextUpdateAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface PayoutCalculationInput {
    traderId: string;
    maxTradesPerDay: number;
    totalTradingDays: number;
}
export interface PayoutCalculationResult {
    traderId: string;
    averageTradesPerDay: number;
    payoutPercent: number;
    tier: PayoutLevel;
    color: string;
    description?: string;
}
//# sourceMappingURL=payout.types.d.ts.map