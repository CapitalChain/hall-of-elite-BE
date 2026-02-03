import { TraderTier } from "../../types";
import { prisma } from "../../prisma/client";
import { RewardEligibilityDTO } from "./rewards.dto";
import { TIER_REWARDS_MAP } from "./tier-rewards.config";

export class RewardsService {
  async getRewardEligibility(traderId: string): Promise<RewardEligibilityDTO | null> {
    try {
      // Resolve tier: prefer Mt5TraderScore (by traderId), fallback to TraderScore (by tradingAccountId)
      let tier: TraderTier | null = null;

      const mt5Score = await prisma.mt5TraderScore.findUnique({
        where: { traderId },
      });
      if (mt5Score?.tier) {
        tier = mt5Score.tier as TraderTier;
      }

      if (tier == null) {
        const traderScore = await prisma.traderScore.findUnique({
          where: { tradingAccountId: traderId },
        });
        if (traderScore?.tier) {
          tier = traderScore.tier as TraderTier;
        }
      }

      if (tier == null) {
        return null;
      }

      const baseRewards = TIER_REWARDS_MAP[tier] ?? TIER_REWARDS_MAP[TraderTier.BRONZE];

      const rewardEntitlements = await prisma.rewardEntitlement.findMany({
        where: {
          traderId,
          status: "PENDING",
        },
      });

      const rewards: RewardEligibilityDTO["rewards"] = {
        phoenixAddOn: baseRewards.phoenixAddOn || rewardEntitlements.some(
          (r) => r.rewardType === "BONUS"
        ),
        payoutBoost: baseRewards.payoutBoost || rewardEntitlements.some(
          (r) => r.rewardType === "BONUS"
        ),
        cashback: baseRewards.cashback || rewardEntitlements.some(
          (r) => r.rewardType === "CASH"
        ),
        merchandise: baseRewards.merchandise || rewardEntitlements.some(
          (r) => r.rewardType === "MERCHANDISE"
        ),
      };

      return {
        traderId,
        rewards,
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
