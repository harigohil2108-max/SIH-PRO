import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url)).replace(/\\services$/, "");
dotenv.config({ path: path.join(serverDirectory, ".env") });

const getAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured. Add it to server/.env or update the AI provider configuration.");
  }

  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const AI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const isTemporaryAIError = (error) => {
  const status = error?.status || error?.cause?.status;
  const code = error?.cause?.code;
  return status === 429 || status >= 500 || code === "UND_ERR_HEADERS_TIMEOUT";
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

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

    const response = await getAI().models.generateContent({
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

export const answerSupportQuestion = async ({ question, userRole }) => {
  const prompt = `
You are Nivara's Help & Support assistant for a citizen grievance management website.
Answer the user's question clearly and concisely.

You can explain only Nivara website features and workflows, including:
- registering and logging in
- submitting, tracking, updating, reopening, and reviewing grievances
- locations, evidence, notifications, profiles, settings, language, themes, and passwords
- citizen, officer, and administrator dashboard responsibilities
- contacting support and general grievance process guidance

If the question is unrelated to Nivara or asks for private account data, say that you can only help with the Nivara platform and direct the user to the relevant page or official support.
Never invent a grievance status, user data, department decision, phone number, or policy.
Use plain text with short paragraphs. Do not use markdown tables.

User role: ${userRole || "CITIZEN"}
Question: ${question}
`;

  let answer = "";

  if (process.env.GROQ_API_KEY) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Groq support request failed.");
    answer = data.choices?.[0]?.message?.content?.trim() || "";
  } else {
    const response = await getAI().models.generateContent({
      model: AI_MODEL,
      contents: prompt,
    });
    answer = response.text?.trim() || "";
  }

  if (!answer) throw new Error("The AI assistant returned an empty answer.");
  return answer;
};