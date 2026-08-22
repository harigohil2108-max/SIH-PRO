import Grievance from "../models/Grievance.js";
import Department from "../models/Department.js";
import User from "../models/User.js";

const generateGrievanceId = () => {
  const random = Math.floor(1000 + Math.random() * 9000);

  return `GRV-${Date.now()}-${random}`;
};

// ============================================================
// CREATE GRIEVANCE
// POST /api/grievances
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
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

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
      priority: "MEDIUM",

      timeline: [
        {
          status: "SUBMITTED",
          message: "Grievance submitted successfully",
          actor: req.user._id,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Grievance created successfully",
      grievance,
    });
  } catch (error) {
    console.error("Create grievance error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating grievance",
    });
  }
};

// ============================================================
// GET MY GRIEVANCES
// GET /api/grievances
// ============================================================

export const getMyGrievances = async (req, res) => {
  try {
    const grievances = await Grievance.find({
      citizen: req.user._id,
    })
      .populate("department", "name code")
      .populate("assignedOfficer", "name email")
      .sort({ createdAt: -1 });

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

// ============================================================
// GET GRIEVANCE BY ID
// GET /api/grievances/:id
// ============================================================

export const getGrievanceById = async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate("citizen", "name email phone")
      .populate("department", "name code")
      .populate("assignedOfficer", "name email");

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    // Citizens can only view their own grievances.
    if (
      req.user.role === "CITIZEN" &&
      grievance.citizen._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this grievance",
      });
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

// ============================================================
// UPDATE GRIEVANCE STATUS
// PATCH /api/grievances/:id/status
// ============================================================

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

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    grievance.status = status;

    grievance.timeline.push({
      status,
      message:
        message || `Grievance status changed to ${status}`,
      actor: req.user._id,
    });

    // Store resolution information when grievance is resolved.
    if (status === "RESOLVED") {
      grievance.resolution = {
        ...grievance.resolution,
        resolvedAt: new Date(),
        resolvedBy: req.user._id,
      };
    }

    await grievance.save();

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

// ============================================================
// ASSIGN GRIEVANCE
// POST /api/grievances/:id/assign
// ============================================================

export const assignGrievance = async (req, res) => {
  try {
    const { officerId, departmentId } = req.body;

    if (!officerId) {
      return res.status(400).json({
        success: false,
        message: "Officer ID is required",
      });
    }

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    grievance.assignedOfficer = officerId;

    if (departmentId) {
      grievance.department = departmentId;
    }

    grievance.status = "ASSIGNED";

    grievance.timeline.push({
      status: "ASSIGNED",
      message: "Grievance assigned to an officer",
      actor: req.user._id,
    });

    await grievance.save();

    const updatedGrievance = await Grievance.findById(
      grievance._id
    )
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

// ============================================================
// ESCALATE GRIEVANCE
// POST /api/grievances/:id/escalate
// ============================================================

export const escalateGrievance = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Escalation reason is required",
      });
    }

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    grievance.sla.escalated = true;

    grievance.timeline.push({
      status: grievance.status,
      message: `Grievance escalated: ${reason}`,
      actor: req.user._id,
    });

    await grievance.save();

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

// ============================================================
// REOPEN GRIEVANCE
// POST /api/grievances/:id/reopen
// ============================================================

export const reopenGrievance = async (req, res) => {
  try {
    const { reason } = req.body;

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    // If citizen is reopening, make sure it is their grievance.
    if (
      req.user.role === "CITIZEN" &&
      grievance.citizen.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only reopen your own grievance",
      });
    }

    grievance.status = "REOPENED";

    grievance.timeline.push({
      status: "REOPENED",
      message: reason || "Grievance reopened",
      actor: req.user._id,
    });

    await grievance.save();

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

// ============================================================
// SUBMIT FEEDBACK
// POST /api/grievances/:id/feedback
// ============================================================

export const submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    // Citizens can only review their own grievances.
    if (
      grievance.citizen.toString() !== req.user._id.toString()
    ) {
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