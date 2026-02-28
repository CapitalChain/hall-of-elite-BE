import { RewardEligibilityDTO } from "./rewards.dto";
export declare class RewardsService {
    /**
     * Get reward eligibility from current DB tables only: mt5_trader_scores.
     * Reward entitlements table was dropped; use tier-based TIER_REWARDS_MAP only.
     */
    getRewardEligibility(traderId: string): Promise<RewardEligibilityDTO | null>;
    getRewardEligibilityMock(traderId: string): Promise<RewardEligibilityDTO>;
}
//# sourceMappingURL=rewards.service.d.ts.map