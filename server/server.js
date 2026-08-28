import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import grievanceRoutes from "./routes/grievanceRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { analyzeGrievance } from "./services/aiService.js";

import connectDB from "./config/db.js";
import Grievance from "./models/Grievance.js";

dotenv.config();

// ============================================================
// DATABASE & SLA MIGRATION
// ============================================================

const backfillExistingSla = async () => {
  try {
    const grievancesWithoutSla = await Grievance.find({
      $or: [
        { "sla.dueAt": { $exists: false } },
        { "sla.dueAt": null },
      ],
    });

    if (grievancesWithoutSla.length > 0) {
      const hoursMap = { CRITICAL: 24, HIGH: 48, MEDIUM: 72, LOW: 120 };

      for (const g of grievancesWithoutSla) {
        const hours = hoursMap[String(g.priority || "MEDIUM").toUpperCase()] || 72;
        const createdTime = new Date(g.createdAt || Date.now()).getTime();
        const dueAt = new Date(createdTime + hours * 60 * 60 * 1000);

        g.sla = {
          dueAt,
          breached: new Date() > dueAt && !["RESOLVED", "CLOSED"].includes(g.status),
          escalated: g.sla?.escalated || false,
        };

        await g.save();
      }
      console.log(`Successfully backfilled SLA deadlines for ${grievancesWithoutSla.length} grievance(s).`);
    }
  } catch (err) {
    console.error("SLA backfill error:", err.message);
  }
};

const initializeApp = async () => {
  await connectDB();
  await backfillExistingSla();
};

initializeApp();

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());
app.use(helmet());
app.use(express.json());

// ============================================================
// API ROUTES
// ============================================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/grievances", grievanceRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/notifications", notificationRoutes);

// ============================================================
// HEALTH & TEST ENDPOINTS
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Nivara backend is running successfully",
  });
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