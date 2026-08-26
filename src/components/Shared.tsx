import { ReactNode } from "react";

export type Role = "citizen" | "officer" | "admin";

// ─── Status / Priority Badges ─────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  "In Progress":  "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  "Submitted":    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  "Resolved":     "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  "Reopened":     "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  "Escalated":    "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  "Assigned":     "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
  "AI Analyzed":  "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  "Closed":       "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  "Waiting":      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
      {status}
    </span>
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
  High:     "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
  Medium:   "bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  Low:      "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_COLORS[priority] ?? "bg-gray-100 text-gray-600"}`}>
      {priority}
    </span>
  );
}

export function AiBadge({ label = "AI-assisted" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 text-[10px] font-semibold">
      ✦ {label}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
export function KpiCard({
  label,
  value,
  trend,
  trendUp = true,
}: {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex-1 min-w-0 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
        {trend && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
export function SectionCard({ title, subtitle, extra, children, className = "" }: {
  title?: string; subtitle?: string; extra?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm ${className}`}>
      {(title || extra) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {extra}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── AI Insight Card ──────────────────────────────────────────────────────────
export function AiInsightCard({ title, text, disclaimer, actions }: {
  title: string; text: ReactNode; disclaimer?: string; actions?: ReactNode;
}) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-blue-600 dark:text-blue-400 text-base">✦</span>
        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">{title}</span>
        <AiBadge />
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{text}</p>
      {disclaimer && (
        <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-500 flex items-center gap-1">
          <span>ⓘ</span> {disclaimer}
        </p>
      )}
      {actions && <div className="mt-3 flex gap-2">{actions}</div>}
    </div>
  );
}

// ─── Buttons ──────────────────────────────────────────────────────────────────
export function PrimaryBtn({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium bg-[#0f2b4e] text-white rounded-lg hover:bg-[#1a3a5c] transition-colors flex items-center gap-1.5 ${className}`}>
      {children}
    </button>
  );
}

export function SecondaryBtn({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${className}`}>
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, className = "" }: { children: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline transition-colors ${className}`}>
      {children}
    </button>
  );
}

// ─── Chart Legend ─────────────────────────────────────────────────────────────
export function ChartLegend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="flex items-center gap-4 mb-3">
      {items.map(i => (
        <div key={i.label} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-block rounded-full" style={{ background: i.color, height: 2, width: 16 }} />
          {i.label}
        </div>
      ))}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
export function FilterChip({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-full border font-medium transition-colors ${
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-blue-400"
      }`}
    >
      {label}
    </button>
  );
}

// ─── SLA Indicator ────────────────────────────────────────────────────────────
export function SlaIndicator({ status, remaining }: { status: "ok" | "warn" | "breach"; remaining: string }) {
  const cfg = {
    ok:     { color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800", dot: "bg-green-500" },
    warn:   { color: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800", dot: "bg-amber-500" },
    breach: { color: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800", dot: "bg-red-500" },
  }[status];
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {remaining}
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
export function Timeline({ steps }: {
  steps: { label: string; desc: string; time: string; done: boolean; actor?: string }[];
}) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 border-2 ${step.done ? "bg-blue-600 border-blue-600" : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"}`} />
            {i < steps.length - 1 && (
              <div className={`w-px flex-1 my-1 ${step.done ? "bg-blue-200 dark:bg-blue-800" : "bg-slate-100 dark:bg-slate-700"}`} style={{ minHeight: 20 }} />
            )}
          </div>
          <div className="pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold ${step.done ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>{step.label}</span>
              {step.actor && <span className="text-[10px] text-slate-400 dark:text-slate-500">by {step.actor}</span>}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{step.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">{desc}</p>
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────
export function ScoreBar({ label, score, max = 30, color = "#2563eb" }: { label: string; score: number; max?: number; color?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-slate-600 dark:text-slate-400 w-36 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${(score / max) * 100}%`, background: color }} />
      </div>
      <span className="font-semibold text-slate-800 dark:text-slate-200 w-8 text-right">+{score}</span>
    </div>
  );
}
