import { Request, Response, NextFunction } from "express";
import { TraderService } from "../services/trader.service";
import { TraderTier } from "../types";

const traderService = new TraderService();

export const getAllTraders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, tier } = req.query;

    const mockTraders = [
      {
        id: "1",
        userId: "user-1",
        displayName: "Elite Trader Alpha",
        tier: TraderTier.ELITE,
        rank: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        userId: "user-2",
        displayName: "Diamond Trader Beta",
        tier: TraderTier.DIAMOND,
        rank: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        userId: "user-3",
        displayName: "Platinum Trader Gamma",
        tier: TraderTier.PLATINUM,
        rank: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const filteredTraders = tier
      ? mockTraders.filter((t) => t.tier === tier)
      : mockTraders;

    res.json({
      success: true,
      data: filteredTraders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredTraders.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTraderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Try to get from database
    const profile = await traderService.getTraderProfile(id);

    if (!profile) {
      // Fallback to mock data if database is empty
      const mockProfile = await traderService.getTraderProfileMock(id);
      return res.json({
        success: true,
        data: mockProfile,
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};
