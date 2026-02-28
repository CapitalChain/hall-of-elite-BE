"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const client_1 = require("../../prisma/client");
const config_1 = require("./config");
class AdminService {
    /** Tier table was dropped; use static config only. */
    async getTierConfigs() {
        try {
            const tiers = await client_1.prisma.tier.findMany({ orderBy: { minScore: "asc" } });
            if (tiers.length > 0) {
                return tiers.map((t) => ({
                    tierId: t.id,
                    name: t.name,
                    minScore: t.minScore,
                    maxScore: t.maxScore ?? undefined,
                    badge: t.name,
                    color: t.color ?? undefined,
                    icon: t.icon ?? undefined,
                    description: t.description ?? undefined,
                }));
            }
        }
        catch {
            // tier table dropped
        }
        return this.getStaticTierConfigs();
    }
    /** Reward table was dropped; use static config only. */
    async getRewardConfigs() {
        try {
            const rewards = await client_1.prisma.reward.findMany({ include: { entitlements: true } });
            if (rewards.length > 0) {
                const tierRewardMap = new Map();
                rewards.forEach((reward) => {
                    const tierName = reward.tier;
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
                    const config = tierRewardMap.get(tierName);
                    switch (reward.rewardType.toUpperCase()) {
                        case "BONUS":
                            config.phoenixAddOn = reward.name.toLowerCase().includes("phoenix") ? reward.isActive : config.phoenixAddOn;
                            config.payoutBoost = !reward.name.toLowerCase().includes("phoenix") ? reward.isActive : config.payoutBoost;
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
        }
        catch {
            // reward table dropped
        }
        return this.getStaticRewardConfigs();
    }
    /** Tier table was dropped; use static config only. */
    async getTierConfigById(tierId) {
        try {
            const tier = await client_1.prisma.tier.findUnique({ where: { id: tierId } });
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
        }
        catch {
            // tier table dropped
        }
        return this.getStaticTierConfigById(tierId);
    }
    getStaticTierConfigs() {
        return Object.entries(config_1.staticTierConfig).map(([tier, config]) => ({
            tierId: tier,
            ...config,
        }));
    }
    getStaticRewardConfigs() {
        return Object.entries(config_1.staticRewardConfig).map(([tier, config]) => ({
            tierId: tier,
            tierName: config_1.staticTierConfig[tier].name,
            ...config,
        }));
    }
    getStaticTierConfigById(tierId) {
        const tier = tierId.toUpperCase();
        const config = config_1.staticTierConfig[tier];
        if (!config) {
            return null;
        }
        return {
            tierId: tier,
            ...config,
        };
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map