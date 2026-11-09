import express from "express";
import { createLiveEphemeralToken } from "../controllers/liveTokenController.js";
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/checkRole.js';

const router = express.Router();

router.get("/live/token", authenticate, checkRole(['student']), createLiveEphemeralToken);

export default router;