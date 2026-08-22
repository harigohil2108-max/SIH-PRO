import express from "express";
import authenticateUser from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/authorizeRole.js";

const router = express.Router();

router.get("/me", authenticateUser, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

router.get(
  "/admin-test",
  authenticateUser,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Admin. You have access to this resource.",
    });
  }
);

export default router;