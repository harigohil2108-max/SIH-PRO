import express from "express";

import authenticateUser from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/authorizeRole.js";

import {
  createGrievance,
  getMyGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  assignGrievance,
  escalateGrievance,
  reopenGrievance,
  submitFeedback,
  analyzeGrievancePreview,
  checkDuplicateGrievances,
  getGrievanceMessages,
  sendGrievanceMessage,
  routeDepartmentByAdmin,
  submitOfficerDecision
} from "../controllers/grievanceController.js";

const router = express.Router();

// ============================================================
// CITIZEN GRIEVANCE ROUTES
// ============================================================

router.post(
  "/",
  authenticateUser,
  createGrievance
);

router.get(
  "/",
  authenticateUser,
  getMyGrievances
);

router.post(
  "/ai-analyze",
  authenticateUser,
  analyzeGrievancePreview
);

router.post(
  "/check-duplicates",
  authenticateUser,
  checkDuplicateGrievances
);

// ============================================================
// GRIEVANCE DETAILS
// ============================================================

router.get(
  "/:id",
  authenticateUser,
  getGrievanceById
);

// ============================================================
// GRIEVANCE COMMUNICATION
// ============================================================

router.get(
  "/:id/messages",
  authenticateUser,
  authorizeRoles("CITIZEN", "OFFICER", "ADMIN"),
  getGrievanceMessages
);

router.post(
  "/:id/messages",
  authenticateUser,
  authorizeRoles("CITIZEN", "OFFICER", "ADMIN"),
  sendGrievanceMessage
);

// ============================================================
// GRIEVANCE WORKFLOW ROUTES
// ============================================================

// Officer / Admin can update status
router.patch(
  "/:id/status",
  authenticateUser,
  authorizeRoles("OFFICER", "ADMIN"),
  updateGrievanceStatus
);

// Admin can assign grievances
router.post(
  "/:id/assign",
  authenticateUser,
  authorizeRoles("ADMIN"),
  assignGrievance
);

// Admin manual department routing
router.post(
  "/:id/route-department",
  authenticateUser,
  authorizeRoles("ADMIN"),
  routeDepartmentByAdmin
);

// Officer / Admin can escalate
router.post(
  "/:id/escalate",
  authenticateUser,
  authorizeRoles("OFFICER", "ADMIN"),
  escalateGrievance
);

// Citizen / Officer / Admin can reopen
router.post(
  "/:id/reopen",
  authenticateUser,
  authorizeRoles("OFFICER", "ADMIN", "CITIZEN"),
  reopenGrievance
);

// Citizen can submit feedback
router.post(
  "/:id/feedback",
  authenticateUser,
  authorizeRoles("CITIZEN"),
  submitFeedback
);

router.post(
  "/:id/decision",
  authenticateUser,
  authorizeRoles("OFFICER", "ADMIN"),
  submitOfficerDecision
);

export default router;