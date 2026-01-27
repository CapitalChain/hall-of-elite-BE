export interface RewardEligibilityDTO {
  traderId: string;
  rewards: {
    phoenixAddOn: boolean;
    payoutBoost: boolean;
    cashback: boolean;
    merchandise: boolean;
  };
}
