import { Router } from "express";
import { getHealth, pingNextjs } from "../controllers/health.controller";

const router = Router();

router.get("/health", getHealth);
router.get("/ping-nextjs", pingNextjs);

export default router;
