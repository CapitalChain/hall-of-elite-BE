export enum TraderTier {
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  GOLD = "GOLD",
  PLATINUM = "PLATINUM",
  DIAMOND = "DIAMOND",
  ELITE = "ELITE",
}

export enum RewardType {
  CASH = "CASH",
  CREDIT = "CREDIT",
  BONUS = "BONUS",
  MERCHANDISE = "MERCHANDISE",
  EXPERIENCE = "EXPERIENCE",
}

export interface Trader {
  id: string;
  userId: string;
  displayName: string;
  tier: TraderTier;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TraderMetrics {
  id: string;
  traderId: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  totalLoss: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  currentDrawdown: number;
  maxDrawdown: number;
  sharpeRatio: number;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface RewardEntitlement {
  id: string;
  traderId: string;
  rewardId: string;
  rewardType: RewardType;
  amount: number;
  status: "PENDING" | "CLAIMED" | "EXPIRED";
  eligibleAt: Date;
  expiresAt: Date | null;
  claimedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TraderProfile {
  id: string;
  displayName: string;
  tier: TraderTier;
  rank: number;
  accountAge?: number;
  overallScore?: number;
  metrics: {
    profitFactor: number;
    winRate: number;
    maxDrawdown: number;
    totalProfit: number;
    totalTrades: number;
    tradingDays?: number;
    sharpeRatio: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    currentDrawdown: number;
  };
  rewards: {
    phoenixAddOn: boolean;
    payoutBoost: boolean;
    cashback: boolean;
    merchandise: boolean;
  };
}
