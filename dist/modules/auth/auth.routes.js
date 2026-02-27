"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_validator_1 = require("./auth.validator");
const auth_middleware_1 = require("./auth.middleware");
const asyncHandler_1 = require("../../utils/asyncHandler");
const router = (0, express_1.Router)();
router.post("/register", (0, validateRequest_1.validateRequest)({ body: auth_validator_1.registerSchema.shape.body }), (0, asyncHandler_1.asyncHandler)(auth_controller_1.register));
router.post("/login", (0, validateRequest_1.validateRequest)({ body: auth_validator_1.loginSchema.shape.body }), (0, asyncHandler_1.asyncHandler)(auth_controller_1.login));
router.post("/logout", (0, asyncHandler_1.asyncHandler)(auth_controller_1.logout));
router.get("/me", auth_middleware_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(auth_controller_1.getMe));
// Store Capital Chain token in DB (send token in Authorization header). Returns { bypassToken }.
router.post("/store-token", (0, asyncHandler_1.asyncHandler)(auth_controller_1.storeToken));
// Bypass login: GET /auth/bypass/:bypassToken returns { token, email } for URL login
router.get("/bypass/:bypassToken", (0, asyncHandler_1.asyncHandler)(auth_controller_1.getBypass));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map