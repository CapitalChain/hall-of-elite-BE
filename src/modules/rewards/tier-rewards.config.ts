/**
 * Single source of truth for tier → reward eligibility (flags only).
 * Used by RewardsService and AdminService (static fallback).
 * MVP: config file; no fulfillment ops.
 */
import { TraderTier } from "../../types";

export interface TierRewardFlags {
  phoenixAddOn: boolean;
  payoutBoost: boolean;
  cashback: boolean;
  merchandise: boolean;
}

export const TIER_REWARDS_MAP: Record<TraderTier, TierRewardFlags> = {
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
