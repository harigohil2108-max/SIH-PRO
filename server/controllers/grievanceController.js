import Grievance from "../models/Grievance.js";
import Department from "../models/Department.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import {
  analyzeGrievance as analyzeGrievanceWithAI,
} from "../services/aiService.js";
import {
  findDuplicateGrievances,
} from "../services/duplicateService.js";

const generateGrievanceId = () => {
  const random = Math.floor(1000 + Math.random() * 9000);

  return `GRV-${Date.now()}-${random}`;
};

const normalizeDepartmentName = (value = "") =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const findDepartmentFromAI = async (aiDepartment) => {
  if (!aiDepartment) {
    return null;
  }

  const departments = await Department.find({
    isActive: true,
  }).lean();

  const aiName = normalizeDepartmentName(aiDepartment);

  // First: exact match against name or code
  let department = departments.find(
    (dept) =>
      normalizeDepartmentName(dept.name) === aiName ||
      normalizeDepartmentName(dept.code) === aiName
  );

  if (department) {
    return department;
  }

  // Second: allow AI to return a slightly longer/shorter department name
  department = departments.find((dept) => {
    const departmentName = normalizeDepartmentName(dept.name);
    const departmentCode = normalizeDepartmentName(dept.code);

    return (
      aiName.includes(departmentName) ||
      departmentName.includes(aiName) ||
      aiName.includes(departmentCode) ||
      departmentCode.includes(aiName)
    );
  });

  return department || null;
};

/*
  Check whether an Officer belongs to the grievance's department.

  Citizens are checked separately using ownership.
  Admins have access to all grievances.
*/
const checkOfficerDepartmentAccess = (req, grievance) => {
  if (req.user.role !== "OFFICER") {
    return null;
  }

  if (!req.user.department) {
    return {
      status: 403,
      message: "You are not assigned to a department",
    };
  }

  if (
    !grievance.department ||
    grievance.department.toString() !==
      req.user.department.toString()
  ) {
    return {
      status: 403,
      message:
        "You do not have permission to access grievances from another department",
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

  // No officer available for this department
  if (officers.length === 0) {
    return null;
  }

  const officerIds = officers.map((officer) => officer._id);

  const activeStatuses = [
    "ASSIGNED",
    "UNDER_REVIEW",
    "IN_PROGRESS",
    "REOPENED",
  ];

  const workload = await Grievance.aggregate([
    {
      $match: {
        department: department._id,
        assignedOfficer: {
          $in: officerIds,
        },
        status: {
          $in: activeStatuses,
        },
      },
    },
    {
      $group: {
        _id: "$assignedOfficer",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const workloadMap = new Map(
    workload.map((item) => [
      item._id.toString(),
      item.count,
    ])
  );

  // Pick officer with the lowest active workload
  const selectedOfficer = [...officers].sort((a, b) => {
    const aCount = workloadMap.get(a._id.toString()) || 0;
    const bCount = workloadMap.get(b._id.toString()) || 0;

    return aCount - bCount;
  })[0];

  return selectedOfficer;
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
      duplicateMatches,
      aiAnalysis: providedAiAnalysis,
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

      duplicateMatches: Array.isArray(duplicateMatches)
        ? duplicateMatches
        : [],

      timeline: [
        {
          status: "SUBMITTED",
          message: "Grievance submitted successfully",
          actor: req.user._id,
        },
      ],
    });

    // --------------------------------------------------------
    // AI ANALYSIS
    // --------------------------------------------------------

    try {
      const aiAnalysis =
        providedAiAnalysis ||
        await analyzeGrievanceWithAI({
          title: grievance.title,
          description: grievance.description,
          category: grievance.category,
          subcategory: grievance.subcategory,
          location: grievance.location,
          evidence: grievance.evidence,
        });

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
      }


            // --------------------------------------------------------
      // AUTOMATIC DEPARTMENT ROUTING
      // --------------------------------------------------------

      const department = await findDepartmentFromAI(
        aiAnalysis.department
      );

      if (department) {
        grievance.department = department._id;

        // ------------------------------------------------------
        // AUTOMATIC OFFICER ASSIGNMENT
        // ------------------------------------------------------

        const officer = await autoAssignOfficer(
          grievance,
          department
        );

                  if (officer) {
            grievance.assignedOfficer = officer._id;
            grievance.status = "ASSIGNED";

            grievance.timeline.push({
              status: "ASSIGNED",
              message: `Automatically assigned to ${officer.name} in ${department.name}`,
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
            message: `Routed to ${department.name}. Awaiting officer assignment.`,
            actor: req.user._id,
          });
        }
      } else {
        console.warn(
          `No matching department found for AI department: ${aiAnalysis.department}`
        );
      }

      await grievance.save();

      console.log("AI grievance analysis completed");
    } catch (aiError) {
      console.error(
        "AI analysis skipped:",
        aiError.message
      );
    }

    // --------------------------------------------------------
    // CREATE NOTIFICATION FOR CITIZEN
    // --------------------------------------------------------

    await Notification.create({
      user: req.user._id,

      title: "Grievance Submitted",

      message: `Your grievance ${grievance.grievanceId} has been submitted successfully.`,

      type: "GRIEVANCE_SUBMITTED",

      relatedGrievance: grievance._id,
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
// GET GRIEVANCES
// GET /api/grievances
//
// CITIZEN  -> own grievances
// OFFICER  -> grievances belonging to their department
// ADMIN    -> all grievances
// ============================================================

export const getMyGrievances = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "CITIZEN") {
      query = {
        citizen: req.user._id,
      };
    } else if (req.user.role === "OFFICER") {
      if (!req.user.department) {
        return res.json({
          success: true,
          count: 0,
          grievances: [],
        });
      }

      query = {
        department: req.user.department,
      };
    } else if (req.user.role === "ADMIN") {
      query = {};
    }

    const grievances = await Grievance.find(query)
      .populate("citizen", "name email phone")
      .populate("department", "name code")
      .populate("assignedOfficer", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: grievances.length,
      grievances,
    });
  } catch (error) {
    console.error(
      "Get grievances error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching grievances",
    });
  }
};

// ============================================================
// GET GRIEVANCE BY ID
// GET /api/grievances/:id
// ============================================================

export const getGrievanceById = async (
  req,
  res
) => {
  try {
    const grievance =
      await Grievance.findById(req.params.id)
        .populate(
          "citizen",
          "name email phone"
        )
        .populate(
          "department",
          "name code"
        )
        .populate(
          "assignedOfficer",
          "name email"
        );

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: "Grievance not found",
      });
    }

    // --------------------------------------------------------
    // CITIZEN ACCESS
    // --------------------------------------------------------

    if (req.user.role === "CITIZEN") {
      if (
        grievance.citizen._id.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You do not have permission to view this grievance",
        });
      }
    }

    // --------------------------------------------------------
    // OFFICER ACCESS
    // --------------------------------------------------------

    const officerAccessError =
      checkOfficerDepartmentAccess(
        req,
        grievance
      );

    if (officerAccessError) {
      return res.status(
        officerAccessError.status
      ).json({
        success: false,
        message:
          officerAccessError.message,
      });
    }

    // ADMIN has access to all grievances

    res.json({
      success: true,
      grievance,
    });
  } catch (error) {
    console.error(
      "Get grievance error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching grievance",
    });
  }
};

