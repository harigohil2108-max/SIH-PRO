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
  addGrievanceEvidence,
  confirmGrievanceResolution,
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
// GRIEVANCE COMMUNICATION
//

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

router.post(
  "/:id/evidence",
  authenticateUser,
  authorizeRoles("CITIZEN", "OFFICER", "ADMIN", "DEPARTMENT_HEAD"),
  addGrievanceEvidence
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

// Officer / Admin / Department Head can escalate
router.post(
  "/:id/escalate",
  authenticateUser,
  authorizeRoles(
    "OFFICER",
    "ADMIN",
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
    "CITIZEN"
  ),
  reopenGrievance
);

// Citizen can submit feedback
router.post(
  "/:id/confirm-resolution",
  authenticateUser,
  authorizeRoles("CITIZEN"),
  confirmGrievanceResolution
);

router.post(
  "/:id/feedback",
  authenticateUser,
  authorizeRoles("CITIZEN"),
  submitFeedback
);


export default router;
