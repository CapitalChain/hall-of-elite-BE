import { Request, Response } from "express";
import { ScoringService } from "./scoring.service";

const scoringService = new ScoringService();

export const runScoring = async (_req: Request, res: Response): Promise<void> => {
  const result = await scoringService.runScoring();
  res.json({
    success: true,
    data: result,
  });
};
