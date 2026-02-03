import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { getUserProgress } from "./progress.controller";

const router = Router();

router.get("/progress", authMiddleware, getUserProgress);

export default router;
