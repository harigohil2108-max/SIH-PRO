import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url)).replace(/\\services$/, "");
dotenv.config({ path: path.join(serverDirectory, ".env") });

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-4-scout-17b-16e-instruct";

export const requestGroq = async (messages, jsonMode = false) => {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error("Groq API is not configured");
    error.status = 503;
    throw error;
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error?.message || "Groq request failed");
    error.status = response.status;
    throw error;
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    const error = new Error("Groq returned an empty response");
    error.status = 502;
    throw error;
  }

  return content;
};

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

    const content = await requestGroq([{
      role: "user",
      content: [
        { type: "text", text: prompt },
        ...evidenceParts
          .filter((part) => part.inlineData.mimeType.startsWith("image/"))
          .map((part) => ({
          type: "image_url",
          image_url: { url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` },
          })),
      ],
    }], true);

    return JSON.parse(content);
  } catch (error) {
  console.error("========== GROQ ERROR ==========");
  console.error(error);
  console.error("==================================");

  throw error;
}
};

const chatFallback = "Sorry, I'm temporarily unable to respond. Please try again or check the Help & Feedback FAQs.";

export const chatWithAssistant = async ({ message, conversation = [], faqs = [] }) => {
  const faqContext = faqs
    .slice(0, 30)
    .map((faq) => `Question: ${faq.question}\nAnswer: ${faq.answer}`)
    .join("\n\n");

  const messages = [
    {
      role: "system",
      content: `You are Nivara AI Assistant, a helpful assistant for Nivara, an AI-powered public grievance management platform.

Help users with submitting grievances, tracking grievances, understanding grievance statuses and IDs, updating grievances, navigating Nivara, and using the platform.

Use the FAQ information below as your primary source for Nivara-specific answers. You may explain it naturally and use conversation context to understand follow-up questions. Do not invent government policies, laws, deadlines, department procedures, or official information. For questions outside this information, say that you do not have enough information and direct the user to Nivara support or the appropriate official channel.

FAQ INFORMATION:
${faqContext}`,
    },
    ...conversation.slice(-12).map((item) => ({
      role: item.role,
      content: item.content,
    })),
    { role: "user", content: message },
  ];

  return requestGroq(messages);
};