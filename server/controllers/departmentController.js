import Department from "../models/Department.js";

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({
      isActive: true,
    }).select("_id name code description");

    return res.json({
      success: true,
      departments,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while fetching departments",
    });
  }
};