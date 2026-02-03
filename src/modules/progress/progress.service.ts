import { prisma } from "../../prisma/client";
import { REWARD_TARGET_THRESHOLDS } from "./progress.config";
import type { UserProgressResponse, RewardTargetProgress } from "./progress.types";

/**
 * Resolve MT5 trader ID for a user by linking TradingAccount.accountNumber to Mt5TradingAccount.externalId.
 * Returns the first matching trader ID or null if none.
 */
async function resolveMt5TraderIdForUser(userId: string): Promise<string | null> {
  const accounts = await prisma.tradingAccount.findMany({
    where: { userId },
    select: { accountNumber: true },
  });
  const accountNumbers = accounts.map((a) => a.accountNumber).filter(Boolean);
  if (accountNumbers.length === 0) return null;

  const mt5Account = await prisma.mt5TradingAccount.findFirst({
    where: { externalId: { in: accountNumbers } },
    select: { traderId: true },
  });
  return mt5Account?.traderId ?? null;
}

/**
 * Get dashboard progress for the authenticated user: current level (consistency score),
 * next reward threshold, and which targets are unlocked / can be unlocked.
 * When the user has no linked MT5 trader or score, returns default progress (0%, first threshold, targets 1 unlocked at 0).
 */
export async function getProgressForUser(userId: string): Promise<UserProgressResponse> {
  const traderId = await resolveMt5TraderIdForUser(userId);
  let currentLevel = 0;

  if (traderId) {
    const scoreRow = await prisma.mt5TraderScore.findUnique({
      where: { traderId },
      select: { consistencyScore: true },
    });
    if (scoreRow != null) {
      currentLevel = Math.round(Math.min(100, Math.max(0, scoreRow.consistencyScore)));
    }
  }

  const rewardTargets: RewardTargetProgress[] = REWARD_TARGET_THRESHOLDS.map((requiredLevel, index) => {
    const id = index + 1;
    const unlocked = currentLevel >= requiredLevel;
    const canUnlock = unlocked;
    return {
      id,
      label: id === 1 ? "Unlocked" : `Target ${id}`,
      unlocked,
      canUnlock,
      requiredLevel,
    };
  });

  const firstLocked = rewardTargets.find((t) => !t.unlocked);
  const nextRewardThreshold = firstLocked?.requiredLevel ?? 100;

  return {
    currentLevel,
    nextRewardThreshold,
    rewardTargets,
  };
}
