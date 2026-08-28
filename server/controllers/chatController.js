import { chatWithAssistant } from "../services/aiService.js";

const fallback = "Sorry, I'm temporarily unable to respond. Please try again or check the Help & Feedback FAQs.";

export const chat = async (req, res) => {
  const { message, conversation, faqs } = req.body || {};

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, message: "A message is required" });
  }

  if (message.length > 2000) {
    return res.status(400).json({ success: false, message: "Message is too long" });
  }

  const safeConversation = Array.isArray(conversation)
    ? conversation
        .filter((item) => ["user", "assistant"].includes(item?.role) && typeof item?.content === "string")
        .slice(-12)
        .map((item) => ({ role: item.role, content: item.content.slice(0, 2000) }))
    : [];

  const safeFaqs = Array.isArray(faqs)
    ? faqs
        .filter((faq) => typeof faq?.question === "string" && typeof faq?.answer === "string")
        .slice(0, 30)
        .map((faq) => ({ question: faq.question.slice(0, 300), answer: faq.answer.slice(0, 1500) }))
    : [];

  try {
    const reply = await chatWithAssistant({
      message: message.trim(),
      conversation: safeConversation,
      faqs: safeFaqs,
    });

    return res.json({ success: true, reply });
  } catch (error) {
    const status = error?.status === 429 ? 429 : 502;
    console.error("Nivara chat request failed:", error?.status || error?.message || "unknown error");

    return res.status(status).json({ success: false, message: fallback });
  }
};