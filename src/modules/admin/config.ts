import { TraderTier } from "../../types";
import { TierConfigDTO, RewardConfigDTO } from "./admin.dto";

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

export const staticRewardConfig: Record<TraderTier, Omit<RewardConfigDTO, "tierId" | "tierName">> = {
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
