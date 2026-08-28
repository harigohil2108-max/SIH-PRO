import { useEffect, useRef, useState } from "react";
import { sendChatMessage, type ChatHistoryItem } from "../screens/services/chatService";

export type HelpFaq = {
  question: string;
  answer: string;
};

type ChatMessage = {
  id: number;
  sender: "user" | "assistant";
  text: string;
  time: string;
};

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function HelpChatbot({ faqs }: { faqs: HelpFaq[] }) {
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, sender: "assistant", text: "Hello! How can I help you today?", time: formatTime() },
  ]);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || typing) return;

    setInput("");
    setMessages((current) => [
      ...current,
      { id: nextId.current++, sender: "user", text: trimmed, time: formatTime() },
    ]);
    setTyping(true);

    const conversation: ChatHistoryItem[] = messages
      .filter((message) => message.id !== 0)
      .map((message) => ({
        role: message.sender,
        content: message.text,
      }));

    try {
      const answer = await sendChatMessage(trimmed, conversation, faqs);
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          sender: "assistant",
          text: answer,
          time: formatTime(),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          sender: "assistant",
          text: "Sorry, I'm temporarily unable to respond. Please try again or check the Help & Feedback FAQs.",
          time: formatTime(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <header className="bg-[#0f2b4e] px-5 py-4 text-white">
        <h2 className="text-base font-semibold">Nivara AI Assistant</h2>
        <p className="mt-0.5 text-xs text-blue-100">Ask anything about grievances, Nivara services, and using this platform.</p>
      </header>

      <div className="h-72 space-y-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${message.sender === "user" ? "rounded-br-sm bg-blue-600 text-white" : "rounded-bl-sm border border-slate-200 bg-blue-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"}`}>
              <p className="text-sm leading-relaxed">{message.text}</p>
              <p className={`mt-1 text-[10px] ${message.sender === "user" ? "text-blue-100" : "text-slate-400"}`}>{message.time}</p>
            </div>
          </div>
        ))}

        {typing && <div className="w-fit rounded-2xl rounded-bl-sm border border-slate-200 bg-blue-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">Nivara Assistant is typing...</div>}
        <div ref={messageEndRef} />
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-700">
        <div className="mb-3 flex flex-wrap gap-2">
          {faqs.slice(0, 4).map((faq) => (
            <button key={faq.question} type="button" onClick={() => { setInput(faq.question); }} className="rounded-full border border-blue-100 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50 dark:border-slate-600 dark:text-blue-300 dark:hover:bg-slate-700">{faq.question}</button>
          ))}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="flex gap-2">
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type your question here..." className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" />
          <button type="submit" disabled={!input.trim() || typing} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">Send</button>
        </form>
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={() => setMessages([])} className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400">Clear chat</button>
        </div>
      </div>
    </section>
  );
}
