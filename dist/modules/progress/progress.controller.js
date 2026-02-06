"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProgress = getUserProgress;
exports.getUserTradeAnalytics = getUserTradeAnalytics;
const progress_service_1 = require("./progress.service");
async function getUserProgress(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: "Authentication required" });
            return;
        }
        const progress = await (0, progress_service_1.getProgressForUser)(userId);
        res.json({ success: true, data: progress });
    }
    catch (error) {
        next(error);
    }
}
async function getUserTradeAnalytics(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, error: "Authentication required" });
            return;
        }
        const equityDays = req.query.days != null ? parseInt(String(req.query.days), 10) : undefined;
        const options = equityDays != null && Number.isFinite(equityDays) && equityDays > 0 ? { equityDays } : undefined;
        const analytics = await (0, progress_service_1.getTradeAnalyticsForUser)(userId, options);
        res.json({ success: true, data: analytics });
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=progress.controller.js.map