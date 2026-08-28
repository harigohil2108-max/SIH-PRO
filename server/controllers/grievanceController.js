import mongoose from "mongoose";
import Grievance from "../models/Grievance.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { analyzeGrievance as analyzeGrievanceWithAI } from "../services/aiService.js";
import { findDuplicateGrievances } from "../services/duplicateService.js";

// ============================================================
// SLA HELPER FUNCTIONS
// ============================================================

export const calculateSlaDueAt = (priority) => {
  const hoursMap = {
    CRITICAL: 24,
    HIGH: 48,
    MEDIUM: 72,
    LOW: 120,
  };
  const hours = hoursMap[String(priority || "MEDIUM").toUpperCase()] || 72;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};

// Auto-check and mark breaches dynamically on query
const checkAndApplySlaBreaches = async (grievances) => {
  const now = new Date();
  const unresolvedStatuses = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "REOPENED",
  ];

  for (const g of grievances) {
    if (
      unresolvedStatuses.includes(g.status) &&
      g.sla?.dueAt &&
      new Date(g.sla.dueAt) < now &&
      !g.sla.breached
    ) {
      g.sla.breached = true;
      g.sla.escalated = true; // Auto-escalate to Escalation Management
      g.timeline.push({
        status: g.status,
        message: "SLA target breached. Case escalated to department supervisor.",
        timestamp: now,
      });
      await g.save();
    }
  }
};

// ============================================================
// GENERAL HELPERS
// ============================================================

const generateGrievanceId = () => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `GRV-${Date.now()}-${random}`;
};

const buildGrievanceQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { grievanceId: id }] };
  }
  return { grievanceId: id };
};

