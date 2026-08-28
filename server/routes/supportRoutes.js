import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import { chatWithSupport } from "../controllers/supportController.js";

const router = express.Router();

router.post("/chat", authenticateUser, chatWithSupport);

export default router;
