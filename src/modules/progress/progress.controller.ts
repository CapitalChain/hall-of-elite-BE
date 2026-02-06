import { Request, Response, NextFunction } from "express";
import { getProgressForUser, getTradeAnalyticsForUser } from "./progress.service";

export async function getUserProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const progress = await getProgressForUser(userId);
    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
}

export async function getUserTradeAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const equityDays = req.query.days != null ? parseInt(String(req.query.days), 10) : undefined;
    const options =
      equityDays != null && Number.isFinite(equityDays) && equityDays > 0 ? { equityDays } : undefined;

    const analytics = await getTradeAnalyticsForUser(userId, options);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
}
