export interface TierConfigDTO {
  tierId: string;
  name: string;
  minScore: number;
  maxScore?: number;
  badge?: string;
  color?: string;
  icon?: string;
  description?: string;
}

export interface RewardConfigDTO {
  tierId: string;
  tierName: string;
  phoenixAddOn: boolean;
  payoutBoost: boolean;
  cashback: boolean;
  merchandise: boolean;
}

export interface AdminConfigResponse<T> {
  success: boolean;
  data: T[];
}
