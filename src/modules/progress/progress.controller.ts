import { Request, Response, NextFunction } from "express";
import { getProgressForUser, getTradeAnalyticsForUser } from "./progress.service";
import { getLinkedTradersForUser, addTraderLink, setPrimaryTrader } from "./user-traders.service";
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

/** Read which MT5 account ID to use for this request (multi-account: one CC user → many MT5 IDs). */
function getSelectedTraderId(req: Request): string | undefined {
  const fromQuery = req.query.traderId;
  const fromHeader = req.headers["x-selected-trader-id"];
  let raw: string | undefined;
  if (typeof fromQuery === "string") raw = fromQuery;
  else if (Array.isArray(fromQuery) && typeof fromQuery[0] === "string") raw = fromQuery[0];
  else raw = typeof fromHeader === "string" ? fromHeader : undefined;
  return raw?.trim() || undefined;
}

/** GET /user/progress – progress for the resolved MT5 account. Optional ?traderId= or X-Selected-Trader-Id to pick which account. */
export async function getUserProgress(req: Request, res: Response, _next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const selectedTraderId = getSelectedTraderId(req);
    const progress = await getProgressForUser(userId, selectedTraderId);
    res.json({ success: true, data: progress });
  } catch {
    if (!res.headersSent) {
      res.status(200).json({ success: true, data: getDefaultProgress() });
    }
  }
}

/** GET /user/analytics – analytics for the resolved MT5 account. Optional ?traderId= or X-Selected-Trader-Id to pick which account. */
export async function getUserTradeAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const equityDays = req.query.days != null ? parseInt(String(req.query.days), 10) : undefined;
    const selectedTraderId = getSelectedTraderId(req);
    const options: { equityDays?: number; selectedTraderId?: string } = {};
    if (equityDays != null && Number.isFinite(equityDays) && equityDays > 0) options.equityDays = equityDays;
    if (selectedTraderId) options.selectedTraderId = selectedTraderId;
    const analytics = await getTradeAnalyticsForUser(userId, options);
    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
}

/** GET /user/traders – list MT5 accounts (IDs) linked to the current Capital Chain user. */
export async function getLinkedTraders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const list = await getLinkedTradersForUser(userId);
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

/** POST /user/traders – link an MT5 account (by ID) to current user. Body: { mt5TraderId, displayLabel? }. */
export async function postLinkTrader(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const { mt5TraderId, displayLabel } = req.body as { mt5TraderId?: string; displayLabel?: string };
    if (!mt5TraderId || typeof mt5TraderId !== "string") {
      res.status(400).json({ success: false, error: "mt5TraderId is required" });
      return;
    }
    const added = await addTraderLink(userId, mt5TraderId.trim(), displayLabel?.trim() || null);
    res.status(201).json({ success: true, data: added });
  } catch (error) {
    next(error);
  }
}

/** PATCH /user/traders/:traderId/primary – set this linked MT5 account as primary for the user. */
export async function patchSetPrimaryTrader(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const traderId = typeof req.params.traderId === "string" ? req.params.traderId : req.params.traderId?.[0];
    if (!traderId) {
      res.status(400).json({ success: false, error: "traderId required" });
      return;
    }
    await setPrimaryTrader(userId, traderId);
    res.json({ success: true, data: { traderId, isPrimary: true } });
  } catch (error) {
    next(error);
  }
}
