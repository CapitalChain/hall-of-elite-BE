import { prisma } from "../../prisma/client";
import { TraderTier } from "../../types";
import { TierConfigDTO, RewardConfigDTO } from "./admin.dto";
import { staticTierConfig, staticRewardConfig } from "./config";

export class AdminService {
  async getTierConfigs(): Promise<TierConfigDTO[]> {
    try {
      const tiers = await prisma.tier.findMany({
        orderBy: { minScore: "asc" },
      });

      if (tiers.length > 0) {
        return tiers.map((tier) => ({
          tierId: tier.id,
          name: tier.name,
          minScore: tier.minScore,
          maxScore: tier.maxScore ?? undefined,
          badge: tier.name,
          color: tier.color ?? undefined,
          icon: tier.icon ?? undefined,
          description: tier.description ?? undefined,
        }));
      }

      return this.getStaticTierConfigs();
    } catch (error) {
      console.error("Error fetching tier configs from database:", error);
      return this.getStaticTierConfigs();
    }
  }

  async getRewardConfigs(): Promise<RewardConfigDTO[]> {
    try {
      const rewards = await prisma.reward.findMany({
        include: {
          entitlements: true,
        },
      });

      if (rewards.length > 0) {
        const tierRewardMap = new Map<string, RewardConfigDTO>();

        rewards.forEach((reward) => {
          const tierName = reward.tier;
          const tierKey = tierName.toUpperCase() as TraderTier;

          if (!tierRewardMap.has(tierName)) {
            tierRewardMap.set(tierName, {
              tierId: tierName,
              tierName: tierName,
              phoenixAddOn: false,
              payoutBoost: false,
              cashback: false,
              merchandise: false,
            });
          }

          const config = tierRewardMap.get(tierName)!;

          switch (reward.rewardType.toUpperCase()) {
            case "BONUS":
              if (reward.name.toLowerCase().includes("phoenix")) {
                config.phoenixAddOn = reward.isActive;
              } else {
                config.payoutBoost = reward.isActive;
              }
              break;
            case "CASH":
              config.cashback = reward.isActive;
              break;
            case "MERCHANDISE":
              config.merchandise = reward.isActive;
              break;
          }
        });

        return Array.from(tierRewardMap.values());
      }

      return this.getStaticRewardConfigs();
    } catch (error) {
      console.error("Error fetching reward configs from database:", error);
      return this.getStaticRewardConfigs();
    }
  }

  async getTierConfigById(tierId: string): Promise<TierConfigDTO | null> {
    try {
      const tier = await prisma.tier.findUnique({
        where: { id: tierId },
      });

      if (tier) {
        return {
          tierId: tier.id,
          name: tier.name,
          minScore: tier.minScore,
          maxScore: tier.maxScore ?? undefined,
          badge: tier.name,
          color: tier.color ?? undefined,
          icon: tier.icon ?? undefined,
          description: tier.description ?? undefined,
        };
      }

      return this.getStaticTierConfigById(tierId);
    } catch (error) {
      console.error("Error fetching tier config by ID:", error);
      return this.getStaticTierConfigById(tierId);
    }
  }

  private getStaticTierConfigs(): TierConfigDTO[] {
    return Object.entries(staticTierConfig).map(([tier, config]) => ({
      tierId: tier,
      ...config,
    }));
  }

  private getStaticRewardConfigs(): RewardConfigDTO[] {
    return Object.entries(staticRewardConfig).map(([tier, config]) => ({
      tierId: tier,
      tierName: staticTierConfig[tier as TraderTier].name,
      ...config,
    }));
  }

  private getStaticTierConfigById(tierId: string): TierConfigDTO | null {
    const tier = tierId.toUpperCase() as TraderTier;
    const config = staticTierConfig[tier];

    if (!config) {
      return null;
    }

    return {
      tierId: tier,
      ...config,
    };
  }
}
