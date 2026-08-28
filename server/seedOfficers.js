import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import User from "./models/User.js";
import Department from "./models/Department.js";

dotenv.config();

const officers = [
  {
    name: "Rajesh Kumar",
    email: "rajesh.pwd@nivara.local",
    phone: "9000000101",
    officialId: "NIV-PWD-01",
    departmentCode: "PWD",
    designation: "Senior Grievance Officer",
  },
  {
    name: "Anita Sharma",
    email: "anita.pwd@nivara.local",
    phone: "9000000102",
    officialId: "NIV-PWD-02",
    departmentCode: "PWD",
    designation: "Grievance Officer",
  },

  {
    name: "Vikram Singh",
    email: "vikram.water@nivara.local",
    phone: "9000000111",
    officialId: "NIV-WATER-01",
    departmentCode: "WATER",
    designation: "Senior Grievance Officer",
  },
  {
    name: "Priya Verma",
    email: "priya.water@nivara.local",
    phone: "9000000112",
    officialId: "NIV-WATER-02",
    departmentCode: "WATER",
    designation: "Grievance Officer",
  },

  {
    name: "Arjun Mehta",
    email: "arjun.sanitation@nivara.local",
    phone: "9000000121",
    officialId: "NIV-SANITATION-01",
    departmentCode: "SANITATION",
    designation: "Senior Grievance Officer",
  },
  {
    name: "Neha Gupta",
    email: "neha.sanitation@nivara.local",
    phone: "9000000122",
    officialId: "NIV-SANITATION-02",
    departmentCode: "SANITATION",
    designation: "Grievance Officer",
  },

  {
    name: "Suresh Patel",
    email: "suresh.electricity@nivara.local",
    phone: "9000000131",
    officialId: "NIV-ELECTRICITY-01",
    departmentCode: "ELECTRICITY",
    designation: "Senior Grievance Officer",
  },
  {
    name: "Meera Joshi",
    email: "meera.electricity@nivara.local",
    phone: "9000000132",
    officialId: "NIV-ELECTRICITY-02",
    departmentCode: "ELECTRICITY",
    designation: "Grievance Officer",
  },
];

const seedOfficers = async () => {
  try {
    await connectDB();

    console.log("Creating Nivara officer accounts...\n");

    const password = await bcrypt.hash("Nivara@123", 10);

    let created = 0;
    let skipped = 0;

    for (const officer of officers) {
      const department = await Department.findOne({
        code: officer.departmentCode,
        isActive: true,
      });

      if (!department) {
        console.log(
          `❌ Department not found: ${officer.departmentCode}`
        );
        continue;
      }

      const existingOfficer = await User.findOne({
        $or: [
          { email: officer.email },
          { officialId: officer.officialId },
        ],
      });

      if (existingOfficer) {
        console.log(
          `⚠️ Already exists: ${officer.email}`
        );
        skipped++;
        continue;
      }

      await User.create({
        name: officer.name,
        email: officer.email,
        phone: officer.phone,
        password,
        role: "OFFICER",
        officialId: officer.officialId,
        department: department._id,
        designation: officer.designation,
        preferredLanguage: "en",
        isActive: true,
      });

      console.log(
        `✅ ${officer.name} → ${department.name}`
      );

      created++;
    }

    console.log("\n================================");
    console.log("NIVARA OFFICER SEED COMPLETE");
    console.log("================================");
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);

    console.log("\nLogin password for all officers:");
    console.log("Nivara@123");

    console.log("\nOfficer accounts:");

    officers.forEach((officer) => {
      console.log(
        `${officer.email} | ${officer.officialId}`
      );
    });

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error(
      "\n❌ Officer seeding failed:",
      error.message
    );

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedOfficers();