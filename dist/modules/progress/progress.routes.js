"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const progress_controller_1 = require("./progress.controller");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
router.get("/progress", auth_middleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(progress_controller_1.getUserProgress));
router.get("/analytics", auth_middleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(progress_controller_1.getUserTradeAnalytics));
router.get("/traders", auth_middleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(progress_controller_1.getLinkedTraders));
router.post("/traders", auth_middleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(progress_controller_1.postLinkTrader));
router.patch("/traders/:traderId/primary", auth_middleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(progress_controller_1.patchSetPrimaryTrader));
exports.default = router;
//# sourceMappingURL=progress.routes.js.map