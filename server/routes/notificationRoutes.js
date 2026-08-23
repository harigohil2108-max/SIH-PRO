import express from "express";

import authenticateUser from "../middleware/authMiddleware.js";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

// All notification routes require authentication.
router.use(authenticateUser);

// Get current user's notifications
router.get("/", getMyNotifications);

// Get current user's unread count
router.get(
  "/unread-count",
  getUnreadNotificationCount
);

// Mark one notification as read
router.patch(
  "/:id/read",
  markNotificationAsRead
);

// Mark all notifications as read
router.patch(
  "/read-all",
  markAllNotificationsAsRead
);

export default router;