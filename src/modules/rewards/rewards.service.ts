import { TraderTier } from "../../types";
import { prisma } from "../../prisma/client";
import { RewardEligibilityDTO } from "./rewards.dto";

export class RewardsService {
  private tierRewardMap: Record<TraderTier, RewardEligibilityDTO["rewards"]> = {
    [TraderTier.BRONZE]: {
      phoenixAddOn: false,
      payoutBoost: false,
      cashback: false,
      merchandise: false,
    },
    [TraderTier.SILVER]: {
      phoenixAddOn: false,
      payoutBoost: false,
      cashback: true,
      merchandise: false,
    },
    [TraderTier.GOLD]: {
      phoenixAddOn: false,
      payoutBoost: true,
      cashback: true,
      merchandise: false,
    },
    [TraderTier.PLATINUM]: {
      phoenixAddOn: false,
      payoutBoost: true,
      cashback: true,
      merchandise: true,
    },
    [TraderTier.DIAMOND]: {
      phoenixAddOn: true,
      payoutBoost: true,
      cashback: true,
      merchandise: true,
    },
    [TraderTier.ELITE]: {
      phoenixAddOn: true,
      payoutBoost: true,
      cashback: true,
      merchandise: true,
    },
  };

  async getRewardEligibility(traderId: string): Promise<RewardEligibilityDTO | null> {
    try {
      const traderScore = await prisma.traderScore.findUnique({
        where: { tradingAccountId: traderId },
      });

      if (!traderScore) {
        return null;
      }

      const tier = traderScore.tier as TraderTier;
      const baseRewards = this.tierRewardMap[tier] || this.tierRewardMap[TraderTier.BRONZE];

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
