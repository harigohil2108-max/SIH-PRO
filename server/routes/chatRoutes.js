import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import { chat } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", authenticateUser, chat);

export default router;