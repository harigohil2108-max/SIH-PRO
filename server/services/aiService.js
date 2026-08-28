import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url)).replace(/\\services$/, "");
dotenv.config({ path: path.join(serverDirectory, ".env") });

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const AI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
  ? evidence.map((item) => {
    const value = typeof item === "string" ? item : item.url;
    return `${typeof item === "object" ? item.type || "FILE" : "FILE"}: ${typeof value === "string" && value.startsWith("data:") ? "attached file" : value || "unnamed"}`;
  }).join(", ")
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

    const evidenceParts = Array.isArray(evidence)
      ? evidence.flatMap((item) => {
        const dataUrl = typeof item === "object" ? item.url : item;
        const match = typeof dataUrl === "string"
          ? dataUrl.match(/^data:([^;]+);base64,(.+)$/)
          : null;

        return match
          ? [{ inlineData: { mimeType: match[1], data: match[2] } }]
          : [];
      })
      : [];

    const response = await ai.models.generateContent({
  model: AI_MODEL,
  contents: [{
    role: "user",
    parts: [
      { text: prompt },
      ...evidenceParts,
    ],
  }],
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

const chatFallback = "Sorry, I'm temporarily unable to respond. Please try again or check the Help & Feedback FAQs.";

export const chatWithAssistant = async ({ message, conversation = [], faqs = [] }) => {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("Gemini API is not configured");
    error.status = 503;
    throw error;
  }

  const faqContext = faqs
    .slice(0, 30)
    .map((faq) => `Question: ${faq.question}\nAnswer: ${faq.answer}`)
    .join("\n\n");

  const contents = [
    ...conversation.slice(-12).map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const response = await ai.models.generateContent({
    model: AI_MODEL,
    contents,
    config: {
      systemInstruction: `You are Nivara AI Assistant, a helpful assistant for Nivara, an AI-powered public grievance management platform.

Help users with submitting grievances, tracking grievances, understanding grievance statuses and IDs, updating grievances, navigating Nivara, and using the platform.

Use the FAQ information below as your primary source for Nivara-specific answers. You may explain it naturally and use conversation context to understand follow-up questions. Do not invent government policies, laws, deadlines, department procedures, or official information. For questions outside this information, say that you do not have enough information and direct the user to Nivara support or the appropriate official channel.

FAQ INFORMATION:
${faqContext}`,
    },
  });

  const reply = response.text?.trim();

  if (!reply) {
    const error = new Error("Gemini returned an empty response");
    error.status = 502;
    throw error;
  }

  return reply;
};