// ============================================================
// UPDATE GRIEVANCE STATUS
// PATCH /api/grievances/:id/status
// ============================================================

export const updateGrievanceStatus =
  async (req, res) => {
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

      if (
        !status ||
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid grievance status",
        });
      }

      const grievance =
        await Grievance.findById(
          req.params.id
        );

      if (!grievance) {
        return res.status(404).json({
          success: false,
          message: "Grievance not found",
        });
      }

      // Officer can update only their department's grievances
      const officerAccessError =
        checkOfficerDepartmentAccess(
          req,
          grievance
        );

      if (officerAccessError) {
        return res.status(
          officerAccessError.status
        ).json({
          success: false,
          message:
            officerAccessError.message,
        });
      }

      grievance.status = status;

      grievance.timeline.push({
        status,
        message:
          message ||
          `Grievance status changed to ${status}`,
        actor: req.user._id,
      });

      // Store resolution information
      // when grievance is resolved.
      if (status === "RESOLVED") {
        grievance.resolution = {
          ...grievance.resolution,
          resolvedAt: new Date(),
          resolvedBy: req.user._id,
        };
      }

      await grievance.save();

      // --------------------------------------------------------
      // NOTIFY CITIZEN ABOUT STATUS CHANGE
      // --------------------------------------------------------

      let notificationType =
        "STATUS_UPDATE";

      let notificationTitle =
        "Grievance Status Updated";

      if (status === "RESOLVED") {
        notificationType =
          "GRIEVANCE_RESOLVED";

        notificationTitle =
          "Grievance Resolved";
      } else if (status === "REOPENED") {
        notificationType =
          "GRIEVANCE_REOPENED";

        notificationTitle =
          "Grievance Reopened";
      }

      await Notification.create({
        user: grievance.citizen,

        title: notificationTitle,

        message:
          message ||
          `Your grievance ${grievance.grievanceId} is now ${status.replace(
            /_/g,
            " "
          )}.`,

        type: notificationType,

        relatedGrievance:
          grievance._id,
      });

      res.json({
        success: true,
        message:
          "Grievance status updated successfully",
        grievance,
      });
    } catch (error) {
      console.error(
        "Update grievance status error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while updating grievance status",
      });
    }
  };

