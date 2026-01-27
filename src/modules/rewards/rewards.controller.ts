import { Request, Response, NextFunction } from "express";
import { RewardsService } from "./rewards.service";
import { RewardEligibilityDTO } from "./rewards.dto";

const rewardsService = new RewardsService();

export const getTraderRewards = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const eligibility = await rewardsService.getRewardEligibility(id);

    if (!eligibility) {
      const mockEligibility = await rewardsService.getRewardEligibilityMock(id);
      return res.json({
        success: true,
        data: mockEligibility,
      });
    }

    res.json({
      success: true,
      data: eligibility,
    });
  } catch (error) {
    next(error);
  }
};
