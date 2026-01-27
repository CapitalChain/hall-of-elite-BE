import { Router } from "express";
import { register, login, logout } from "./auth.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { registerSchema, loginSchema } from "./auth.validator";

const router = Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  register
);

router.post(
  "/login",
  validateRequest(loginSchema),
  login
);

router.post(
  "/logout",
  logout
);

export default router;
