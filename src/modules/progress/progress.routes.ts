import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { getUserProgress, getUserTradeAnalytics } from "./progress.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/progress", authMiddleware, asyncHandler(getUserProgress));
router.get("/analytics", authMiddleware, asyncHandler(getUserTradeAnalytics));

export default router;
