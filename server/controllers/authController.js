
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AuthorizedIdentity from "../models/AuthorizedIdentity.js";
import Department from "../models/Department.js";

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      officialId,
      department,
      designation,
      preferredLanguage,
    } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // Normalize role
    const normalizedRole = role?.toUpperCase() || "CITIZEN";

    // Validate role
    if (!["CITIZEN", "OFFICER", "ADMIN"].includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration role",
      });
    }

    // Government ID is required for Officer/Admin
    if (
      normalizedRole === "OFFICER" ||
      normalizedRole === "ADMIN"
    ) {
      if (!officialId?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Government ID is required for this role",
        });
      }
    }

    // Officer-specific validation
    if (normalizedRole === "OFFICER") {
      if (!department || !designation?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Department and designation are required for officers",
        });
      }
    }

    // Check whether email is already registered
    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Verify Government ID for Officer/Admin
    let authorizedIdentity = null;

    if (
      normalizedRole === "OFFICER" ||
      normalizedRole === "ADMIN"
    ) {
      const normalizedOfficialId = officialId.trim().toUpperCase();

      authorizedIdentity = await AuthorizedIdentity.findOne({
        officialId: normalizedOfficialId,
        role: normalizedRole,
        isActive: true,
      });

      if (!authorizedIdentity) {
        return res.status(403).json({
          success: false,
          message:
            "This Government ID is not authorized for the selected role",
        });
      }

      // Prevent the same Government ID from registering another account
      const existingOfficialIdUser = await User.findOne({
        officialId: normalizedOfficialId,
      });

      if (existingOfficialIdUser) {
        return res.status(409).json({
          success: false,
          message: "This Government ID is already registered",
        });
      }
    }

    // Resolve department for Officer
    let departmentId = null;

    if (normalizedRole === "OFFICER") {
      const departmentRecord = await Department.findOne({
        _id: department,
        isActive: true,
      });

      if (!departmentRecord) {
        return res.status(400).json({
          success: false,
          message: "Invalid or inactive department",
        });
      }

      departmentId = departmentRecord._id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      password: hashedPassword,
      role: normalizedRole,
      officialId:
        normalizedRole === "OFFICER" || normalizedRole === "ADMIN"
          ? officialId.trim().toUpperCase()
          : null,
      department: departmentId,
      designation:
        normalizedRole === "OFFICER"
          ? designation.trim()
          : null,
      preferredLanguage: preferredLanguage || "en",
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or mobile number and password are required",
      });
    }

    const normalizedIdentifier = identifier.trim();

    const user = await User.findOne({
      $or: [
        {
          email: normalizedIdentifier.toLowerCase(),
        },
        {
          phone: normalizedIdentifier,
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/mobile number or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/mobile number or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        designation: user.designation,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};