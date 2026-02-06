import { Router } from "express";
import {
  getPayoutTiers,
  getTraderPayout,
  calculatePayout,
} from "./payout.controller";

const router = Router();

// Get all payout tier configurations
router.get("/tiers", getPayoutTiers);

// Get trader payout information
router.get("/:traderId", getTraderPayout);

// Calculate and update trader payout
router.post("/calculate", calculatePayout);

export default router;
