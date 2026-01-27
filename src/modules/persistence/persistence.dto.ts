import { z } from "zod";

export const mt5RawUserSchema = z.object({
  login: z.union([z.number(), z.string()]),
  name: z.string(),
  balance: z.number(),
  leverage: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  group: z.string().optional(),
});

export type Mt5RawUser = z.infer<typeof mt5RawUserSchema>;

export const mt5TraderSchema = z.object({
  externalId: z.string().min(1),
  name: z.string().min(1),
  accountStatus: z.string().min(1),
});

export const mt5AccountSchema = z.object({
  externalId: z.string().min(1),
  traderExternalId: z.string().min(1),
  balance: z.number().finite(),
  leverage: z.number().int().positive(),
  currency: z.string().min(1),
  status: z.string().min(1),
});

export const mt5TradeSchema = z.object({
  externalId: z.string().min(1),
  accountExternalId: z.string().min(1),
  symbol: z.string().min(1),
  volume: z.number().finite(),
  profitLoss: z.number().finite(),
  fees: z.number().finite(),
  openTime: z.date(),
  closeTime: z.date().optional(),
  status: z.string().min(1),
});

export const mt5MetricsSchema = z.object({
  traderExternalId: z.string().min(1),
  profitFactor: z.number().finite(),
  winRate: z.number().finite(),
  drawdown: z.number().finite(),
  totalTradingDays: z.number().int().nonnegative(),
});

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