const normalizeDepartmentName = (value = "") =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const findDepartmentFromAI = async (aiDepartment, aiCategory, aiSubcategory) => {
  const departments = await Department.find({ isActive: true }).lean();
  if (departments.length === 0) return null;

  const normalize = (value = "") =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

  const aiTerms = [
    ...normalize(aiDepartment),
    ...normalize(aiCategory),
    ...normalize(aiSubcategory),
  ];

  if (aiTerms.length === 0) return null;

  const normalizedAI = normalizeDepartmentName(aiDepartment || "");
  let department = departments.find(
    (dept) =>
      normalizeDepartmentName(dept.name) === normalizedAI ||
      normalizeDepartmentName(dept.code) === normalizedAI
  );

  if (department) return department;

  const stopWords = new Set([
    "department",
    "dept",
    "authority",
    "corporation",
    "municipal",
    "municipality",
    "board",
    "and",
    "the",
    "of",
    "for",
    "public",
  ]);

  const meaningfulTerms = aiTerms.filter(
    (term) => term.length >= 4 && !stopWords.has(term)
  );

  let bestMatch = null;
  let bestScore = 0;

  for (const dept of departments) {
    const departmentTerms = [
      ...normalize(dept.name),
      ...normalize(dept.code),
    ].filter((term) => term.length >= 4 && !stopWords.has(term));

    let score = 0;
    for (const aiTerm of meaningfulTerms) {
      for (const deptTerm of departmentTerms) {
        if (
          aiTerm === deptTerm ||
          aiTerm.includes(deptTerm) ||
          deptTerm.includes(aiTerm)
        ) {
          score += 1;
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = dept;
    }
  }

  return bestMatch;
};

const checkOfficerDepartmentAccess = (req, grievance) => {
  if (req.user.role !== "OFFICER") return null;

  if (!req.user.department) {
    return {
      status: 403,
      message: "You are not assigned to a department",
    };
  }

  const officerDeptId = String(
    typeof req.user.department === "object"
      ? req.user.department._id || req.user.department
      : req.user.department
  );

  const grievanceDeptId = grievance.department
    ? String(
        typeof grievance.department === "object"
          ? grievance.department._id || grievance.department
          : grievance.department
      )
    : null;

  if (!grievanceDeptId || grievanceDeptId !== officerDeptId) {
    return {
      status: 403,
      message: "You do not have permission to access grievances from another department",
    };
  }

  return null;
};

const autoAssignOfficer = async (grievance, department) => {
  const officers = await User.find({
    role: "OFFICER",
    department: department._id,
    isActive: true,
  }).select("_id name email");

  if (officers.length === 0) return null;

  const officerIds = officers.map((officer) => officer._id);
  const activeStatuses = ["ASSIGNED", "UNDER_REVIEW", "IN_PROGRESS", "REOPENED"];

  const workload = await Grievance.aggregate([
    {
      $match: {
        department: department._id,
        assignedOfficer: { $in: officerIds },
        status: { $in: activeStatuses },
      },
    },
    {
      $group: {
        _id: "$assignedOfficer",
        count: { $sum: 1 },
      },
    },
  ]);

  const workloadMap = new Map(
    workload.map((item) => [item._id.toString(), item.count])
  );

  return [...officers].sort((a, b) => {
    const aCount = workloadMap.get(a._id.toString()) || 0;
    const bCount = workloadMap.get(b._id.toString()) || 0;
    return aCount - bCount;
  })[0];
};

const notifyAdminsForManualRouting = async (grievance, reason) => {
  try {
    const admins = await User.find({ role: "ADMIN", isActive: true }).select("_id");
    const notifications = admins.map((admin) => ({
      user: admin._id,
      title: "Manual Department Assignment Required",
      message: `Grievance ${grievance.grievanceId} requires manual department routing. (${reason})`,
      type: "MANUAL_ROUTING_REQUIRED",
      relatedGrievance: grievance._id,
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error("Admin notification error:", err.message);
  }
};

// ============================================================
// CONTROLLERS
// ============================================================

export const createGrievance = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      location,
      evidence,
      duplicateMatches,
      aiAnalysis: providedAiAnalysis,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    let initialPriority = "MEDIUM";

    const grievance = await Grievance.create({
      grievanceId: generateGrievanceId(),
      citizen: req.user._id,
      title,
      description,
      category,
      subcategory,
      location,
      evidence,
      status: "SUBMITTED",
      priority: initialPriority,
      sla: {
        dueAt: calculateSlaDueAt(initialPriority),
        breached: false,
        escalated: false,
      },
      department: null,
      assignedOfficer: null,
      duplicateMatches: Array.isArray(duplicateMatches) ? duplicateMatches : [],
      timeline: [
        {
          status: "SUBMITTED",
          message: "Grievance submitted successfully",
          actor: req.user._id,
        },
      ],
    });

    let aiSucceeded = false;

    // ─── Attempt AI Processing ───
    try {
      const aiAnalysis =
        providedAiAnalysis ||
        (await analyzeGrievanceWithAI({
          title: grievance.title,
          description: grievance.description,
          category: grievance.category,
          subcategory: grievance.subcategory,
          location: grievance.location,
        }));

      if (aiAnalysis && (aiAnalysis.department || aiAnalysis.category)) {
        grievance.aiAnalysis = {
          category: aiAnalysis.category,
          subcategory: aiAnalysis.subcategory,
          department: aiAnalysis.department,
          priorityScore: aiAnalysis.priorityScore,
          priorityReason: aiAnalysis.priorityReason,
          confidence: aiAnalysis.confidence,
          summary: aiAnalysis.summary,
        };

        if (aiAnalysis.priorityScore != null) {
          grievance.priority =
            aiAnalysis.priorityScore >= 85
              ? "CRITICAL"
              : aiAnalysis.priorityScore >= 70
              ? "HIGH"
              : aiAnalysis.priorityScore >= 40
              ? "MEDIUM"
              : "LOW";

          // Update SLA deadline according to calculated AI priority
          grievance.sla = grievance.sla || {};
          grievance.sla.dueAt = calculateSlaDueAt(grievance.priority);
        }

        const department = await findDepartmentFromAI(
          aiAnalysis.department,
          aiAnalysis.category,
          aiAnalysis.subcategory
        );

        if (department) {
          grievance.department = department._id;
          const officer = await autoAssignOfficer(grievance, department);

          if (officer) {
            grievance.assignedOfficer = officer._id;
            grievance.status = "ASSIGNED";
            grievance.timeline.push({
              status: "ASSIGNED",
              message: `AI routed to ${department.name} & auto-assigned to ${officer.name}`,
              actor: req.user._id,
            });

            await Notification.create({
              user: officer._id,
              title: "New Grievance Assigned",
              message: `Grievance ${grievance.grievanceId} has been assigned to you.`,
              type: "GRIEVANCE_ASSIGNED",
              relatedGrievance: grievance._id,
            });
          } else {
            grievance.timeline.push({
              status: "SUBMITTED",
              message: `AI routed to ${department.name}. Awaiting officer assignment.`,
              actor: req.user._id,
            });
          }
          aiSucceeded = true;
        }
      }
    } catch (aiError) {
      console.error("AI Analysis failed:", aiError.message);
    }

    // ─── If AI Failed or No Department Found -> Route to Admin Panel ───
    if (!aiSucceeded || !grievance.department) {
      grievance.status = "SUBMITTED";
      grievance.timeline.push({
        status: "SUBMITTED",
        message:
          "AI analysis unavailable/inconclusive. Sent to Admin Panel for manual department assignment.",
        actor: req.user._id,
      });

      await notifyAdminsForManualRouting(
        grievance,
        aiSucceeded ? "No matching department found by AI" : "AI service unavailable"
      );
    }

    await grievance.save();

    // Notify citizen
    try {
      await Notification.create({
        user: req.user._id,
        title: "Grievance Submitted",
        message: `Your grievance ${grievance.grievanceId} has been submitted successfully.`,
        type: "GRIEVANCE_SUBMITTED",
        relatedGrievance: grievance._id,
      });
    } catch (notifErr) {
      console.error("Citizen notif error:", notifErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Grievance created successfully",
      grievance,
    });
  } catch (error) {
    console.error("Create grievance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating grievance",
    });
  }
};

// ─── Manual Department Routing by Admin ───
// POST /api/grievances/:id/route-department
export const routeDepartmentByAdmin = async (req, res) => {
  try {
    const { departmentId, priority } = req.body;

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department ID is required for routing",
      });
    }

    const query = buildGrievanceQuery(req.params.id);
    const grievance = await Grievance.findOne(query);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Invalid department selected",
      });
    }

    grievance.department = department._id;
    if (priority) {
      grievance.priority = priority;
      grievance.sla = grievance.sla || {};
      grievance.sla.dueAt = calculateSlaDueAt(priority);
    }

    const officer = await autoAssignOfficer(grievance, department);
    if (officer) {
      grievance.assignedOfficer = officer._id;
      grievance.status = "ASSIGNED";
      grievance.timeline.push({
        status: "ASSIGNED",
        message: `Manually routed to ${department.name} by Admin and assigned to ${officer.name}`,
        actor: req.user._id,
      });

      await Notification.create({
        user: officer._id,
        title: "New Grievance Assigned",
        message: `Grievance ${grievance.grievanceId} was manually routed to your department and assigned to you.`,
        type: "GRIEVANCE_ASSIGNED",
        relatedGrievance: grievance._id,
      });
    } else {
      grievance.status = "SUBMITTED";
      grievance.timeline.push({
        status: "SUBMITTED",
        message: `Manually routed to ${department.name} by Admin. Awaiting officer assignment.`,
        actor: req.user._id,
      });
    }

    await grievance.save();

    const updated = await Grievance.findById(grievance._id)
      .populate("department", "name code")
      .populate("assignedOfficer", "name email");

    res.json({
      success: true,
      message: `Grievance successfully routed to ${department.name}`,
      grievance: updated,
    });
  } catch (error) {
    console.error("Admin department routing error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while routing grievance",
    });
  }
};

