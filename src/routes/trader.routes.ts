import { Router } from "express";
import { getAllTraders, getTraderById } from "../controllers/trader.controller";
import { validateRequest } from "../middlewares/validateRequest";
import { getTraderParamsSchema, getTradersQuerySchema } from "../validators/trader.validator";

const router = Router();

router.get(
  "/",
  validateRequest({ query: getTradersQuerySchema }),
  getAllTraders
);

router.get(
  "/:id",
  validateRequest({ params: getTraderParamsSchema }),
  getTraderById
);

export default router;
