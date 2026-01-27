import { Router } from "express";
import { runScoring } from "./scoring.controller";

const router = Router();

router.post("/run", runScoring);

export default router;