export const getMyGrievances = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "CITIZEN") {
      query = { citizen: req.user._id };
    } else if (req.user.role === "OFFICER") {
      if (!req.user.department) {
        return res.json({
          success: true,
          count: 0,
          grievances: [],
        });
      }
      query = { department: req.user.department };
    } else if (req.user.role === "ADMIN") {
      query = {};
    }

    const grievances = await Grievance.find(query)
      .populate("citizen", "name email phone")
      .populate("department", "name code")
      .populate("assignedOfficer", "name email")
      .sort({ createdAt: -1 });

    // Auto-check and mark SLA breaches dynamically
    await checkAndApplySlaBreaches(grievances);

    res.json({
      success: true,
      count: grievances.length,
      grievances,
    });
  } catch (error) {
    console.error("Get grievances error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching grievances",
    });
  }
};

export const getGrievanceById = async (req, res) => {
  try {
    const query = buildGrievanceQuery(req.params.id);
    const grievance = await Grievance.findOne(query)
      .populate("citizen", "name email phone")
      .populate("department", "name code")
      .populate("assignedOfficer", "name email");

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    if (req.user.role === "CITIZEN") {
      const citizenId = grievance.citizen?._id
        ? grievance.citizen._id.toString()
        : grievance.citizen?.toString();

      if (citizenId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view this grievance",
        });
      }
    }

    const officerAccessError = checkOfficerDepartmentAccess(req, grievance);
    if (officerAccessError) {
      return res.status(officerAccessError.status).json({
        success: false,
        message: officerAccessError.message,
      });
    }

    // Dynamic SLA breach check for single view
    const now = new Date();
    const unresolvedStatuses = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "ASSIGNED",
      "IN_PROGRESS",
      "REOPENED",
    ];
    if (
      unresolvedStatuses.includes(grievance.status) &&
      grievance.sla?.dueAt &&
      new Date(grievance.sla.dueAt) < now &&
      !grievance.sla.breached
    ) {
      grievance.sla.breached = true;
      grievance.timeline.push({
        status: grievance.status,
        message: "SLA target breached. Case flagged for supervisor review & escalation.",
        timestamp: now,
      });
      await grievance.save();
    }

    res.json({
      success: true,
      grievance,
    });
  } catch (error) {
    console.error("Get grievance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching grievance",
    });
  }
};

