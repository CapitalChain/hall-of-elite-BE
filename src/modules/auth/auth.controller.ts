import { Request, Response } from "express";
import { authService } from "./auth.service";
import { RegisterInput, LoginInput } from "./auth.validator";
import { storeTokenAndGetBypass, getTokenByBypass } from "./auth-token.service";

/** GET /auth/me – use token payload only (no User table). Capital Chain users have id, email, role from token. */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  if (!user?.id) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }
  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      displayName: user.email ?? "User",
      role: user.role ?? "TRADER",
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

/** POST /auth/store-token: Store Capital Chain token in DB; send token in Authorization. Body: { mt5TraderId? }. Returns bypassToken for URL login. */
export const storeToken = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  const mt5TraderId = (req.body as { mt5TraderId?: string })?.mt5TraderId;
  const result = await storeTokenAndGetBypass(authHeader ?? "", mt5TraderId);
  res.json({ success: true, data: result });
};

/** GET /auth/bypass/:bypassToken: Return stored token for bypass URL login (no auth required). */
export const getBypass = async (req: Request, res: Response): Promise<void> => {
  const bypassToken = typeof req.params.bypassToken === "string" ? req.params.bypassToken : (req.params.bypassToken?.[0] ?? "");
  const result = await getTokenByBypass(bypassToken);
  if (!result) {
    res.status(404).json({ success: false, error: "Invalid or expired bypass token" });
    return;
  }
  res.json({ success: true, data: { token: result.token, email: result.email } });
};
