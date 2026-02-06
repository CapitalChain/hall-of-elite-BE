"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payout_controller_1 = require("./payout.controller");
const router = (0, express_1.Router)();
// Get all payout tier configurations
router.get("/tiers", payout_controller_1.getPayoutTiers);
// Get trader payout information
router.get("/:traderId", payout_controller_1.getTraderPayout);
// Calculate and update trader payout
router.post("/calculate", payout_controller_1.calculatePayout);
exports.default = router;
//# sourceMappingURL=payout.routes.js.map