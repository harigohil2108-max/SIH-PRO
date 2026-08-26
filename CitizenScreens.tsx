import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const AI_MODEL = "gemini-3.6-flash";

export const findDuplicateGrievances = async (
  newGrievance,
  existingGrievances
) => {
  try {
    if (!existingGrievances || existingGrievances.length === 0) {
      return [];
    }

    const candidates = existingGrievances.map((g) => ({
      id: g._id.toString(),
      title: g.title || "",
      description: g.description || "",
      category: g.category || "",
      subcategory: g.subcategory || "",
      location: {
        city: g.location?.city || "",
        state: g.location?.state || "",
      },
    }));

    const prompt = `
You are a duplicate grievance detection system for Nivara.

Compare the NEW GRIEVANCE against the EXISTING GRIEVANCES.

NEW GRIEVANCE:
${JSON.stringify(newGrievance, null, 2)}

EXISTING GRIEVANCES:
${JSON.stringify(candidates, null, 2)}

For each existing grievance, determine how similar it is to the new grievance.

Consider:
- Same or very similar problem
- Same location
- Same category/subcategory
- Similar description
- Whether both complaints are actually about the same underlying issue

Return ONLY valid JSON in this exact structure:

{
  "matches": [
    {
      "grievanceId": "existing grievance id",
      "similarity": 0.0
    }
  ]
}

Rules:
- similarity must be between 0 and 1.
- Return only genuinely related grievances.
- Do not return unrelated grievances.
- A score of 0.75 or higher means the grievances are likely duplicates.
`;

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const content = response.text;

    const parsed = JSON.parse(content);

    return Array.isArray(parsed.matches) ? parsed.matches : [];
  } catch (error) {
    console.error("Duplicate grievance AI error:", error);
    throw new Error("Duplicate grievance analysis failed");
  }
};