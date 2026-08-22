import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import User from "./models/User.js";
import Department from "./models/Department.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log("Clearing existing development data...");

    await User.deleteMany({});
    await Department.deleteMany({});

    // ========================================================
    // DEPARTMENTS
    // ========================================================

    const departments = await Department.insertMany([
      {
        name: "Public Works Department",
        code: "PWD",
        description:
          "Roads, potholes, street infrastructure and public construction.",
        slaRules: {
          defaultHours: 72,
          criticalHours: 24,
        },
      },
      {
        name: "Water Supply Department",
        code: "WATER",
        description:
          "Water supply, leakage, pipelines and water-related complaints.",
        slaRules: {
          defaultHours: 48,
          criticalHours: 24,
        },
      },
      {
        name: "Sanitation Department",
        code: "SANITATION",
        description:
          "Garbage collection, sanitation and waste management.",
        slaRules: {
          defaultHours: 48,
          criticalHours: 24,
        },
      },
      {
        name: "Electricity Department",
        code: "ELECTRICITY",
        description:
          "Street lights, electricity infrastructure and power complaints.",
        slaRules: {
          defaultHours: 24,
          criticalHours: 12,
        },
      },
    ]);

    const pwd = departments.find(
      (department) => department.code === "PWD"
    );

    // ========================================================
    // PASSWORDS
    // ========================================================

    const password = await bcrypt.hash(
      "Nivara@123",
      10
    );

    // ========================================================
    // ADMIN
    // ========================================================

    const admin = await User.create({
      name: "Nivara Administrator",
      email: "admin@nivara.local",
      phone: "9000000001",
      password,
      role: "ADMIN",
      preferredLanguage: "en",
    });

    // ========================================================
    // DEPARTMENT HEAD
    // ========================================================

    const departmentHead = await User.create({
      name: "PWD Department Head",
      email: "head@nivara.local",
      phone: "9000000002",
      password,
      role: "DEPARTMENT_HEAD",
      department: pwd._id,
      designation: "Department Head",
      preferredLanguage: "en",
    });

    // ========================================================
    // OFFICER
    // ========================================================

    const officer = await User.create({
      name: "Rajesh Kumar",
      email: "officer@nivara.local",
      phone: "9000000003",
      password,
      role: "OFFICER",
      department: pwd._id,
      designation: "Grievance Officer",
      preferredLanguage: "en",
    });

    // ========================================================
    // CITIZEN
    // ========================================================

    const citizen = await User.create({
      name: "Test Citizen",
      email: "citizen@nivara.local",
      phone: "9000000004",
      password,
      role: "CITIZEN",
      preferredLanguage: "en",
      location: {
        city: "Raipur",
        district: "Raipur",
        state: "Chhattisgarh",
        pincode: "492001",
      },
    });

    console.log("");
    console.log("====================================");
    console.log("NIVARA DATABASE SEEDED SUCCESSFULLY");
    console.log("====================================");
    console.log("");
    console.log("ADMIN");
    console.log("Email: admin@nivara.local");
    console.log("Password: Nivara@123");
    console.log("");
    console.log("DEPARTMENT HEAD");
    console.log("Email: head@nivara.local");
    console.log("Password: Nivara@123");
    console.log("");
    console.log("OFFICER");
    console.log("Email: officer@nivara.local");
    console.log("Password: Nivara@123");
    console.log("");
    console.log("CITIZEN");
    console.log("Email: citizen@nivara.local");
    console.log("Password: Nivara@123");
    console.log("");
    console.log("====================================");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Database seeding failed:", error);

    await mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();