import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Nivara server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Unable to start Nivara server:", error.message);
    process.exit(1);
  });
