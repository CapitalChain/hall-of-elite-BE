"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardsService = void 0;
const types_1 = require("../../types");
const client_1 = require("../../prisma/client");
const tier_rewards_config_1 = require("./tier-rewards.config");
class RewardsService {
    /**
     * Get reward eligibility from current DB tables only: mt5_trader_scores.
     * Reward entitlements table was dropped; use tier-based TIER_REWARDS_MAP only.
     */
    async getRewardEligibility(traderId) {
        try {
            const mt5Score = await client_1.prisma.mt5TraderScore.findUnique({
                where: { traderId },
            });
            const tier = mt5Score?.tier ?? types_1.TraderTier.BRONZE;
            const baseRewards = tier_rewards_config_1.TIER_REWARDS_MAP[tier] ?? tier_rewards_config_1.TIER_REWARDS_MAP[types_1.TraderTier.BRONZE];
            return {
                traderId,
                rewards: { ...baseRewards },
            };
        }
        catch (error) {
            console.error("Error fetching reward eligibility:", error);
            return null;
        }
    }
    async getRewardEligibilityMock(traderId) {
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
exports.RewardsService = RewardsService;
//# sourceMappingURL=rewards.service.js.map