import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import grievanceRoutes from "./routes/grievanceRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { analyzeGrievance } from "./services/aiService.js";

import connectDB from "./config/db.js";

dotenv.config();

connectDB();

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "100mb" }));

// ============================================================
// API ROUTES
// ============================================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Nivara backend is running successfully",
  });
});
app.get("/api/ai-test", async (req, res) => {
  try {
    const message = await testAI();

    res.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("AI test error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
app.post("/api/ai/analyze-test", async (req, res) => {
  try {
    const result = await analyzeGrievance(req.body);

    res.json({
      success: true,
      analysis: result,
    });
  } catch (error) {
    console.error("AI analysis test error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ============================================================
// SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Nivara server running on http://localhost:${PORT}`);
});