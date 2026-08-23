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
    "DEPARTMENT_HEAD"
  ),
  updateGrievanceStatus
);

// Admin / Department Head can assign grievances
router.post(
  "/:id/assign",
  authenticateUser,
  authorizeRoles(
    "ADMIN",
    "DEPARTMENT_HEAD"
  ),
  assignGrievance
);

// Officer / Admin / Department Head can escalate
router.post(
  "/:id/escalate",
  authenticateUser,
  authorizeRoles(
    "OFFICER",
    "ADMIN",
    "DEPARTMENT_HEAD"
  ),
  escalateGrievance
);

// Citizen can reopen their own grievance
// Staff can also reopen
router.post(
  "/:id/reopen",
  authenticateUser,
  authorizeRoles(
    "OFFICER",
    "ADMIN",
    "DEPARTMENT_HEAD",
    "CITIZEN"
  ),
  reopenGrievance
);

// Citizen can submit feedback
router.post(
  "/:id/feedback",
  authenticateUser,
  authorizeRoles("CITIZEN"),
  submitFeedback
);


export default router;
