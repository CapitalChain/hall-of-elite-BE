"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleMiddleware = exports.authMiddleware = void 0;
const auth_service_1 = require("./auth.service");
const errorHandler_1 = require("../../middlewares/errorHandler");
const env_1 = require("../../config/env");
/** Validate token with Capital Chain GET /authentication/user/ and return UserPayload */
async function validateCapitalChainToken(token) {
    const base = (env_1.env.AUTH_API_URL ?? "").trim().replace(/\/+$/, "");
    if (!base)
        return null;
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
        if (!res.ok)
            return null;
        const data = (await res.json());
        const id = String(data.pk ?? data.id ?? "");
        const email = String(data.email ?? "");
        if (!email)
            return null;
        return {
            id,
            email,
            role: data.role || "TRADER",
        };
    }
    catch {
        return null;
    }
}
function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        if (authHeader.startsWith("Bearer "))
            return authHeader.slice(7).trim();
        if (authHeader.startsWith("Token "))
            return authHeader.slice(6).trim();
    }
    return req.cookies?.token;
}
const authMiddleware = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            throw new errorHandler_1.AppError("Authentication required", 401);
        }
        const rawToken = token.replace(/^(Token|Bearer)\s+/i, "").trim();
        // 1) Try our own JWT (Hall of Elite / demo users)
        try {
            const payload = auth_service_1.authService.verifyToken(rawToken);
            req.user = payload;
            return next();
        }
        catch {
            // Not our JWT, continue to Capital Chain
        }
        // 2) Try Capital Chain token (GET /authentication/user/ with Token header)
        const ccUser = await validateCapitalChainToken(rawToken);
        if (ccUser) {
            req.user = ccUser;
            return next();
        }
        throw new errorHandler_1.AppError("Invalid authentication token", 401);
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
            next(error);
        }
        else {
            next(new errorHandler_1.AppError("Invalid authentication token", 401));
        }
    }
};
exports.authMiddleware = authMiddleware;
const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError("Authentication required", 401));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new errorHandler_1.AppError("Insufficient permissions", 403));
        }
        next();
    };
};
exports.roleMiddleware = roleMiddleware;
//# sourceMappingURL=auth.middleware.js.map