import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { UserPayload } from "./auth.dto";
import { AppError } from "../../middlewares/errorHandler";
import { env } from "../../config/env";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

/** Validate Bearer token with Capital Chain GET /authentication/user/ and return UserPayload */
async function validateCapitalChainToken(token: string): Promise<UserPayload | null> {
  const base = (env.AUTH_API_URL ?? "").trim().replace(/\/+$/, "");
  if (!base) return null;
  const url = `${base}/authentication/user/`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const id = String(data.pk ?? data.id ?? "");
    const email = String(data.email ?? "");
    if (!email) return null;
    return {
      id,
      email,
      role: (data.role as string) || "TRADER",
    };
  } catch {
    return null;
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    // 1) Try our own JWT (Hall of Elite / demo users)
    try {
      const payload = authService.verifyToken(token);
      req.user = payload;
      return next();
    } catch {
      // Not our JWT, continue to Capital Chain
    }

    // 2) Try Capital Chain token (GET /authentication/user/ with Bearer token)
    const ccUser = await validateCapitalChainToken(token);
    if (ccUser) {
      req.user = ccUser;
      return next();
    }

    throw new AppError("Invalid authentication token", 401);
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Invalid authentication token", 401));
    }
  }
};

export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403));
    }

    next();
  };
};
