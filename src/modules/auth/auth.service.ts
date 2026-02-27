import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { RegisterInput, LoginInput } from "./auth.validator";
import { AuthResponseDTO, UserPayload } from "./auth.dto";
import { AppError } from "../../middlewares/errorHandler";

export class AuthService {
  private readonly SALT_ROUNDS = 10;

  /** Registration disabled – use Capital Chain login and POST /auth/store-token. */
  async register(_data: RegisterInput): Promise<AuthResponseDTO> {
    throw new AppError("Registration is disabled. Please use Capital Chain login.", 501);
  }

  /** Local login disabled – use Capital Chain login and POST /auth/store-token. */
  async login(_data: LoginInput): Promise<AuthResponseDTO> {
    throw new AppError("Please use Capital Chain login.", 501);
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    // In a production app, you might want to implement token blacklisting
    // For MVP, we'll just return success
    return {
      success: true,
      message: "Logged out successfully",
    };
  }

  verifyToken(token: string): UserPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as UserPayload;
      return decoded;
    } catch (error) {
      throw new AppError("Invalid or expired token", 401);
    }
  }

  /** No longer used – getMe uses req.user payload only (User table dropped). */
  async getUserById(_userId: string): Promise<{ id: string; email: string; displayName: string; role: string } | null> {
    return null;
  }

  private generateToken(payload: UserPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as any);
  }
}

export const authService = new AuthService();
