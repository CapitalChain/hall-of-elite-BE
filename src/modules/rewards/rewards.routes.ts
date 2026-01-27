import { Router } from "express";
import { getTraderRewards } from "./rewards.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { getTraderRewardsParamsSchema } from "./rewards.validator";

const router = Router();

router.get(
  "/traders/:id",
  validateRequest({ params: getTraderRewardsParamsSchema }),
  getTraderRewards
);

export default router;
