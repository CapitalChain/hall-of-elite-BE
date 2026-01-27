/**
 * MT5 routes.
 * Created to wire MT5 HTTP endpoints to controllers and validators.
 */
import { Router } from "express";
import {
  getAccounts,
  getTrades,
  getConnectionStatus,
  connect,
  disconnect,
} from "./mt5.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { getTradesParamsSchema, getTradesQuerySchema } from "./mt5.validator";

const router = Router();

router.get("/accounts", getAccounts);

router.get(
  "/trades/:accountId",
  validateRequest({
    params: getTradesParamsSchema,
    query: getTradesQuerySchema,
  }),
  getTrades
);

router.get("/status", getConnectionStatus);

router.post("/connect", connect);

router.post("/disconnect", disconnect);

export default router;
