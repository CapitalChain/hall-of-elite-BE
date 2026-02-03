import { Router } from "express";
import { register, login, logout, getMe } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { registerSchema, loginSchema } from "./auth.validator";
import { authMiddleware } from "./auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  asyncHandler(register)
);

router.post(
  "/login",
  validateRequest(loginSchema),
  asyncHandler(login)
);

router.post(
  "/logout",
  asyncHandler(logout)
);

router.get("/me", authMiddleware, asyncHandler(getMe));

export default router;
