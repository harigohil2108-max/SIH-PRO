import bcrypt from "bcryptjs";
import User from "../models/User.js";

/*
  Get current user profile
*/
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("department", "name code description");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading profile",
    });
  }
};

/*
  Update editable profile information
*/
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      preferredLanguage,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Name
    if (name !== undefined) {
      const trimmedName = String(name).trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = trimmedName;
    }

    // Phone
    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    // Preferred language
    if (preferredLanguage !== undefined) {
      user.preferredLanguage = String(
        preferredLanguage
      ).trim() || "en";
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("department", "name code description");

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};

/*
  Update location
*/
export const updateLocation = async (req, res) => {
  try {
    const {
      city,
      district,
      state,
      pincode,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.location = {
      city: city?.trim() || "",
      district: district?.trim() || "",
      state: state?.trim() || "",
      pincode: pincode?.trim() || "",
    };

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .populate("department", "name code description");

    return res.json({
      success: true,
      message: "Location updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update location error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating location",
    });
  }
};

/*
  Change password
*/
export const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from the current password",
      });
    }

    user.password = await bcrypt.hash(
      newPassword,
      10
    );

    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Server error while changing password",
    });
  }
};

/*
  Admin - Get all users
*/
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("department", "name code");

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while loading users",
    });
  }
};