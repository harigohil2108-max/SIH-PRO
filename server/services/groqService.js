import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url)).replace(/\\services$/, "");
dotenv.config({ path: path.join(serverDirectory, ".env"), override: true });

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const isTemporaryAIError = (error) => {
  const status = error?.status || error?.cause?.status;
  const code = error?.cause?.code;
  return status === 429 || status >= 500 || code === "UND_ERR_HEADERS_TIMEOUT";
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const extractJsonObject = (content) => {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end <= start) {
    throw new Error("Groq returned a response without valid JSON");
  }

  return content.slice(start, end + 1);
};

export const generateAIContent = async (prompt) => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const responseBody = await response.text();
        let providerMessage = "";

        try {
          providerMessage = JSON.parse(responseBody).error?.message || "";
        } catch {
          providerMessage = responseBody.trim();
        }

        const defaultMessage =
          response.status === 400
            ? "Groq rejected the request. Check the selected model and prompt."
            : response.status === 401 || response.status === 403
              ? "Groq authentication failed. Set GROQ_API_KEY to a valid Groq API key."
              : response.status === 429
                ? "Groq is temporarily rate-limited. Please try again shortly."
                : response.status >= 500
                  ? "Groq is temporarily unavailable. Please try again shortly."
                  : `Groq request failed with status ${response.status}`;
        const error = new Error(
          providerMessage ? `${defaultMessage} Details: ${providerMessage}` : defaultMessage
        );
        error.status = response.status;
        error.retryAfter = Number(response.headers.get("retry-after")) || 0;
        throw error;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      return extractJsonObject(content);
    } catch (error) {
      if (!isTemporaryAIError(error) || attempt === 3) throw error;
      const retryAfter = error.retryAfter > 0 ? error.retryAfter * 1000 : attempt * 2000;
      await wait(retryAfter);
    }
  }
};
