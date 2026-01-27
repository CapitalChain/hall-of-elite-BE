import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { RegisterInput, LoginInput } from "./auth.validator";
import { AuthResponseDTO, UserPayload } from "./auth.dto";
import { AppError } from "../../middlewares/errorHandler";

export class AuthService {
  private readonly SALT_ROUNDS = 10;

  async register(data: RegisterInput): Promise<AuthResponseDTO> {
    const { email, password, displayName } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName,
        role: "TRADER",
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
      },
    });

    // Generate JWT token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      user,
      token,
    };
  }

  async login(data: LoginInput): Promise<AuthResponseDTO> {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate JWT token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      token,
    };
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

  private generateToken(payload: UserPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }
}

export const authService = new AuthService();
