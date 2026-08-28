import type { HelpFaq } from "../../components/HelpChatbot";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

export async function sendChatMessage(
  message: string,
  conversation: ChatHistoryItem[],
  faqs: HelpFaq[]
) {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversation, faqs }),
  });

  let data: { reply?: string; message?: string } = {};
  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response from chat service");
  }

  if (!response.ok || typeof data.reply !== "string" || !data.reply.trim()) {
    throw new Error(data.message || "Chat service is unavailable");
  }

  return data.reply.trim();
}
