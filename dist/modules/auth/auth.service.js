"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const errorHandler_1 = require("../../middlewares/errorHandler");
class AuthService {
    constructor() {
        this.SALT_ROUNDS = 10;
    }
    /** Registration disabled – use Capital Chain login and POST /auth/store-token. */
    async register(_data) {
        throw new errorHandler_1.AppError("Registration is disabled. Please use Capital Chain login.", 501);
    }
    /** Local login disabled – use Capital Chain login and POST /auth/store-token. */
    async login(_data) {
        throw new errorHandler_1.AppError("Please use Capital Chain login.", 501);
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
    /** No longer used – getMe uses req.user payload only (User table dropped). */
    async getUserById(_userId) {
        return null;
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