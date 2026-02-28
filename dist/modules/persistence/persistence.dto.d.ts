import { z } from "zod";
export declare const mt5RawUserSchema: z.ZodObject<{
    login: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    name: z.ZodString;
    balance: z.ZodNumber;
    leverage: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    currency: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    group: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    login: string | number;
    balance: number;
    status?: string | null | undefined;
    currency?: string | null | undefined;
    leverage?: number | null | undefined;
    group?: string | undefined;
}, {
    name: string;
    login: string | number;
    balance: number;
    status?: string | null | undefined;
    currency?: string | null | undefined;
    leverage?: number | null | undefined;
    group?: string | undefined;
}>;
export type Mt5RawUser = z.infer<typeof mt5RawUserSchema>;
export declare const mt5TraderSchema: z.ZodObject<{
    externalId: z.ZodString;
    name: z.ZodString;
    accountStatus: z.ZodString;
}, "strip", z.ZodTypeAny, {
    externalId: string;
    name: string;
    accountStatus: string;
}, {
    externalId: string;
    name: string;
    accountStatus: string;
}>;
export declare const mt5AccountSchema: z.ZodObject<{
    externalId: z.ZodString;
    traderExternalId: z.ZodString;
    balance: z.ZodNumber;
    leverage: z.ZodNumber;
    currency: z.ZodString;
    status: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
    externalId: string;
    currency: string;
    leverage: number;
    balance: number;
    traderExternalId: string;
}, {
    status: string;
    externalId: string;
    currency: string;
    leverage: number;
    balance: number;
    traderExternalId: string;
}>;
export declare const mt5TradeSchema: z.ZodObject<{
    externalId: z.ZodString;
    accountExternalId: z.ZodString;
    symbol: z.ZodString;
    volume: z.ZodNumber;
    profitLoss: z.ZodNumber;
    fees: z.ZodNumber;
    openTime: z.ZodDate;
    closeTime: z.ZodOptional<z.ZodDate>;
    status: z.ZodString;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    status: string;
    externalId: string;
    profitLoss: number;
    fees: number;
    volume: number;
    openTime: Date;
    accountExternalId: string;
    closeTime?: Date | undefined;
}, {
    symbol: string;
    status: string;
    externalId: string;
    profitLoss: number;
    fees: number;
    volume: number;
    openTime: Date;
    accountExternalId: string;
    closeTime?: Date | undefined;
}>;
export declare const mt5MetricsSchema: z.ZodObject<{
    traderExternalId: z.ZodString;
    profitFactor: z.ZodNumber;
    winRate: z.ZodNumber;
    drawdown: z.ZodNumber;
    totalTradingDays: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    profitFactor: number;
    winRate: number;
    drawdown: number;
    totalTradingDays: number;
    traderExternalId: string;
}, {
    profitFactor: number;
    winRate: number;
    drawdown: number;
    totalTradingDays: number;
    traderExternalId: string;
}>;
export type Mt5TraderInput = z.infer<typeof mt5TraderSchema>;
export type Mt5AccountInput = z.infer<typeof mt5AccountSchema>;
export type Mt5TradeInput = z.infer<typeof mt5TradeSchema>;
export type Mt5TraderMetricsInput = z.infer<typeof mt5MetricsSchema>;
export interface Mt5NormalizedPayload {
    traders: Mt5TraderInput[];
    accounts: Mt5AccountInput[];
    trades: Mt5TradeInput[];
    metrics: Mt5TraderMetricsInput[];
}
export interface PersistSummary {
    tradersInserted: number;
    tradersUpdated: number;
    accountsInserted: number;
    accountsUpdated: number;
    tradesInserted: number;
    tradesUpdated: number;
    metricsInserted: number;
    metricsUpdated: number;
    skippedRecords: number;
}
//# sourceMappingURL=persistence.dto.d.ts.map