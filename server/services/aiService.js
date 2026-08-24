import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const AI_MODEL = "gemini-3.5-flash";

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

    const response = await ai.models.generateContent({
  model: AI_MODEL,
  contents: prompt,
  config: {
    responseMimeType: "application/json",
  },
});

const content = response.text;

return JSON.parse(content);
  } catch (error) {
  console.error("========== GEMINI ERROR ==========");
  console.error(error);
  console.error("==================================");

  throw error;
}
};