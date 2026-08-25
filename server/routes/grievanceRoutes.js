import express from "express";

import authenticateUser from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/authorizeRole.js";

import {
  createGrievance,
  getMyGrievances,
  getGrievanceById,
  addGrievanceMessage,
  addGrievanceEvidence,
  updateGrievanceStatus,
  assignGrievance,
  escalateGrievance,
  reopenGrievance,
  confirmGrievanceResolution,
  submitFeedback,
  analyzeGrievancePreview,
  checkDuplicateGrievances,
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

router.get(
  "/:id",
  authenticateUser,
  getGrievanceById
);

// ============================================================
// GRIEVANCE WORKFLOW ROUTES
// ============================================================

// Officer / Admin / Department Head can update status
router.patch(
  "/:id/status",
  authenticateUser,
  authorizeRoles(
    "OFFICER",
    "ADMIN",
    
  ),
  updateGrievanceStatus
);

// Admin / Department Head can assign grievances
router.post(
  "/:id/assign",
  authenticateUser,
  authorizeRoles(
    "ADMIN",
    
  ),
  assignGrievance
);

// Citizens can escalate their own grievances; staff can escalate within role access.
router.post(
  "/:id/escalate",
  authenticateUser,
  authorizeRoles(
    "OFFICER",
    "ADMIN",
    "CITIZEN",
  ),
  escalateGrievance
);

router.post(
  "/:id/messages",
  authenticateUser,
  authorizeRoles("CITIZEN", "OFFICER", "ADMIN", "DEPARTMENT_HEAD"),
  addGrievanceMessage
);

router.post(
  "/:id/evidence",
  authenticateUser,
  authorizeRoles("CITIZEN", "OFFICER", "ADMIN", "DEPARTMENT_HEAD"),
  addGrievanceEvidence
);

// Citizen can reopen their own grievance
// Staff can also reopen
router.post(
  "/:id/reopen",
  authenticateUser,
  authorizeRoles(
    "OFFICER",
    "ADMIN",
    "CITIZEN"
  ),
  reopenGrievance
);

router.post(
  "/:id/confirm-resolution",
  authenticateUser,
  authorizeRoles("CITIZEN"),
  confirmGrievanceResolution
);

// Citizen can submit feedback
router.post(
  "/:id/feedback",
  authenticateUser,
  authorizeRoles("CITIZEN"),
  submitFeedback
);


export default router;
