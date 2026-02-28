import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import {
  getUserProgress,
  getUserTradeAnalytics,
  getLinkedTraders,
  postLinkTrader,
  patchSetPrimaryTrader,
} from "./progress.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/progress", authMiddleware, asyncHandler(getUserProgress));
router.get("/analytics", authMiddleware, asyncHandler(getUserTradeAnalytics));
router.get("/traders", authMiddleware, asyncHandler(getLinkedTraders));
router.post("/traders", authMiddleware, asyncHandler(postLinkTrader));
router.patch("/traders/:traderId/primary", authMiddleware, asyncHandler(patchSetPrimaryTrader));

export default router;