export const updateGrievanceStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    const allowedStatuses = [
      "SUBMITTED",
      "UNDER_REVIEW",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
      "REJECTED",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid grievance status",
      });
    }

    const query = buildGrievanceQuery(req.params.id);
    const grievance = await Grievance.findOne(query);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    const officerAccessError = checkOfficerDepartmentAccess(req, grievance);
    if (officerAccessError) {
      return res.status(officerAccessError.status).json({
        success: false,
        message: officerAccessError.message,
      });
    }

    grievance.status = status;
    grievance.timeline.push({
      status,
      message: message || `Grievance status changed to ${status}`,
      actor: req.user._id,
    });

    if (status === "RESOLVED") {
      grievance.resolution = {
        ...grievance.resolution,
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
      };
    }

    await grievance.save();

    let notificationType = "STATUS_UPDATE";
    let notificationTitle = "Grievance Status Updated";

    if (status === "RESOLVED") {
      notificationType = "GRIEVANCE_RESOLVED";
      notificationTitle = "Grievance Resolved";
    } else if (status === "REOPENED") {
      notificationType = "GRIEVANCE_REOPENED";
      notificationTitle = "Grievance Reopened";
    }

    await Notification.create({
      user: grievance.citizen,
      title: notificationTitle,
      message:
        message ||
        `Your grievance ${grievance.grievanceId} is now ${status.replace(/_/g, " ")}.`,
      type: notificationType,
      relatedGrievance: grievance._id,
    });

    res.json({
      success: true,
      message: "Grievance status updated successfully",
      grievance,
    });
  } catch (error) {
    console.error("Update grievance status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating grievance status",
    });
  }
};

export const assignGrievance = async (req, res) => {
  try {
    const { officerId, departmentId } = req.body;
    if (!officerId) {
      return res.status(400).json({
        success: false,
        message: "Officer ID is required",
      });
    }

    const query = buildGrievanceQuery(req.params.id);
    const grievance = await Grievance.findOne(query);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    const officer = await User.findOne({
      _id: officerId,
      role: "OFFICER",
      isActive: true,
    });

    if (!officer) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive officer",
      });
    }

    if (
      departmentId &&
      officer.department &&
      officer.department.toString() !== departmentId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected officer does not belong to the selected department",
      });
    }

    grievance.assignedOfficer = officerId;
    if (officer.department) {
      grievance.department = officer.department;
    } else if (departmentId) {
      grievance.department = departmentId;
    }

    grievance.status = "ASSIGNED";
    grievance.timeline.push({
      status: "ASSIGNED",
      message: "Grievance assigned to an officer",
      actor: req.user._id,
    });

    await grievance.save();

    await Notification.create({
      user: officer._id,
      title: "New Grievance Assigned",
      message: `Grievance ${grievance.grievanceId} has been assigned to you.`,
      type: "GRIEVANCE_ASSIGNED",
      relatedGrievance: grievance._id,
    });

    await Notification.create({
      user: grievance.citizen,
      title: "Grievance Assigned",
      message: `Your grievance ${grievance.grievanceId} has been assigned to a grievance officer.`,
      type: "GRIEVANCE_ASSIGNED",
      relatedGrievance: grievance._id,
    });

    const updatedGrievance = await Grievance.findById(grievance._id)
      .populate("assignedOfficer", "name email role")
      .populate("department", "name code");

    res.json({
      success: true,
      message: "Grievance assigned successfully",
      grievance: updatedGrievance,
    });
  } catch (error) {
    console.error("Assign grievance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while assigning grievance",
    });
  }
};

