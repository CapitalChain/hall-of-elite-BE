import { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service";
import { AdminConfigResponse, TierConfigDTO, RewardConfigDTO } from "./admin.dto";

const adminService = new AdminService();

export const getTierConfigs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const configs = await adminService.getTierConfigs();

    const response: AdminConfigResponse<TierConfigDTO> = {
      success: true,
      data: configs,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getRewardConfigs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const configs = await adminService.getRewardConfigs();

    const response: AdminConfigResponse<RewardConfigDTO> = {
      success: true,
      data: configs,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getTierConfigById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const config = await adminService.getTierConfigById(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: "Tier config not found",
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    next(error);
  }
};
