import { TraderTier } from "../../types";
import { prisma } from "../../prisma/client";
import { RewardEligibilityDTO } from "./rewards.dto";
import { TIER_REWARDS_MAP } from "./tier-rewards.config";

export class RewardsService {
  /**
   * Get reward eligibility from current DB tables only: mt5_trader_scores.
   * Reward entitlements table was dropped; use tier-based TIER_REWARDS_MAP only.
   */
  async getRewardEligibility(traderId: string): Promise<RewardEligibilityDTO | null> {
    try {
      const mt5Score = await prisma.mt5TraderScore.findUnique({
        where: { traderId },
      });
      const tier: TraderTier = (mt5Score?.tier as TraderTier) ?? TraderTier.BRONZE;
      const baseRewards = TIER_REWARDS_MAP[tier] ?? TIER_REWARDS_MAP[TraderTier.BRONZE];

      return {
        traderId,
        rewards: { ...baseRewards },
      };
    } catch (error) {
      console.error("Error fetching reward eligibility:", error);
      return null;
    }
  }

  async getRewardEligibilityMock(traderId: string): Promise<RewardEligibilityDTO> {
    return {
      traderId,
      rewards: {
        phoenixAddOn: true,
        payoutBoost: true,
        cashback: true,
        merchandise: false,
      },
    };
  }
}
