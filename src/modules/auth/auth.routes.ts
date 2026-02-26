import { Router } from "express";
import { register, login, logout, getMe, storeToken, getBypass } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { registerSchema, loginSchema } from "./auth.validator";
import { authMiddleware } from "./auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post(
  "/register",
  validateRequest({ body: registerSchema.shape.body }),
  asyncHandler(register)
);

router.post(
  "/login",
  validateRequest({ body: loginSchema.shape.body }),
  asyncHandler(login)
);

router.post(
  "/logout",
  asyncHandler(logout)
);

router.get("/me", authMiddleware, asyncHandler(getMe));

// Store Capital Chain token in DB (send token in Authorization header). Returns { bypassToken }.
router.post("/store-token", asyncHandler(storeToken));

// Bypass login: GET /auth/bypass/:bypassToken returns { token, email } for URL login
router.get("/bypass/:bypassToken", asyncHandler(getBypass));

export default router;
