"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = require("./config/env");
const logger_1 = require("./middlewares/logger");
const errorHandler_1 = require("./middlewares/errorHandler");
const rateLimit_1 = require("./middlewares/rateLimit");
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const trader_routes_1 = __importDefault(require("./routes/trader.routes"));
const rewards_routes_1 = __importDefault(require("./modules/rewards/rewards.routes"));
const admin_routes_1 = __importDefault(require("./modules/admin/admin.routes"));
const mt5_routes_1 = __importDefault(require("./modules/mt5/mt5.routes"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const scoring_routes_1 = __importDefault(require("./modules/scoring/scoring.routes"));
const progress_routes_1 = __importDefault(require("./modules/progress/progress.routes"));
const payout_routes_1 = __importDefault(require("./modules/payout/payout.routes"));
const createApp = () => {
    const app = (0, express_1.default)();
    const allowedOrigins = [
        env_1.env.CORS_ORIGIN,
        ...(env_1.env.CORS_ORIGINS ? env_1.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean) : []),
    ];
    app.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    app.use(logger_1.requestLogger);
    // General API rate limit (all routes)
    app.use(rateLimit_1.apiRateLimiter);
    // Stricter rate limit for auth (login/register/logout)
    app.use("/auth", rateLimit_1.authRateLimiter);
    app.use("/health", health_routes_1.default);
    app.use("/auth", auth_routes_1.default);
    app.use("/elite/traders", trader_routes_1.default);
    app.use("/rewards", rewards_routes_1.default);
    app.use("/admin", admin_routes_1.default);
    app.use("/mt5", mt5_routes_1.default);
    app.use("/scoring", scoring_routes_1.default);
    app.use("/user", progress_routes_1.default);
    app.use("/payout", payout_routes_1.default);
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
//# sourceMappingURL=app.js.map