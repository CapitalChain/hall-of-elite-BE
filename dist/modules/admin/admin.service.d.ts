import { TierConfigDTO, RewardConfigDTO } from "./admin.dto";
export declare class AdminService {
    /** Tier table was dropped; use static config only. */
    getTierConfigs(): Promise<TierConfigDTO[]>;
    /** Reward table was dropped; use static config only. */
    getRewardConfigs(): Promise<RewardConfigDTO[]>;
    /** Tier table was dropped; use static config only. */
    getTierConfigById(tierId: string): Promise<TierConfigDTO | null>;
    private getStaticTierConfigs;
    private getStaticRewardConfigs;
    private getStaticTierConfigById;
}
//# sourceMappingURL=admin.service.d.ts.map