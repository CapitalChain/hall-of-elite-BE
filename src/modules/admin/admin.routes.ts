import { Router } from "express";
import { getTierConfigs, getRewardConfigs, getTierConfigById } from "./admin.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { getTierConfigByIdParamsSchema } from "./admin.validator";

const router = Router();

router.get("/tiers", getTierConfigs);

router.get(
  "/tiers/:id",
  validateRequest({ params: getTierConfigByIdParamsSchema }),
  getTierConfigById
);

router.get("/rewards", getRewardConfigs);

export default router;
