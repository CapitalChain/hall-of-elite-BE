"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const errorHandler_1 = require("../../middlewares/errorHandler");
class AuthService {
    constructor() {
        this.SALT_ROUNDS = 10;
    }
    async register(data) {
        const { email, password, displayName } = data;
        // Check if user already exists
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new errorHandler_1.AppError("User with this email already exists", 409);
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, this.SALT_ROUNDS);
        // Create user
        const user = await database_1.prisma.user.create({
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
    async login(data) {
        const password = (data.password ?? "").trim();
        const email = (data.email ?? "").trim().toLowerCase();
        // Find user (normalize email so Demo1@... matches demo1@...)
        const user = await database_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            console.warn("[Auth] Login failed: user not found for email:", email);
            throw new errorHandler_1.AppError("Email not found. Please register first or check your email address", 401);
        }
        // Verify password (compare trimmed input with stored hash)
        const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            console.warn("[Auth] Login failed: invalid password for email:", email);
            throw new errorHandler_1.AppError("Incorrect password. Please try again", 401);
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
    async logout() {
        // In a production app, you might want to implement token blacklisting
        // For MVP, we'll just return success
        return {
            success: true,
            message: "Logged out successfully",
        };
    }
    verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            return decoded;
        }
        catch (error) {
            throw new errorHandler_1.AppError("Invalid or expired token", 401);
        }
    }
    /** Get full user for authenticated request (e.g. GET /auth/me). */
    async getUserById(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, displayName: true, role: true },
        });
        return user;
    }
    generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN,
        });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map