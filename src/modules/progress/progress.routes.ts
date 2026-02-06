import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { getUserProgress, getUserTradeAnalytics } from "./progress.controller";

const router = Router();

router.get("/progress", authMiddleware, getUserProgress);
router.get("/analytics", authMiddleware, getUserTradeAnalytics);

export default router;
