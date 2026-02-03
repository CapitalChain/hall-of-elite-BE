import { Router } from "express";
import { getScoringConfig, runScoring } from "./scoring.controller";

const router = Router();

router.get("/config", getScoringConfig);
router.post("/run", runScoring);

export default router;
