import { PageHeader, SectionCard } from "../components/Shared";
import HelpChatbot, { type HelpFaq } from "../components/HelpChatbot";

export const faqs: HelpFaq[] = [
  {
    question: "How do I submit a grievance?",
    answer: "Open Submit Grievance from the sidebar, describe your issue, add the location and evidence, review the details, and submit it.",
  },
  {
    question: "How can I track my grievance?",
    answer: "Open My Grievances from the sidebar to view your submitted grievances, tracking IDs, current status, and activity timeline.",
  },
  {
    question: "How do I update my grievance?",
    answer: "Open the grievance from My Grievances and use the available action on its detail page. Some submitted details may not be editable after processing begins.",
  },
  {
    question: "How can I contact support?",
    answer: "Please review the FAQs and use the Nivara Assistant for guidance. For issues not covered here, contact your Nivara support team.",
  },
  {
    question: "What information should I include in a grievance?",
    answer: "Include a clear description of the issue, its location, and any useful photos, videos, or documents. More detail helps the concerned department review it.",
  },
  {
    question: "How do I change my password?",
    answer: "Open Settings, choose Change Password, enter your current password, enter a new password, confirm it, and select Update Password.",
  },
];

export default function HelpSupport() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader title="Help & Feedback" subtitle="Find answers about using the Nivara grievance platform." />
      <HelpChatbot faqs={faqs} />
      <SectionCard title="Frequently Asked Questions" subtitle="Browse common questions about grievances and your account.">
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {faqs.map((faq) => (
            <details key={faq.question} className="group py-4 first:pt-0 last:pb-0">
              <summary className="cursor-pointer list-none pr-6 text-sm font-semibold text-slate-800 marker:hidden dark:text-slate-100">{faq.question}<span className="float-right text-blue-600 transition-transform group-open:rotate-45">+</span></summary>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">{faq.answer}</p>
            </details>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Share Feedback" subtitle="Your feedback helps us improve the grievance experience.">
        <p className="text-sm text-slate-600 dark:text-slate-400">Use the assistant for quick answers, or contact Nivara support when your question is not covered by the information above.</p>
      </SectionCard>
    </div>
  );
}
