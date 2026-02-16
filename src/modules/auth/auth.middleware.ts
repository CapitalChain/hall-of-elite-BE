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

/** Validate token with Capital Chain GET /authentication/user/ and return UserPayload */
async function validateCapitalChainToken(token: string): Promise<UserPayload | null> {
  const base = (env.AUTH_API_URL ?? "").trim().replace(/\/+$/, "");
  if (!base) return null;
  const clean = token.trim().replace(/^(Token|Bearer)\s+/i, "");
  const url = `${base}/authentication/user/`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${clean}`,
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

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) return authHeader.slice(7).trim();
    if (authHeader.startsWith("Token ")) return authHeader.slice(6).trim();
  }
  return req.cookies?.token;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const rawToken = token.replace(/^(Token|Bearer)\s+/i, "").trim();

    // 1) Try our own JWT (Hall of Elite / demo users)
    try {
      const payload = authService.verifyToken(rawToken);
      req.user = payload;
      return next();
    } catch {
      // Not our JWT, continue to Capital Chain
    }

    // 2) Try Capital Chain token (GET /authentication/user/ with Token header)
    const ccUser = await validateCapitalChainToken(rawToken);
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
