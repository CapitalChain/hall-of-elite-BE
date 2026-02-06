"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const progress_controller_1 = require("./progress.controller");
const router = (0, express_1.Router)();
router.get("/progress", auth_middleware_1.authMiddleware, progress_controller_1.getUserProgress);
router.get("/analytics", auth_middleware_1.authMiddleware, progress_controller_1.getUserTradeAnalytics);
exports.default = router;
//# sourceMappingURL=progress.routes.js.map