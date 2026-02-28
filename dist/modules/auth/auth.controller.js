"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBypass = exports.storeToken = exports.logout = exports.login = exports.register = exports.getMe = void 0;
const auth_service_1 = require("./auth.service");
const auth_token_service_1 = require("./auth-token.service");
/** GET /auth/me – use token payload only (no User table). Capital Chain users have id, email, role from token. */
const getMe = async (req, res) => {
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
exports.getMe = getMe;
const register = async (req, res) => {
    const data = req.body;
    const result = await auth_service_1.authService.register(data);
    res.status(201).json({
        success: true,
        data: result,
    });
};
exports.register = register;
const login = async (req, res) => {
    const data = req.body;
    const result = await auth_service_1.authService.login(data);
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
exports.login = login;
const logout = async (req, res) => {
    const result = await auth_service_1.authService.logout();
    // Clear the token cookie
    res.clearCookie("token");
    res.json({
        success: true,
        data: result,
    });
};
exports.logout = logout;
/** POST /auth/store-token: Store Capital Chain token in DB; send token in Authorization. Body: { mt5TraderId? }. Returns bypassToken for URL login. */
const storeToken = async (req, res) => {
    const authHeader = req.headers.authorization;
    const mt5TraderId = req.body?.mt5TraderId;
    const result = await (0, auth_token_service_1.storeTokenAndGetBypass)(authHeader ?? "", mt5TraderId);
    res.json({ success: true, data: result });
};
exports.storeToken = storeToken;
/** GET /auth/bypass/:bypassToken: Return stored token for bypass URL login (no auth required). */
const getBypass = async (req, res) => {
    const bypassToken = typeof req.params.bypassToken === "string" ? req.params.bypassToken : (req.params.bypassToken?.[0] ?? "");
    const result = await (0, auth_token_service_1.getTokenByBypass)(bypassToken);
    if (!result) {
        res.status(404).json({ success: false, error: "Invalid or expired bypass token" });
        return;
    }
    res.json({ success: true, data: { token: result.token, email: result.email } });
};
exports.getBypass = getBypass;
//# sourceMappingURL=auth.controller.js.map