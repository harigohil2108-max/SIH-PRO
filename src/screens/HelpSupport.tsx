import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: number;
  sender: "assistant" | "user";
  text: string;
  time: string;
};

const suggestions = [
  "How do I submit a grievance?",
  "How can I track my grievance?",
  "How do I update my grievance?",
  "How can I contact support?",
];

const answers: Record<string, string> = {
  "How do I submit a grievance?": "Open Submit Grievance from the sidebar, describe the issue, add the location and evidence, review the details, and submit it.",
  "How can I track my grievance?": "Open My Grievances from the sidebar to see the current status, priority, assigned department, and activity timeline.",
  "How do I update my grievance?": "Open the grievance from My Grievances and use the communication or resolution actions available for its current status.",
  "How can I contact support?": "You can use this assistant for common questions. For account-specific help, include your grievance ID and contact the responsible department.",
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getFallbackReply(question: string) {
  const normalized = question.toLowerCase();
  if (normalized.includes("submit")) return answers[suggestions[0]];
  if (normalized.includes("track")) return answers[suggestions[1]];
  if (normalized.includes("update")) return answers[suggestions[2]];
  if (normalized.includes("contact") || normalized.includes("support")) return answers[suggestions[3]];
  return "I can help with submitting, tracking, and updating grievances. You can also ask how to contact support or choose one of the suggestions below.";
}

export default function HelpSupport() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: "assistant",
      text: "Hello! I am here to help you with grievances, Nivara services, and using this platform.",
      time: getTime(),
    },
  ]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = messageListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const sendQuestion = async (value = question) => {
    const text = value.trim();
    if (!text || sending) return;

    setSending(true);
    setQuestion("");
    const now = Date.now();
    setMessages((current) => [
      ...current,
      { id: now, sender: "user", text, time: getTime() },
    ]);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in again to use Help & Support.");

      const response = await fetch(`${API_URL}/support/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Support assistant is unavailable.");

      setMessages((current) => [
        ...current,
        { id: now + 1, sender: "assistant", text: data.answer, time: getTime() },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: now + 1,
          sender: "assistant",
          text: error instanceof Error && error.message.includes("log in")
            ? error.message
            : getFallbackReply(text),
          time: getTime(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-[800px] space-y-5 p-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Help &amp; Feedback</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Find answers about using the Nivara grievance platform.</p>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="bg-blue-900 px-5 py-4 dark:bg-blue-950">
          <h2 className="text-base font-semibold text-white">Nivara AI Assistant</h2>
          <p className="mt-1 text-xs text-blue-100">Ask anything about grievances, Nivara services, and using this platform.</p>
        </div>

        <div ref={messageListRef} className="h-[270px] space-y-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${message.sender === "user" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
                <p>{message.text}</p>
                <p className={`mt-1 text-[10px] ${message.sender === "user" ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>{message.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex gap-2 overflow-x-auto pb-3">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => sendQuestion(suggestion)} className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-xs text-blue-700 transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-600 dark:text-blue-300 dark:hover:bg-slate-700">
                {suggestion}
              </button>
            ))}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); sendQuestion(); }} className="flex gap-2">
            <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Type your question here..." className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500" />
            <button type="submit" disabled={sending || !question.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{sending ? "..." : "Send"}</button>
          </form>
          <button type="button" onClick={() => setMessages([])} className="mt-2 text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400">Clear chat</button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Browse common questions about grievances and your account.</p>
        <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-700">
          {suggestions.map((item) => (
            <button key={item} type="button" onClick={() => sendQuestion(item)} className="flex w-full items-center justify-between py-3 text-left text-sm text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
              <span>{item}</span><span aria-hidden="true">+</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
