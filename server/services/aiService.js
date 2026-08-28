import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

dotenv.config({
  path: path.join(serverDirectory, ".env"),
});

// ============================================================
// GROQ CONFIGURATION
// ============================================================

const getGroqConfig = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not configured. Add it to server/.env."
    );
  }

  return {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  };
};

// ============================================================
// GROQ REQUEST HELPER
// ============================================================

const callGroq = async ({
  messages,
  temperature = 0.2,
  jsonMode = false,
}) => {
  const { apiKey, model } = getGroqConfig();

  const body = {
    model,
    messages,
    temperature,
  };

  if (jsonMode) {
    body.response_format = {
      type: "json_object",
    };
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message || "Groq API request failed."
    );
  }

  const content =
    data?.choices?.[0]?.message?.content?.trim() || "";

  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  return content;
};

// ============================================================
// JSON PARSER
// ============================================================

const parseAIJson = (content) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    // Sometimes models may still wrap JSON in ```json ... ```
    const cleaned = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      console.error("Invalid JSON returned by Groq:");
      console.error(content);

      throw new Error(
        "Groq returned an invalid AI analysis response."
      );
    }
  }
};

// ============================================================
// GRIEVANCE ANALYSIS
// ============================================================

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
You are the AI grievance analysis system for Nivara,
a citizen grievance management platform.

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
${
  Array.isArray(evidence) && evidence.length
    ? evidence
        .map((item) =>
          typeof item === "string"
            ? item
            : `${item.type || "FILE"}: ${
                item.url || "unnamed"
              }`
        )
        .join(", ")
    : "None provided"
}

Determine:

1. The most appropriate category.
2. The most appropriate subcategory.
3. The government department that should handle the grievance.
4. A priority score from 0 to 100.
5. A short reason for the priority score.
6. Your confidence from 0 to 1.
7. A concise summary of the grievance.

Important rules:

- Return ONLY valid JSON.
- Do not include markdown.
- Do not include explanations outside the JSON.
- priorityScore must be a number between 0 and 100.
- confidence must be a number between 0 and 1.
- department should be the most appropriate government department.
- Keep summary concise.

Return JSON in exactly this structure:

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

    const content = await callGroq({
      messages: [
        {
          role: "system",
          content:
            "You are Nivara's grievance classification and routing AI. Always return valid JSON when requested.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      jsonMode: true,
    });

    const analysis = parseAIJson(content);

    // --------------------------------------------------------
    // Validate / normalize AI response
    // --------------------------------------------------------

    return {
      category: String(analysis.category || ""),
      subcategory: String(analysis.subcategory || ""),
      department: String(analysis.department || ""),
      priorityScore: Math.max(
        0,
        Math.min(
          100,
          Number(analysis.priorityScore) || 0
        )
      ),
      priorityReason: String(
        analysis.priorityReason || ""
      ),
      confidence: Math.max(
        0,
        Math.min(
          1,
          Number(analysis.confidence) || 0
        )
      ),
      summary: String(analysis.summary || ""),
    };
  } catch (error) {
    console.error("========== GROQ GRIEVANCE AI ERROR ==========");
    console.error(error);
    console.error("==============================================");

    throw error;
  }
};

// ============================================================
// NIVARA SUPPORT ASSISTANT
// ============================================================

export const answerSupportQuestion = async ({
  question,
  userRole,
}) => {
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

Use plain text with short paragraphs.
Do not use markdown tables.

User role:
${userRole || "CITIZEN"}

Question:
${question}
`;

  try {
    const answer = await callGroq({
      messages: [
        {
          role: "system",
          content:
            "You are Nivara's helpful and accurate support assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      jsonMode: false,
    });

    return answer;
  } catch (error) {
    console.error("========== GROQ SUPPORT AI ERROR ==========");
    console.error(error);
    console.error("============================================");

    throw error;
  }
};