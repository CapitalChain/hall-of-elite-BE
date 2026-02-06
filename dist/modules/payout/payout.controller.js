"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePayout = exports.getTraderPayout = exports.getPayoutTiers = void 0;
const payout_service_1 = require("./payout.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const errorHandler_1 = require("../../middlewares/errorHandler");
/**
 * GET /payout/tiers - Get all payout tier configurations
 */
exports.getPayoutTiers = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const tiers = await payout_service_1.payoutService.getPayoutTiers();
    res.json({
        success: true,
        data: tiers,
    });
});
/**
 * GET /payout/:traderId - Get trader payout information
 */
exports.getTraderPayout = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    let { traderId } = req.params;
    // Handle case where traderId might be an array
    if (Array.isArray(traderId)) {
        traderId = traderId[0];
    }
    if (!traderId) {
        throw new errorHandler_1.AppError("Trader ID is required", 400);
    }
    const payout = await payout_service_1.payoutService.getTraderPayout(traderId);
    if (!payout) {
        return res.json({
            success: true,
            data: null,
            message: "No payout information found for this trader",
        });
    }
    res.json({
        success: true,
        data: payout,
    });
});
/**
 * POST /payout/calculate - Calculate and update trader payout.
 * Body: { traderId } only → derive maxTradesPerDay & totalTradingDays from MT5 trades.
 * Body: { traderId, maxTradesPerDay, totalTradingDays } → use provided values.
 */
exports.calculatePayout = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    const { traderId, maxTradesPerDay, totalTradingDays, fromTrades } = req.body;
    if (!traderId) {
        throw new errorHandler_1.AppError("traderId is required", 400);
    }
    const useFromTrades = fromTrades === true ||
        (maxTradesPerDay === undefined && (totalTradingDays === undefined || totalTradingDays === null));
    if (useFromTrades) {
        const payout = await payout_service_1.payoutService.calculatePayoutFromTrades(traderId);
        if (!payout) {
            return res.json({
                success: true,
                data: null,
                message: "No closed trades found for this trader; payout not calculated",
            });
        }
        return res.json({
            success: true,
            data: payout,
            message: "Payout calculated from trade data and updated successfully",
        });
    }
    if (maxTradesPerDay === undefined || totalTradingDays === undefined || totalTradingDays === null) {
        throw new errorHandler_1.AppError("maxTradesPerDay and totalTradingDays are required when not using fromTrades", 400);
    }
    if (totalTradingDays <= 0) {
        throw new errorHandler_1.AppError("totalTradingDays must be greater than 0", 400);
    }
    if (maxTradesPerDay < 0) {
        throw new errorHandler_1.AppError("maxTradesPerDay cannot be negative", 400);
    }
    const payout = await payout_service_1.payoutService.updateTraderPayout({
        traderId,
        maxTradesPerDay,
        totalTradingDays,
    });
    res.json({
        success: true,
        data: payout,
        message: "Payout calculated and updated successfully",
    });
});
//# sourceMappingURL=payout.controller.js.map