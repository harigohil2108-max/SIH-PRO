import { answerSupportQuestion } from "../services/aiService.js";

export const chatWithSupport = async (req, res) => {
  const question = typeof req.body?.question === "string"
    ? req.body.question.trim()
    : "";

  if (!question) {
    return res.status(400).json({
      success: false,
      message: "Please enter a question.",
    });
  }

  if (question.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Please keep your question under 1000 characters.",
    });
  }

  try {
    const answer = await answerSupportQuestion({
      question,
      userRole: req.user.role,
    });

    return res.json({ success: true, answer });
  } catch (error) {
    console.error("Support chat error:", error.message);

    return res.status(503).json({
      success: false,
      message: "The AI assistant is temporarily unavailable. Please try again shortly.",
    });
  }
};
