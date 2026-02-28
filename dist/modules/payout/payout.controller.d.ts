import { Request, Response, NextFunction } from "express";
/**
 * GET /payout/tiers - Get all payout tier configurations.
 * Returns [] when payout_tiers table is missing (dropped).
 */
export declare const getPayoutTiers: (req: Request, res: Response, next: NextFunction) => void;
/**
 * GET /payout/:traderId - Get trader payout information.
 * Returns null when trader_payouts table is missing (dropped).
 */
export declare const getTraderPayout: (req: Request, res: Response, next: NextFunction) => void;
/**
 * POST /payout/calculate - Calculate and update trader payout.
 * Body: { traderId } only → derive maxTradesPerDay & totalTradingDays from MT5 trades.
 * Body: { traderId, maxTradesPerDay, totalTradingDays } → use provided values.
 * Returns 200 with data: null when payout tables are missing (dropped).
 */
export declare const calculatePayout: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=payout.controller.d.ts.map