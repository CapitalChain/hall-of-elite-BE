export interface RewardTargetProgress {
  id: number;
  label: string;
  unlocked: boolean;
  canUnlock: boolean;
  requiredLevel: number;
}

export interface UserProgressResponse {
  currentLevel: number;
  nextRewardThreshold: number;
  rewardTargets: RewardTargetProgress[];
}
