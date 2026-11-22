import { Router } from "express";
import {
  getProblems,
  getProblemById,
  runProblem,
  submitProblem,
} from "../controllers/dsa.controller.js";

const router = Router();

router.get("/problems", getProblems);
router.get("/problems/:id", getProblemById);
router.post("/problems/:id/run", runProblem);
router.post("/problems/:id/submit", submitProblem);

export default router;
