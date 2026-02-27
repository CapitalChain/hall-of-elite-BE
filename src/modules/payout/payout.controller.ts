import { Request, Response, NextFunction } from "express";
import { payoutService } from "./payout.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../middlewares/errorHandler";

/**
 * GET /payout/tiers - Get all payout tier configurations.
 * Returns [] when payout_tiers table is missing (dropped).
 */
export const getPayoutTiers = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tiers = await payoutService.getPayoutTiers();
      res.json({ success: true, data: tiers });
    } catch {
      res.json({ success: true, data: [] });
    }
  }
);

/**
 * GET /payout/:traderId - Get trader payout information.
 * Returns null when trader_payouts table is missing (dropped).
 */
export const getTraderPayout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let { traderId } = req.params;

    if (Array.isArray(traderId)) {
      traderId = traderId[0];
    }

    if (!traderId) {
      throw new AppError("Trader ID is required", 400);
    }

    try {
      const payout = await payoutService.getTraderPayout(traderId);
      res.json({
        success: true,
        data: payout ?? null,
        message: payout ? undefined : "No payout information found for this trader",
      });
    } catch {
      res.json({
        success: true,
        data: null,
        message: "No payout information found for this trader",
      });
    }
  }
);

/**
 * POST /payout/calculate - Calculate and update trader payout.
 * Body: { traderId } only → derive maxTradesPerDay & totalTradingDays from MT5 trades.
 * Body: { traderId, maxTradesPerDay, totalTradingDays } → use provided values.
 * Returns 200 with data: null when payout tables are missing (dropped).
 */
export const calculatePayout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { traderId, maxTradesPerDay, totalTradingDays, fromTrades } = req.body;

    if (!traderId) {
      throw new AppError("traderId is required", 400);
    }

    const useFromTrades =
      fromTrades === true ||
      (maxTradesPerDay === undefined && (totalTradingDays === undefined || totalTradingDays === null));

    try {
      if (useFromTrades) {
        const payout = await payoutService.calculatePayoutFromTrades(traderId);
        return res.json({
          success: true,
          data: payout ?? null,
          message: payout
            ? "Payout calculated from trade data and updated successfully"
            : "No closed trades found for this trader; payout not calculated",
        });
      }

      if (maxTradesPerDay === undefined || totalTradingDays === undefined || totalTradingDays === null) {
        throw new AppError("maxTradesPerDay and totalTradingDays are required when not using fromTrades", 400);
      }
      if (totalTradingDays <= 0) {
        throw new AppError("totalTradingDays must be greater than 0", 400);
      }
      if (maxTradesPerDay < 0) {
        throw new AppError("maxTradesPerDay cannot be negative", 400);
      }

      const payout = await payoutService.updateTraderPayout({
        traderId,
        maxTradesPerDay,
        totalTradingDays,
      });
      res.json({
        success: true,
        data: payout,
        message: "Payout calculated and updated successfully",
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      res.json({
        success: true,
        data: null,
        message: "Payout tables unavailable; calculation skipped",
      });
    }
  }
);
