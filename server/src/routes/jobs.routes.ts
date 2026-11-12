import { Router } from "express";
import { submitJob, getJobStatus } from "../controllers/jobs.controller.js";

const router = Router();

router.post("/submit", submitJob);
router.get("/:jobId", getJobStatus);

export default router;