import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { requestLogger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/errorHandler";
import healthRoutes from "./routes/health.routes";
import traderRoutes from "./routes/trader.routes";
import rewardsRoutes from "./modules/rewards/rewards.routes";
import adminRoutes from "./modules/admin/admin.routes";
import mt5Routes from "./modules/mt5/mt5.routes";
import authRoutes from "./modules/auth/auth.routes";

export const createApp = (): Express => {
  const app = express();

  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestLogger);

  app.use("/health", healthRoutes);
  app.use("/auth", authRoutes);
  app.use("/elite/traders", traderRoutes);
  app.use("/rewards", rewardsRoutes);
  app.use("/admin", adminRoutes);
  app.use("/mt5", mt5Routes);

  app.use(errorHandler);

  return app;
};
