import Notification from "../models/Notification.js";

// ============================================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// ============================================================

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    })
      .populate(
        "relatedGrievance",
        "grievanceId title status"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching notifications",
    });
  }
};

// ============================================================
// GET UNREAD NOTIFICATION COUNT
// GET /api/notifications/unread-count
// ============================================================

export const getUnreadNotificationCount = async (
  req,
  res
) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      read: false,
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error(
      "Get unread notification count error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while fetching unread notification count",
    });
  }
};

// ============================================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// ============================================================

export const markNotificationAsRead = async (
  req,
  res
) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.read = true;

    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error(
      "Mark notification as read error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while updating notification",
    });
  }
};

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// ============================================================

export const markAllNotificationsAsRead = async (
  req,
  res
) => {
  try {
    await Notification.updateMany(
      {
        user: req.user._id,
        read: false,
      },
      {
        $set: {
          read: true,
        },
      }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error(
      "Mark all notifications as read error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Server error while updating notifications",
    });
  }
};