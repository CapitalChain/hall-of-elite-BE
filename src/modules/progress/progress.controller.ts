import { Request, Response, NextFunction } from "express";
import { getProgressForUser, getTradeAnalyticsForUser } from "./progress.service";
import { MIN_POINTS_START } from "./progress.config";
import { REWARD_TARGET_THRESHOLDS } from "./progress.config";

function getDefaultProgress() {
  const pointsToReturn = MIN_POINTS_START;
  const rewardTargets = REWARD_TARGET_THRESHOLDS.map((requiredPoints, index) => {
    const id = index + 1;
    const unlocked = pointsToReturn >= requiredPoints;
    return {
      id,
      label: id === 1 ? "Unlocked" : `Target ${id}`,
      unlocked,
      canUnlock: unlocked,
      requiredPoints,
      requiredLevel: requiredPoints,
    };
  });
  const firstLocked = rewardTargets.find((t) => !t.unlocked);
  return {
    currentPoints: pointsToReturn,
    nextRewardThreshold: firstLocked?.requiredPoints ?? 100,
    rewardTargets,
    currentLevel: pointsToReturn,
  };
}

/** GET /user/progress – always returns 200 with progress (default if any error). Never throws. */
export async function getUserProgress(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const progress = await getProgressForUser(userId);
    res.json({ success: true, data: progress });
  } catch {
    if (!res.headersSent) {
      res.status(200).json({ success: true, data: getDefaultProgress() });
    }
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
