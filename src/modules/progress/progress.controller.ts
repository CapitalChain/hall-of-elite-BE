import { Request, Response, NextFunction } from "express";
import { getProgressForUser } from "./progress.service";

export async function getUserProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const progress = await getProgressForUser(userId);
    res.json({ success: true, data: progress });
  } catch (error) {
    next(error);
  }
}