export const escalateGrievance = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Escalation reason is required",
      });
    }

    const query = buildGrievanceQuery(req.params.id);
    const grievance = await Grievance.findOne(query);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    const officerAccessError = checkOfficerDepartmentAccess(req, grievance);
    if (officerAccessError) {
      return res.status(officerAccessError.status).json({
        success: false,
        message: officerAccessError.message,
      });
    }

    grievance.sla = grievance.sla || {};
    grievance.sla.escalated = true;

    grievance.timeline.push({
      status: grievance.status,
      message: `Grievance escalated: ${reason}`,
      actor: req.user._id,
    });

    await grievance.save();

    await Notification.create({
      user: grievance.citizen,
      title: "Grievance Escalated",
      message: `Your grievance ${grievance.grievanceId} has been escalated. Reason: ${reason}`,
      type: "ESCALATION",
      relatedGrievance: grievance._id,
    });

    res.json({
      success: true,
      message: "Grievance escalated successfully",
      grievance,
    });
  } catch (error) {
    console.error("Escalate grievance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while escalating grievance",
    });
  }
};

export const reopenGrievance = async (req, res) => {
  try {
    const { reason } = req.body;
    const query = buildGrievanceQuery(req.params.id);
    const grievance = await Grievance.findOne(query);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    if (req.user.role === "CITIZEN") {
      if (grievance.citizen.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only reopen your own grievance",
        });
      }
    }

    const officerAccessError = checkOfficerDepartmentAccess(req, grievance);
    if (officerAccessError) {
      return res.status(officerAccessError.status).json({
        success: false,
        message: officerAccessError.message,
      });
    }

    grievance.status = "REOPENED";
    grievance.timeline.push({
      status: "REOPENED",
      message: reason || "Grievance reopened",
      actor: req.user._id,
    });

    await grievance.save();

    await Notification.create({
      user: grievance.citizen,
      title: "Grievance Reopened",
      message: reason || `Your grievance ${grievance.grievanceId} has been reopened.`,
      type: "GRIEVANCE_REOPENED",
      relatedGrievance: grievance._id,
    });

    res.json({
      success: true,
      message: "Grievance reopened successfully",
      grievance,
    });
  } catch (error) {
    console.error("Reopen grievance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while reopening grievance",
    });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const query = buildGrievanceQuery(req.params.id);
    const grievance = await Grievance.findOne(query);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    if (grievance.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only review your own grievance",
      });
    }

    grievance.feedback = {
      rating,
      comment,
      submittedAt: new Date(),
    };

    await grievance.save();

    res.json({
      success: true,
      message: "Feedback submitted successfully",
      feedback: grievance.feedback,
    });
  } catch (error) {
    console.error("Feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while submitting feedback",
    });
  }
};

export const analyzeGrievancePreview = async (req, res) => {
  try {
    const { title, description, category, subcategory, location, evidence } = req.body;
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const aiAnalysis = await analyzeGrievanceWithAI({
      title,
      description,
      category,
      subcategory,
      location,
      evidence,
    });

    return res.json({
      success: true,
      aiAnalysis,
    });
  } catch (error) {
    console.error("AI grievance analysis error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "AI analysis failed",
      error: process.env.NODE_ENV === "production" ? undefined : String(error),
    });
  }
};

export const checkDuplicateGrievances = async (req, res) => {
  try {
    const { title, description, category, subcategory, location } = req.body;
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const query = {
      status: { $nin: ["REJECTED", "CANCELLED"] },
    };

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;

    const existingGrievances = await Grievance.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .select("_id title description category subcategory location")
      .lean();

    const newGrievance = {
      title,
      description,
      category: category || "",
      subcategory: subcategory || "",
      location: {
        city: location?.city || "",
        state: location?.state || "",
      },
    };

    const matches = await findDuplicateGrievances(newGrievance, existingGrievances);

    const duplicateMatches = matches
      .filter(
        (match) =>
          match.similarity >= 0.75 &&
          existingGrievances.some((g) => g._id.toString() === match.grievanceId)
      )
      .map((match) => {
        const grievance = existingGrievances.find(
          (item) => item._id.toString() === match.grievanceId
        );

        return {
          grievance: match.grievanceId,
          title: grievance?.title || "Similar grievance",
          description: grievance?.description || "",
          category: grievance?.category || "",
          subcategory: grievance?.subcategory || "",
          similarity: match.similarity,
        };
      });

    return res.json({
      success: true,
      hasDuplicates: duplicateMatches.length > 0,
      duplicateMatches,
    });
  } catch (error) {
    console.error("Duplicate grievance check error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to check for duplicate grievances",
    });
  }
};

