import express from "express";
import { createLiveEphemeralToken } from "../controllers/liveTokenController.js";

const router = express.Router();

router.get("/live/token", createLiveEphemeralToken);

export default router;