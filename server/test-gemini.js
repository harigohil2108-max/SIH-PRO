import "dotenv/config";
import { analyzeGrievance } from "./services/aiService.js";

const result = await analyzeGrievance({
  title: "Large pothole on main road",
  description:
    "There is a large pothole near the main gate of Sector 7. It has already caused accidents and is dangerous for vehicles and pedestrians.",
  category: "Roads",
  subcategory: "Pothole",
  location: {
    address: "Main Gate Road, Sector 7",
    city: "Raipur",
    state: "Chhattisgarh",
  },
});

console.log(JSON.stringify(result, null, 2));