export const getGrievanceMessages = async (req, res) => {
  try {
    const query = buildGrievanceQuery(req.params.id);
    const grievance = await Grievance.findOne(query).populate(
      "messages.sender",
      "name email role"
    );

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    if (
      req.user.role === "CITIZEN" &&
      grievance.citizen.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only access messages from your own grievance",
      });
    }

    if (req.user.role === "OFFICER") {
      const accessError = checkOfficerDepartmentAccess(req, grievance);
      if (accessError) {
        return res.status(accessError.status).json({
          success: false,
          message: accessError.message,
        });
      }
    }

    return res.json({
      success: true,
      messages: grievance.messages || [],
    });
  } catch (error) {
    console.error("Get grievance messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching messages",
    });
  }
};

export const sendGrievanceMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    const query = buildGrievanceQuery(req.params.id);
    const grievance = await Grievance.findOne(query);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    if (
      req.user.role === "CITIZEN" &&
      grievance.citizen.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only message on your own grievance",
      });
    }

    if (req.user.role === "OFFICER") {
      const accessError = checkOfficerDepartmentAccess(req, grievance);
      if (accessError) {
        return res.status(accessError.status).json({
          success: false,
          message: accessError.message,
        });
      }
    }

    grievance.messages.push({
      sender: req.user._id,
      senderRole: req.user.role,
      message: message.trim(),
      timestamp: new Date(),
    });

    await grievance.save();

    const updatedGrievance = await Grievance.findById(grievance._id).populate(
      "messages.sender",
      "name email role"
    );

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      sentMessage:
        updatedGrievance.messages[updatedGrievance.messages.length - 1],
    });
  } catch (error) {
    console.error("Send grievance message error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while sending message",
    });
  }
};

// ─── Officer Decision Workflow ───
// POST /api/grievances/:id/decision
export const submitOfficerDecision = async (req, res) => {
  try {
    const { action, newPriority, reason } = req.body;
    // action: 'ACCEPT' | 'OVERRIDE'

    const query = buildGrievanceQuery(req.params.id);
    const grievance = await Grievance.findOne(query);

    if (!grievance) {
      return res.status(404).json({ success: false, message: "Grievance not found" });
    }

    const accessError = checkOfficerDepartmentAccess(req, grievance);
    if (accessError) {
      return res.status(accessError.status).json({ success: false, message: accessError.message });
    }

    if (action === "OVERRIDE") {
      if (!reason || !reason.trim()) {
        return res.status(400).json({
          success: false,
          message: "Reason is required when overriding AI decision",
        });
      }

      const oldPriority = grievance.priority;
      const targetPriority = newPriority || grievance.priority;
      grievance.priority = targetPriority;

      // Recalculate SLA based on new priority if case is still open
      if (!["RESOLVED", "CLOSED"].includes(grievance.status)) {
        grievance.sla = grievance.sla || {};
        grievance.sla.dueAt = calculateSlaDueAt(targetPriority);
        grievance.sla.breached = false;
      }

      grievance.aiAnalysis = grievance.aiAnalysis || {};
      grievance.aiAnalysis.overridden = true;
      grievance.aiAnalysis.overrideReason = reason.trim();
      grievance.aiAnalysis.overriddenBy = req.user._id;

      grievance.timeline.push({
        status: grievance.status,
        message: `Priority overridden from ${oldPriority} to ${targetPriority}. SLA deadline updated. Reason: ${reason.trim()}`,
        actor: req.user._id,
      });
    } else {
      // ACCEPT
      grievance.timeline.push({
        status: grievance.status === "ASSIGNED" ? "IN_PROGRESS" : grievance.status,
        message: `Officer accepted AI assessment (${grievance.priority}). Case moved to in-progress.`,
        actor: req.user._id,
      });

      if (grievance.status === "ASSIGNED") {
        grievance.status = "IN_PROGRESS";
      }
    }

    await grievance.save();

    const updated = await Grievance.findById(grievance._id)
      .populate("citizen", "name email phone")
      .populate("department", "name code")
      .populate("assignedOfficer", "name email");

    res.json({
      success: true,
      message: action === "OVERRIDE" ? "AI assessment overridden successfully" : "AI assessment accepted",
      grievance: updated,
    });
  } catch (error) {
    console.error("Officer decision error:", error);
    res.status(500).json({ success: false, message: "Failed to submit decision" });
  }
};