// ============================================================
// ASSIGN GRIEVANCE
// POST /api/grievances/:id/assign
// ============================================================

// Admin can assign grievances.

export const assignGrievance =
  async (req, res) => {
    try {
      const {
        officerId,
        departmentId,
      } = req.body;

      if (!officerId) {
        return res.status(400).json({
          success: false,
          message:
            "Officer ID is required",
        });
      }

      const grievance =
        await Grievance.findById(
          req.params.id
        );

      if (!grievance) {
        return res.status(404).json({
          success: false,
          message:
            "Grievance not found",
        });
      }

      // Verify the officer exists
      // and is actually an officer.
      const officer =
        await User.findOne({
          _id: officerId,
          role: "OFFICER",
          isActive: true,
        });

      if (!officer) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid or inactive officer",
        });
      }

      // --------------------------------------------------------
      // VERIFY DEPARTMENT CONSISTENCY
      // --------------------------------------------------------

      if (
        departmentId &&
        officer.department &&
        officer.department.toString() !==
          departmentId.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Selected officer does not belong to the selected department",
        });
      }

      grievance.assignedOfficer =
        officerId;

      // Prefer the officer's actual department.
      if (officer.department) {
        grievance.department =
          officer.department;
      } else if (departmentId) {
        grievance.department =
          departmentId;
      }

      grievance.status = "ASSIGNED";

      grievance.timeline.push({
        status: "ASSIGNED",
        message:
          "Grievance assigned to an officer",
        actor: req.user._id,
      });

      await grievance.save();

      // --------------------------------------------------------
      // NOTIFY ASSIGNED OFFICER
      // --------------------------------------------------------

      await Notification.create({
        user: officer._id,

        title:
          "New Grievance Assigned",

        message: `Grievance ${grievance.grievanceId} has been assigned to you.`,

        type:
          "GRIEVANCE_ASSIGNED",

        relatedGrievance:
          grievance._id,
      });

      // --------------------------------------------------------
      // NOTIFY CITIZEN
      // --------------------------------------------------------

      await Notification.create({
        user: grievance.citizen,

        title:
          "Grievance Assigned",

        message: `Your grievance ${grievance.grievanceId} has been assigned to a grievance officer.`,

        type:
          "GRIEVANCE_ASSIGNED",

        relatedGrievance:
          grievance._id,
      });

      const updatedGrievance =
        await Grievance.findById(
          grievance._id
        )
          .populate(
            "assignedOfficer",
            "name email role"
          )
          .populate(
            "department",
            "name code"
          );

      res.json({
        success: true,
        message:
          "Grievance assigned successfully",
        grievance:
          updatedGrievance,
      });
    } catch (error) {
      console.error(
        "Assign grievance error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while assigning grievance",
      });
    }
  };

// ============================================================
// ESCALATE GRIEVANCE
// POST /api/grievances/:id/escalate
// ============================================================

// Officer / Admin can escalate.

export const escalateGrievance =
  async (req, res) => {
    try {
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message:
            "Escalation reason is required",
        });
      }

      const grievance =
        await Grievance.findById(
          req.params.id
        );

      if (!grievance) {
        return res.status(404).json({
          success: false,
          message:
            "Grievance not found",
        });
      }

      // Officer can escalate only
      // their department's grievances.
      const officerAccessError =
        checkOfficerDepartmentAccess(
          req,
          grievance
        );

      if (officerAccessError) {
        return res.status(
          officerAccessError.status
        ).json({
          success: false,
          message:
            officerAccessError.message,
        });
      }

      grievance.sla.escalated = true;

      grievance.timeline.push({
        status: grievance.status,
        message: `Grievance escalated: ${reason}`,
        actor: req.user._id,
      });

      await grievance.save();

      // --------------------------------------------------------
      // NOTIFY CITIZEN ABOUT ESCALATION
      // --------------------------------------------------------

      await Notification.create({
        user: grievance.citizen,

        title:
          "Grievance Escalated",

        message: `Your grievance ${grievance.grievanceId} has been escalated. Reason: ${reason}`,

        type:
          "ESCALATION",

        relatedGrievance:
          grievance._id,
      });

      res.json({
        success: true,
        message:
          "Grievance escalated successfully",
        grievance,
      });
    } catch (error) {
      console.error(
        "Escalate grievance error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while escalating grievance",
      });
    }
  };

// ============================================================
// REOPEN GRIEVANCE
// POST /api/grievances/:id/reopen
// ============================================================

// Citizen can reopen their own grievance.
// Officer can reopen grievances from their department.
// Admin can reopen any grievance.

