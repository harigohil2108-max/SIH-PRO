import express from "express";

import authenticateUser from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/authorizeRole.js";

import {
  getCurrentUser,
  updateProfile,
  updateLocation,
  changePassword,
  getAllUsers,
} from "../controllers/userController.js";

const router = express.Router();

/*
  Current authenticated user
*/
router.get(
  "/me",
  authenticateUser,
  getCurrentUser
);

/*
  Update editable profile information
*/
router.patch(
  "/me",
  authenticateUser,
  updateProfile
);

/*
  Update location
*/
router.patch(
  "/me/location",
  authenticateUser,
  updateLocation
);

/*
  Change password
*/
router.patch(
  "/me/password",
  authenticateUser,
  changePassword
);

/*
  Admin test route
*/
router.get(
  "/admin-test",
  authenticateUser,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message:
        "Welcome Admin. You have access to this resource.",
    });
  }
);

/*
  Admin - Get all users
*/
router.get(
  "/admin/all",
  authenticateUser,
  authorizeRoles("ADMIN"),
  getAllUsers
);

export default router;