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
import scoringRoutes from "./modules/scoring/scoring.routes";
import progressRoutes from "./modules/progress/progress.routes";
import payoutRoutes from "./modules/payout/payout.routes";

export const createApp = (): Express => {
  const app = express();

  const allowedOrigins = [
    env.CORS_ORIGIN,
    ...(env.CORS_ORIGINS ? env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean) : []),
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
  app.use("/scoring", scoringRoutes);
  app.use("/user", progressRoutes);
  app.use("/payout", payoutRoutes);

  app.use(errorHandler);

  return app;
};