export const reopenGrievance =
  async (req, res) => {
    try {
      const { reason } = req.body;

      const grievance =
        await Grievance.findById(
          req.params.id
        );

      if (!grievance) {
        return res.status(404).json({
          success: false,
          message:
            "Grievance not found",
        });
      }

      // Citizen can reopen only their own grievance.
      if (req.user.role === "CITIZEN") {
        if (
          grievance.citizen.toString() !==
          req.user._id.toString()
        ) {
          return res.status(403).json({
            success: false,
            message:
              "You can only reopen your own grievance",
          });
        }
      }

      // Officer can reopen only
      // their department's grievances.
      const officerAccessError =
        checkOfficerDepartmentAccess(
          req,
          grievance
        );

      if (officerAccessError) {
        return res.status(
          officerAccessError.status
        ).json({
          success: false,
          message:
            officerAccessError.message,
        });
      }

      grievance.status = "REOPENED";

      grievance.timeline.push({
        status: "REOPENED",
        message:
          reason ||
          "Grievance reopened",
        actor: req.user._id,
      });

      await grievance.save();

      // --------------------------------------------------------
      // NOTIFY CITIZEN
      // --------------------------------------------------------

      await Notification.create({
        user: grievance.citizen,

        title:
          "Grievance Reopened",

        message:
          reason ||
          `Your grievance ${grievance.grievanceId} has been reopened.`,

        type:
          "GRIEVANCE_REOPENED",

        relatedGrievance:
          grievance._id,
      });

      res.json({
        success: true,
        message:
          "Grievance reopened successfully",
        grievance,
      });
    } catch (error) {
      console.error(
        "Reopen grievance error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while reopening grievance",
      });
    }
  };

// ============================================================
// SUBMIT FEEDBACK
// POST /api/grievances/:id/feedback
// ============================================================

export const submitFeedback =
  async (req, res) => {
    try {
      const {
        rating,
        comment,
      } = req.body;

      if (
        !rating ||
        rating < 1 ||
        rating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be between 1 and 5",
        });
      }

      const grievance =
        await Grievance.findById(
          req.params.id
        );

      if (!grievance) {
        return res.status(404).json({
          success: false,
          message:
            "Grievance not found",
        });
      }

      // Citizens can only review
      // their own grievances.
      if (
        grievance.citizen.toString() !==
        req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can only review your own grievance",
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
        message:
          "Feedback submitted successfully",
        feedback:
          grievance.feedback,
      });
    } catch (error) {
      console.error(
        "Feedback error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while submitting feedback",
      });
    }
  };

// ============================================================
// AI GRIEVANCE ANALYSIS PREVIEW
// POST /api/grievances/ai-analyze
// ============================================================

export const analyzeGrievancePreview =
  async (req, res) => {
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
          message:
            "Title and description are required",
        });
      }

      const aiAnalysis =
        await analyzeGrievanceWithAI({
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
      console.error(
        "AI grievance analysis error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "AI analysis failed",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : String(error),
      });
    }
  };

// ============================================================
// CHECK DUPLICATE GRIEVANCES
// POST /api/grievances/check-duplicates
// ============================================================

export const checkDuplicateGrievances =
  async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        subcategory,
        location,
      } = req.body;

      if (!title || !description) {
        return res.status(400).json({
          success: false,
          message:
            "Title and description are required",
        });
      }

      const query = {
        status: {
          $nin: [
            "REJECTED",
            "CANCELLED",
          ],
        },
      };

      if (category) {
        query.category = category;
      }

      if (subcategory) {
        query.subcategory =
          subcategory;
      }

      const existingGrievances =
        await Grievance.find(query)
          .sort({
            createdAt: -1,
          })
          .limit(20)
          .select(
            "_id title description category subcategory location"
          )
          .lean();

      const newGrievance = {
        title,
        description,
        category:
          category || "",
        subcategory:
          subcategory || "",
        location: {
          city:
            location?.city || "",
          state:
            location?.state || "",
        },
      };

      const matches =
        await findDuplicateGrievances(
          newGrievance,
          existingGrievances
        );

      const duplicateMatches =
        matches
          .filter(
            (match) =>
              match.similarity >=
                0.75 &&
              existingGrievances.some(
                (g) =>
                  g._id.toString() ===
                  match.grievanceId
              )
          )
          .map((match) => {
            const grievance =
              existingGrievances.find(
                (item) =>
                  item._id.toString() ===
                  match.grievanceId
              );

            return {
              grievance:
                match.grievanceId,

              title:
                grievance?.title ||
                "Similar grievance",

              description:
                grievance?.description ||
                "",

              category:
                grievance?.category ||
                "",

              subcategory:
                grievance?.subcategory ||
                "",

              similarity:
                match.similarity,
            };
          });

      return res.json({
        success: true,
        hasDuplicates:
          duplicateMatches.length > 0,
        duplicateMatches,
      });
    } catch (error) {
      console.error(
        "Duplicate grievance check error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to check for duplicate grievances",
      });
    }
  };