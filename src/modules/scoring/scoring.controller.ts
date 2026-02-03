import { Request, Response } from "express";
import { ScoringService } from "./scoring.service";
import { SCORING_RULES } from "./scoring.config";

const scoringService = new ScoringService();

export const getScoringConfig = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: SCORING_RULES,
  });
};

export const runScoring = async (_req: Request, res: Response): Promise<void> => {
  const result = await scoringService.runScoring();
  res.json({
    success: true,
    data: result,
  });
};
