import { Request, Response } from "express";
import { authService } from "./auth.service";
import { RegisterInput, LoginInput } from "./auth.validator";

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as RegisterInput;
    const result = await authService.register(data);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    throw error;
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as LoginInput;
    const result = await authService.login(data);

    // Set HTTP-only cookie for additional security
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    throw error;
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.logout();

    // Clear the token cookie
    res.clearCookie("token");

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    throw error;
  }
};
