import { Request, Response } from "express";
import { authService } from "./auth.service";
import { RegisterInput, LoginInput } from "./auth.validator";

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }
  const user = await authService.getUserById(userId);
  if (!user) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const data = req.body as RegisterInput;
  const result = await authService.register(data);
  res.status(201).json({
    success: true,
    data: result,
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
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
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.logout();

  // Clear the token cookie
  res.clearCookie("token");

  res.json({
    success: true,
    data: result,
  });
};
