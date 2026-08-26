import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateAIContent } from "./groqService.js";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url)).replace(/\\services$/, "");
dotenv.config({ path: path.join(serverDirectory, ".env") });

export const analyzeGrievance = async ({
  title,
  description,
  category,
  subcategory,
  location,
  evidence,
}) => {
  try {
    const prompt = `
You are the AI grievance analysis system for Nivara, a citizen grievance management platform.

Analyze the following citizen grievance.

TITLE:
${title || ""}

DESCRIPTION:
${description || ""}

CITIZEN CATEGORY:
${category || "Not provided"}

CITIZEN SUBCATEGORY:
${subcategory || "Not provided"}

LOCATION:
${location?.address || ""}
${location?.city || ""}
${location?.state || ""}

ATTACHED EVIDENCE:
${Array.isArray(evidence) && evidence.length
  ? evidence.map((item) => typeof item === "string" ? item : `${item.type || "FILE"}: ${item.url || "unnamed"}`).join(", ")
  : "None provided"}

Determine:

1. The most appropriate category.
2. The most appropriate subcategory.
3. The government department that should handle the grievance.
4. A priority score from 0 to 100.
5. A short reason for the priority score.
6. Your confidence from 0 to 1.
7. A concise summary of the grievance.

Return ONLY valid JSON in this exact structure:

{
  "category": "string",
  "subcategory": "string",
  "department": "string",
  "priorityScore": 0,
  "priorityReason": "string",
  "confidence": 0,
  "summary": "string"
}
`;

    const content = await generateAIContent(prompt);

    return JSON.parse(content);
  } catch (error) {
  console.error("========== GROQ ERROR ==========");
  console.error(error);
  console.error("==================================");

  throw error;
}
};