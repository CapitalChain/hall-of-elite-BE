import { TraderTier } from "../../types";
import { TierConfigDTO, RewardConfigDTO } from "./admin.dto";
import { TIER_REWARDS_MAP } from "../rewards/tier-rewards.config";

export const staticTierConfig: Record<TraderTier, Omit<TierConfigDTO, "tierId">> = {
  [TraderTier.BRONZE]: {
    name: "Bronze",
    minScore: 0,
    maxScore: 20,
    badge: "Bronze",
    color: "#cd7f32",
    description: "Entry level tier",
  },
  [TraderTier.SILVER]: {
    name: "Silver",
    minScore: 20,
    maxScore: 40,
    badge: "Silver",
    color: "#c0c0c0",
    description: "Intermediate tier",
  },
  [TraderTier.GOLD]: {
    name: "Gold",
    minScore: 40,
    maxScore: 60,
    badge: "Gold",
    color: "#ffd700",
    description: "Advanced tier",
  },
  [TraderTier.PLATINUM]: {
    name: "Platinum",
    minScore: 60,
    maxScore: 80,
    badge: "Platinum",
    color: "#e5e4e2",
    description: "Expert tier",
  },
  [TraderTier.DIAMOND]: {
    name: "Diamond",
    minScore: 80,
    maxScore: 95,
    badge: "Diamond",
    color: "#b9f2ff",
    description: "Master tier",
  },
  [TraderTier.ELITE]: {
    name: "Elite",
    minScore: 95,
    badge: "Elite",
    color: "#8b00ff",
    description: "Elite tier - highest achievement",
  },
};

/** Derived from shared TIER_REWARDS_MAP (single source of truth). */
export const staticRewardConfig: Record<TraderTier, Omit<RewardConfigDTO, "tierId" | "tierName">> = Object.fromEntries(
  (Object.entries(TIER_REWARDS_MAP) as [TraderTier, typeof TIER_REWARDS_MAP[TraderTier]][]).map(([tier, flags]) => [
    tier,
    {
      phoenixAddOn: flags.phoenixAddOn,
      payoutBoost: flags.payoutBoost,
      cashback: flags.cashback,
      merchandise: flags.merchandise,
    },
  ])
) as Record<TraderTier, Omit<RewardConfigDTO, "tierId" | "tierName">>;
