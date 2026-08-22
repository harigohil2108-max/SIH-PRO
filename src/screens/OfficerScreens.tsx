import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  KpiCard, SectionCard, AiInsightCard, PageHeader, PrimaryBtn, SecondaryBtn, GhostBtn,
  StatusBadge, PriorityBadge, Timeline, ChartLegend, FilterChip, SlaIndicator, ScoreBar, AiBadge,
} from "../components/Shared";
import MapSvg from "../components/MapSvg";

const trendData = [
  { month: "Jan", submitted: 38, resolved: 22 }, { month: "Feb", submitted: 45, resolved: 28 },
  { month: "Mar", submitted: 52, resolved: 38 }, { month: "Apr", submitted: 41, resolved: 30 },
  { month: "May", submitted: 60, resolved: 42 }, { month: "Jun", submitted: 70, resolved: 50 },
  { month: "Jul", submitted: 85, resolved: 55 }, { month: "Aug", submitted: 75, resolved: 58 },
  { month: "Sep", submitted: 80, resolved: 60 }, { month: "Oct", submitted: 95, resolved: 65 },
  { month: "Nov", submitted: 110, resolved: 72 }, { month: "Dec", submitted: 120, resolved: 80 },
];

const slaData = [
  { name: "Within SLA", value: 86, color: "#16a34a" },
  { name: "Near SLA", value: 22, color: "#d97706" },
  { name: "Breached", value: 12, color: "#dc2626" },
];

const queue = [
  { id: "NV-1084", cat: "Water Supply", priority: "Critical", score: 94, sla: "2 hrs left", slaStatus: "warn" as const, status: "Escalated", date: "Today, 8 AM" },
  { id: "NV-1079", cat: "Electricity", priority: "Critical", score: 91, sla: "4 hrs left", slaStatus: "warn" as const, status: "Assigned", date: "Today, 11 AM" },
  { id: "NV-1072", cat: "Sanitation", priority: "High", score: 84, sla: "12 hrs left", slaStatus: "ok" as const, status: "In Progress", date: "Yesterday" },
  { id: "NV-1065", cat: "Roads", priority: "High", score: 76, sla: "1 day left", slaStatus: "ok" as const, status: "Assigned", date: "Aug 19" },
  { id: "NV-1058", cat: "Street Lighting", priority: "Medium", score: 63, sla: "2 days left", slaStatus: "ok" as const, status: "In Progress", date: "Aug 18" },
  { id: "NV-1044", cat: "Roads", priority: "Medium", score: 58, sla: "Breached", slaStatus: "breach" as const, status: "Escalated", date: "Aug 15" },
];

// ─── Officer Dashboard ────────────────────────────────────────────────────────
export function OfficerDashboard({ navigate }: { navigate: (screen: string) => void }) {
  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Welcome back, Rajesh" subtitle="Officer Workspace • Real-time Civic SLA Monitoring">
        <SecondaryBtn onClick={() => navigate("my-assignments")}>My Assignments</SecondaryBtn>
        <PrimaryBtn onClick={() => navigate("priority-queue")}><span>+</span> View Priority Queue</PrimaryBtn>
      </PageHeader>

      <div className="flex gap-3 overflow-x-auto pb-1">
        <KpiCard label="Assigned to Me" value="12" trend="+8.3%" trendUp={true} />
        <KpiCard label="High Priority" value="5" trend="+15.2%" trendUp={true} />
        <KpiCard label="Due Today" value="3" trend="-12.5%" trendUp={false} />
        <KpiCard label="Resolved This Week" value="18" trend="+22.1%" trendUp={true} />
        <KpiCard label="SLA Compliance" value="94.2%" trend="+3.1%" trendUp={true} />
        <KpiCard label="Avg Response Time" value="2.1 hrs" trend="-8.7%" trendUp={false} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <SectionCard
            title="AI Priority Queue"
            subtitle="AI-ranked grievances by urgency, SLA and impact"
            extra={<GhostBtn onClick={() => navigate("priority-queue")}>View all →</GhostBtn>}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  {["ID", "Category", "Priority", "AI Score", "SLA", "Status", "Assigned", "Action"].map(h => (
                    <th key={h} className="text-left font-medium pb-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {queue.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate("grievance-detail")}>
                    <td className="py-2.5 pr-3 font-mono text-xs text-blue-600 font-semibold">{r.id}</td>
                    <td className="py-2.5 pr-3 text-slate-700 text-xs">{r.cat}</td>
                    <td className="py-2.5 pr-3"><PriorityBadge priority={r.priority} /></td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: r.score > 85 ? "#ef4444" : r.score > 70 ? "#f59e0b" : "#3b82f6" }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{r.score}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3"><SlaIndicator status={r.slaStatus} remaining={r.sla} /></td>
                    <td className="py-2.5 pr-3"><StatusBadge status={r.status} /></td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500 dark:text-slate-500">{r.date}</td>
                    <td className="py-2.5"><button className="text-slate-400 hover:text-slate-700 dark:text-slate-300">···</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          <SectionCard title="Grievance Trends" subtitle="Monthly assigned vs resolved volume">
            <ChartLegend items={[{ color: "#2563eb", label: "Assigned" }, { color: "#16a34a", label: "Resolved" }]} />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="submitted" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resolved" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="SLA Compliance Status">
            <div className="relative flex justify-center mb-4">
              <PieChart width={160} height={160}>
                <Pie data={slaData} innerRadius={45} outerRadius={72} dataKey="value" stroke="none">
                  {slaData.map(e => <Cell key={e.name} fill={e.color} />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">120</span>
                <span className="text-xs text-slate-500 dark:text-slate-500">Assigned</span>
              </div>
            </div>
            <div className="space-y-2">
              {slaData.map(s => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500">{s.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{s.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <AiInsightCard
            title="AI-Assisted Dispatch Insight"
            text={<>Detecting pattern: <strong>3 high-priority water logging reports</strong> share similar coordinates in Sector 7. Coordinated inspection recommended.</>}
            disclaimer="AI Insight helper • Verify field conditions before action"
            actions={<>
              <button className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800">Accept</button>
              <button className="text-xs border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50">Override</button>
            </>}
          />

          <SectionCard title="Recent Activity Timeline">
            <Timeline steps={[
              { label: "New Assignment", desc: "NV-1084 assigned – Water Supply", time: "9:30 AM", done: true },
              { label: "Priority Updated", desc: "NV-1079 escalated to Critical", time: "10:15 AM", done: true },
              { label: "Citizen Responded", desc: "NV-1065 has new citizen message", time: "11:00 AM", done: true },
              { label: "Resolution Submitted", desc: "NV-1050 resolved successfully", time: "12:45 PM", done: true },
              { label: "SLA Warning", desc: "NV-1072 approaching SLA breach", time: "2:00 PM", done: false },
            ]} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─── Priority Queue ───────────────────────────────────────────────────────────
export function PriorityQueue({ navigate }: { navigate: (screen: string) => void }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Critical", "High", "Medium", "Low"];

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="AI Priority Queue" subtitle="Grievances ranked by AI urgency score, SLA proximity and impact">
        <PrimaryBtn onClick={() => navigate("geo-intelligence")}>🗺 View on Map</PrimaryBtn>
      </PageHeader>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 font-medium">Filter by priority:</span>
        {filters.map(f => <FilterChip key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />)}
        <div className="flex gap-2 ml-auto">
          {["Category", "Location", "SLA", "Status", "AI Confidence"].map(f => (
            <button key={f} className="px-3 py-1 text-xs border border-slate-200 rounded-full text-slate-600 hover:border-blue-400 bg-white flex items-center gap-1">
              {f} ∨
            </button>
          ))}
        </div>
      </div>

      <SectionCard>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
              {["Grievance ID", "Complaint", "Category", "Priority", "AI Score", "SLA Deadline", "Status", "Assigned", "Action"].map(h => (
                <th key={h} className="text-left font-medium pb-3 pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {queue.filter(r => activeFilter === "All" || r.priority === activeFilter).map(r => (
              <tr key={r.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate("grievance-detail")}>
                <td className="py-3 pr-3 font-mono text-xs text-blue-600 font-semibold">{r.id}</td>
                <td className="py-3 pr-3 text-slate-700 text-xs max-w-36 truncate">{r.cat} — issue report</td>
                <td className="py-3 pr-3 text-slate-600 text-xs">{r.cat}</td>
                <td className="py-3 pr-3"><PriorityBadge priority={r.priority} /></td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: r.score > 85 ? "#ef4444" : r.score > 70 ? "#f59e0b" : "#3b82f6" }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: r.score > 85 ? "#ef4444" : r.score > 70 ? "#f59e0b" : "#3b82f6" }}>{r.score}</span>
                  </div>
                </td>
                <td className="py-3 pr-3"><SlaIndicator status={r.slaStatus} remaining={r.sla} /></td>
                <td className="py-3 pr-3"><StatusBadge status={r.status} /></td>
                <td className="py-3 pr-3 text-xs text-slate-500 dark:text-slate-500">{r.date}</td>
                <td className="py-3">
                  <div className="flex gap-1">
                    <button className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50">View</button>
                    <button className="text-slate-400 hover:text-slate-700 text-sm">···</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

// ─── Grievance Detail (Officer) ───────────────────────────────────────────────
export function OfficerGrievanceDetail({ navigate }: { navigate: (screen: string) => void }) {
  const [tab, setTab] = useState<"overview" | "ai" | "communication" | "resolution">("overview");
  const [humanPriority, setHumanPriority] = useState("Critical");
  const [overrideReason, setOverrideReason] = useState("");

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate("priority-queue")} className="mt-1 text-slate-400 hover:text-slate-700 text-sm">← Back</button>
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">NV-1084 — Water Supply Failure</h1>
              <StatusBadge status="Escalated" />
              <PriorityBadge priority="Critical" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-500">Water Supply • Zone 4 • Reported Aug 19, 8:00 AM</span>
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded px-2 py-0.5">
                <span className="text-xs font-bold text-red-700">AI Score: 91/100</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <SecondaryBtn>Transfer</SecondaryBtn>
          <PrimaryBtn>Resolve</PrimaryBtn>
        </div>
      </div>

      <div className="flex gap-0 bg-slate-100 rounded-lg p-1 w-fit">
        {(["overview", "ai", "communication", "resolution"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-300"}`}>
            {t === "ai" ? "AI Intelligence" : t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            {/* AI Summary */}
            <AiInsightCard
              title="AI-Generated Complaint Summary"
              text="Major water supply failure in Zone 4 affecting approximately 450 households. Reported for 18 hours. 3 similar complaints in adjacent zones. Coordinated infrastructure inspection recommended."
              disclaimer="AI-generated summary • Verify before taking official action"
            />

            {/* Location */}
            <SectionCard title="Complaint Location" subtitle="Sector 7 Market Area — Lat: 21.2514, Lon: 81.6296">
              <MapSvg mode="markers" height={240} showLocationPicker={true} />
            </SectionCard>

            {/* Timeline */}
            <SectionCard title="Case Timeline">
              <Timeline steps={[
                { label: "Submitted", desc: "Water supply failure reported by 3 citizens", time: "Aug 19, 08:00 AM", done: true, actor: "Citizen" },
                { label: "AI Analyzed", desc: "Priority Score 91 — Water Supply > Failure", time: "Aug 19, 08:01 AM", done: true, actor: "Nivara AI" },
                { label: "Auto-Escalated", desc: "Critical priority — auto-escalated by system", time: "Aug 19, 08:01 AM", done: true, actor: "System" },
                { label: "Assigned", desc: "Assigned to Officer Rajesh Kumar", time: "Aug 19, 08:15 AM", done: true, actor: "Dispatch" },
                { label: "Field Inspection", desc: "Scheduled for today, 2:00 PM", time: "Scheduled", done: false },
                { label: "Resolution", desc: "Pending field report", time: "Pending", done: false },
              ]} />
            </SectionCard>
          </div>

          <div className="space-y-4">
            {/* SLA */}
            <SectionCard title="SLA Status">
              <div className="space-y-3 text-sm">
                <div><p className="text-xs text-slate-400 dark:text-slate-500">Deadline</p><p className="font-semibold text-slate-800 dark:text-slate-200">Aug 20, 8:00 AM</p></div>
                <div><p className="text-xs text-slate-400 dark:text-slate-500">Remaining</p><p className="font-bold text-amber-600 text-lg">02h 14m</p></div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "20%" }} />
                </div>
                <SlaIndicator status="warn" remaining="02h 14m" />
              </div>
            </SectionCard>

            {/* AI Routing */}
            <SectionCard title="AI Routing Recommendation">
              <div className="space-y-2 text-xs mb-3">
                <div><p className="text-slate-400 dark:text-slate-500">Department</p><p className="font-semibold text-slate-800 dark:text-slate-200">Water Supply Authority</p></div>
                <div><p className="text-slate-400 dark:text-slate-500">Sub-Department</p><p className="font-semibold text-slate-800 dark:text-slate-200">Zone 4 Infrastructure</p></div>
                <div><p className="text-slate-400 dark:text-slate-500">Recommended Officer</p><p className="font-semibold text-slate-800 dark:text-slate-200">Zone 4 Water Inspector</p></div>
                <div><p className="text-slate-400 dark:text-slate-500">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: "96%" }} /></div>
                    <span className="font-bold text-blue-700">96%</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 text-xs bg-blue-600 text-white rounded-lg py-1.5 hover:bg-blue-700">Accept</button>
                <button className="flex-1 text-xs border border-slate-200 text-slate-600 rounded-lg py-1.5 hover:bg-slate-50 dark:bg-slate-900">Change</button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">ⓘ AI recommendation only</p>
            </SectionCard>

            {/* AI Resolution Assistance */}
            <AiInsightCard
              title="AI Resolution Assistance"
              text={<>Suggested workflow:<br />
                1. Inspect Zone 4 water main<br />
                2. Identify pipe failure point<br />
                3. Deploy repair team<br />
                4. Verify pressure restoration<br />
                5. Close with photo evidence
              </>}
              disclaimer="AI workflow suggestion only"
              actions={<>
                <button className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800">Use Workflow</button>
                <button className="text-xs border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50">Edit Steps</button>
              </>}
            />
          </div>
        </div>
      )}

      {tab === "ai" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            {/* Priority Explanation */}
            <SectionCard title="AI Priority Score Explanation" extra={<AiBadge label="Explainable AI" />}>
              <div className="flex items-center gap-6 mb-6">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke="#ef4444" strokeWidth="8"
                      strokeDasharray={`${(91 / 100) * 201} 201`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-900 dark:text-slate-100">91</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500">/100</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-semibold text-slate-800 mb-3">Why This Priority?</p>
                  <ScoreBar label="Safety Risk" score={30} max={30} color="#ef4444" />
                  <ScoreBar label="Severity" score={25} max={30} color="#f59e0b" />
                  <ScoreBar label="People Affected" score={15} max={30} color="#3b82f6" />
                  <ScoreBar label="Duration" score={10} max={30} color="#8b5cf6" />
                  <ScoreBar label="Location Impact" score={6} max={30} color="#06b6d4" />
                  <ScoreBar label="Similar Complaints" score={5} max={30} color="#64748b" />
                  <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500">TOTAL SCORE</span>
                    <span className="text-red-600">91 / 100</span>
                  </div>
                </div>
              </div>
              <button className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">View Full AI Explanation</button>
            </SectionCard>

            {/* AI Classification */}
            <SectionCard title="AI Classification" extra={<AiBadge />}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Category</p>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">Water Supply</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Subcategory</p>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">Water Logging</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-1">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: "96%" }} /></div>
                    <span className="text-sm font-bold text-green-700">96%</span>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2">Alternative Classifications</p>
                {[{ cat: "Drainage", conf: 72 }, { cat: "Sanitation", conf: 41 }, { cat: "Roads", conf: 24 }].map(a => (
                  <div key={a.cat} className="flex items-center gap-2 mb-1.5 text-xs">
                    <span className="w-20 text-slate-600 dark:text-slate-400 dark:text-slate-500">{a.cat}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-300 rounded-full" style={{ width: `${a.conf}%` }} /></div>
                    <span className="text-slate-500 w-8">{a.conf}%</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Accept AI Classification</button>
                <button className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:bg-slate-900">Change Classification</button>
              </div>
            </SectionCard>

            {/* Duplicate Detection */}
            <SectionCard title="Duplicate Detection" extra={<AiBadge label="Semantic AI" />}>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-sm font-semibold text-amber-800 mb-3">⚠ Possible Duplicate Found — 93% Similarity</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-2">NEW GRIEVANCE</p>
                    <p className="text-xs text-slate-700 bg-white rounded p-2 border border-slate-200 dark:border-slate-700">"Large water leakage near Sector 7 market"</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-2">EXISTING — GRV-1048</p>
                    <p className="text-xs text-slate-700 bg-white rounded p-2 border border-slate-200 dark:border-slate-700">"Water pipe leakage near Sector 7"</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  {[["Location", "93%", "green"], ["Description", "88%", "green"], ["Category", "100%", "green"], ["Time", "72%", "amber"], ["Attachments", "N/A", "gray"]].map(([k, v, c]) => (
                    <div key={k as string} className={`bg-white rounded p-2 border ${c === "green" ? "border-green-200" : c === "amber" ? "border-amber-200" : "border-slate-200 dark:border-slate-700"}`}>
                      <p className="text-slate-500 dark:text-slate-500">{k}</p>
                      <p className={`font-semibold ${c === "green" ? "text-green-700" : c === "amber" ? "text-amber-700" : "text-slate-500 dark:text-slate-500"}`}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700">Link as Duplicate</button>
                <button className="text-xs border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:bg-slate-900">Not a Duplicate</button>
                <button className="text-xs text-blue-600 hover:underline">View Existing Complaint</button>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4">
            {/* Human Override */}
            <SectionCard title="Human-in-the-Loop Override">
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-purple-600">✦</span>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 dark:text-slate-500">AI Recommendation</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-500">Priority</span><PriorityBadge priority="High" /></div>
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-500">Department</span><span className="font-semibold">Water Supply</span></div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span>👤</span>
                    <p className="text-xs font-semibold text-blue-800">Officer Decision</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-slate-500 mb-1">Override Priority</p>
                      <select value={humanPriority} onChange={e => setHumanPriority(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white outline-none">
                        <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
                      </select>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Reason (required)</p>
                      <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                        rows={3} placeholder="Explain your override decision..."
                        className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-white resize-none outline-none focus:border-blue-400" />
                    </div>
                  </div>
                </div>

                <button className="w-full bg-[#0f2b4e] text-white text-xs rounded-lg py-2 hover:bg-[#1a3a5c] font-medium">
                  Save Decision & Log Audit Event
                </button>
                <p className="text-[10px] text-slate-400 text-center">Every override is automatically logged to the audit trail</p>
              </div>
            </SectionCard>

            <SectionCard title="AI Trend Detection" extra={<AiBadge />}>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-3">
                <p className="text-xs font-bold text-red-800 mb-2">⚠ Emerging Water Hotspot</p>
                <div className="space-y-1 text-xs">
                  {[["Week 1", 42], ["Week 2", 56], ["Week 3", 81], ["Week 4", 124]].map(([w, v]) => (
                    <div key={w as string} className="flex items-center gap-2">
                      <span className="text-slate-500 w-12">{w}</span>
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${(v as number / 124) * 100}%` }} />
                      </div>
                      <span className="font-bold text-slate-700 w-6">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-red-700 font-semibold mt-2">↑ +195% in 4 weeks</p>
              </div>
              <p className="text-xs text-slate-600 italic">"Inspect Sector 7 water infrastructure before complaint volume increases further."</p>
              <p className="text-[10px] text-slate-400 mt-2">ⓘ AI-generated recommendation • Not an official decision</p>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "communication" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2">
            <SectionCard title="Communication">
              <div className="flex gap-2 mb-4 text-xs">
                {["Citizen Messages", "Internal Notes"].map(t => (
                  <button key={t} className={`px-3 py-1.5 rounded-lg border ${t === "Citizen Messages" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 dark:border-slate-700"}`}>{t}</button>
                ))}
              </div>
              <div className="space-y-4 mb-4 max-h-80 overflow-y-auto">
                {[
                  { sender: "citizen", name: "Citizen A", text: "No water since 18 hours. This is an emergency.", time: "Aug 19, 8:00 AM" },
                  { sender: "officer", name: "Rajesh Kumar", text: "We have acknowledged your complaint and dispatching inspection team.", time: "Aug 19, 9:30 AM" },
                  { sender: "citizen", name: "Citizen B", text: "Same issue in Sector 7B also. Multiple families affected.", time: "Aug 19, 10:00 AM" },
                ].map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.sender === "officer" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${msg.sender === "officer" ? "bg-[#0f2b4e] text-white" : "bg-slate-200 text-slate-600 dark:text-slate-400 dark:text-slate-500"}`}>
                      {msg.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className={`max-w-sm flex flex-col ${msg.sender === "officer" ? "items-end" : "items-start"}`}>
                      <div className={`px-3 py-2 rounded-xl text-sm ${msg.sender === "officer" ? "bg-[#0f2b4e] text-white" : "bg-slate-100 text-slate-800 dark:text-slate-200"}`}>{msg.text}</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{msg.name} • {msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-3">
                <div className="flex gap-2 mb-2">
                  {["Reply", "Request Info", "Attach Docs", "Internal Note", "Transfer", "Escalate"].map(a => (
                    <button key={a} className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-50 dark:bg-slate-900">{a}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input placeholder="Type your response..." className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                  <PrimaryBtn>Send</PrimaryBtn>
                </div>
              </div>
            </SectionCard>
          </div>
          <SectionCard title="Internal Notes">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">🔒 Internal notes are not visible to citizens</p>
            <textarea rows={4} placeholder="Add internal note for team..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none outline-none focus:border-blue-400 mb-2" />
            <button className="text-xs bg-slate-800 text-white rounded-lg px-3 py-1.5 hover:bg-slate-900">Add Note</button>
          </SectionCard>
        </div>
      )}

      {tab === "resolution" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <SectionCard title="Resolution Verification" subtitle="Upload before/after evidence for AI-assisted assessment">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {["Before", "After"].map(label => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{label}</p>
                    <div className="bg-slate-100 rounded-xl h-44 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors">
                      <span className="text-3xl mb-2">{label === "Before" ? "🖼" : "📸"}</span>
                      <span className="text-xs">{label === "Before" ? "complaint_photo.jpg" : "Upload after photo"}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Resolution Note</p>
                <textarea rows={3} placeholder="Describe the resolution action taken..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none outline-none focus:border-blue-400" />
              </div>
            </SectionCard>

            <AiInsightCard
              title="AI-Assisted Resolution Assessment"
              text={<>
                <span className="text-green-600 font-semibold">✓</span> Location consistency confirmed<br />
                <span className="text-amber-600 font-semibold">⏳</span> After evidence not yet uploaded<br />
                <span className="text-green-600 font-semibold">✓</span> Complaint category matches evidence<br />
                AI confidence: <strong>Pending complete evidence</strong>
              </>}
              disclaimer="AI assists verification • Final resolution decision made by authorized personnel"
            />

            <div className="flex gap-3">
              <PrimaryBtn className="flex-1 justify-center">Confirm Resolution</PrimaryBtn>
              <SecondaryBtn className="flex-1 justify-center">Request More Evidence</SecondaryBtn>
              <button className="flex-1 px-4 py-2 text-sm font-medium border border-red-200 bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Reject Evidence</button>
            </div>
          </div>

          <SectionCard title="Citizen Feedback">
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500">
              <p className="text-xs text-slate-400 dark:text-slate-500">Citizen will be notified to confirm resolution and provide feedback.</p>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-700 mb-1">Feedback Status</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">Awaiting resolution submission</p>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

// ─── Geographic Intelligence ──────────────────────────────────────────────────
export function GeoIntelligence() {
  const [mapMode, setMapMode] = useState<"markers" | "heatmap" | "clusters">("markers");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-4">
      <PageHeader title="Geographic Intelligence" subtitle="Real-time spatial complaint analysis and hotspot detection" />

      <div className="grid grid-cols-4 gap-5" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
        {/* Map */}
        <div className="col-span-3 flex flex-col gap-3">
          {/* Map toolbar */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <div className="flex gap-1">
              {(["markers", "heatmap", "clusters"] as const).map(m => (
                <button key={m} onClick={() => setMapMode(m)} className={`px-3 py-1 text-xs rounded-lg font-medium capitalize transition-colors ${mapMode === m ? "bg-[#0f2b4e] text-white" : "text-slate-600 hover:bg-slate-100 dark:bg-slate-700"}`}>
                  {m === "markers" ? "📍 Markers" : m === "heatmap" ? "🌡 Heatmap" : "◎ Clusters"}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <input type="text" placeholder="Search area or locality..." className="flex-1 text-sm text-slate-600 outline-none" />
            <button className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-50 dark:bg-slate-900">Layers ∨</button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {["All", "Critical", "High", "Water Supply", "Roads", "Sanitation", "Breached SLA"].map(f => (
              <FilterChip key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />
            ))}
          </div>

          <div className="flex-1">
            <MapSvg mode={mapMode} height={480} showControls={true} selectedZone={selectedZone} onZoneClick={z => setSelectedZone(z === selectedZone ? null : z)} />
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-3 overflow-y-auto">
          <SectionCard title="Zone Analytics">
            <div className="space-y-2">
              {[
                { zone: "Zone 4", count: 438, level: "Critical", color: "bg-red-100 text-red-700" },
                { zone: "Zone 3", count: 201, level: "High", color: "bg-amber-100 text-amber-700" },
                { zone: "Zone 1", count: 142, level: "Moderate", color: "bg-yellow-100 text-yellow-700" },
                { zone: "Zone 2", count: 89, level: "Low", color: "bg-green-100 text-green-700" },
                { zone: "Zone 5", count: 67, level: "Moderate", color: "bg-yellow-100 text-yellow-700" },
              ].map(z => (
                <div key={z.zone} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:opacity-80 ${selectedZone === z.zone ? "ring-2 ring-blue-500" : ""}`} style={{ background: z.level === "Critical" ? "#fef2f2" : z.level === "High" ? "#fffbeb" : "#f0fdf4" }} onClick={() => setSelectedZone(z.zone === selectedZone ? null : z.zone)}>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{z.zone}</p>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${z.color}`}>{z.level}</span>
                  </div>
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{z.count}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {selectedZone === "Zone 4" && (
            <SectionCard title="Zone 4 Details" className="border-blue-300">
              <div className="space-y-2 text-xs mb-3">
                {[["Total Grievances", "438"], ["Critical", "42"], ["High", "97"], ["Water Supply", "173"], ["Roads", "122"], ["Sanitation", "81"], ["Trend", "↑ 37% this week"], ["Population", "18,420"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-500">{k}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{v}</span>
                  </div>
                ))}
              </div>
              <PrimaryBtn className="w-full justify-center text-xs">View Zone Grievances</PrimaryBtn>
            </SectionCard>
          )}

          <AiInsightCard
            title="AI Spatial Insight"
            text={<>Zone 4 complaint density <strong>increased 37%</strong> this week. Water supply failures concentrated near Sector 7 market. Consider preemptive inspection.</>}
            disclaimer="AI-generated insight • Not official action"
          />
        </div>
      </div>
    </div>
  );
}

// ─── SLA Monitoring ───────────────────────────────────────────────────────────
export function SLAMonitoring() {
  const slaItems = [
    { id: "NV-1084", priority: "Critical", dept: "Water Supply", officer: "Rajesh K.", deadline: "Aug 20, 8:00 AM", remaining: "02h 14m", status: "warn" as const },
    { id: "NV-1079", priority: "Critical", dept: "Electricity", officer: "Pradeep M.", deadline: "Aug 20, 12:00 PM", remaining: "04h 32m", status: "warn" as const },
    { id: "NV-1044", priority: "High", dept: "Roads", officer: "Suresh T.", deadline: "Aug 19, 6:00 PM", remaining: "Breached", status: "breach" as const },
    { id: "NV-1072", priority: "High", dept: "Sanitation", officer: "Rajesh K.", deadline: "Aug 21, 9:00 AM", remaining: "12h 18m", status: "ok" as const },
    { id: "NV-1065", priority: "Medium", dept: "Roads", officer: "Pradeep M.", deadline: "Aug 22, 2:00 PM", remaining: "1d 4h", status: "ok" as const },
    { id: "NV-1058", priority: "Medium", dept: "Lighting", officer: "Meera R.", deadline: "Aug 22, 6:00 PM", remaining: "1d 8h", status: "ok" as const },
  ];

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="SLA Monitoring" subtitle="Track service level agreement compliance across all assignments" />

      <div className="flex gap-3">
        <KpiCard label="Within SLA" value="86" trend="+3.1%" trendUp={true} />
        <KpiCard label="Near Deadline" value="22" trend="+12%" trendUp={false} />
        <KpiCard label="Breached" value="12" trend="+40%" trendUp={false} />
        <KpiCard label="Avg Resolution Time" value="3.8 days" trend="-8%" trendUp={true} />
      </div>

      <SectionCard title="SLA Status Board">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
              {["Complaint ID", "Priority", "Department", "Officer", "SLA Deadline", "Remaining", "Status", "Action"].map(h => (
                <th key={h} className="text-left font-medium pb-3 pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {slaItems.map(r => (
              <tr key={r.id} className={`hover:bg-slate-50 ${r.status === "breach" ? "bg-red-50/40" : r.status === "warn" ? "bg-amber-50/30" : ""}`}>
                <td className="py-3 pr-3 font-mono text-xs text-blue-600 font-semibold">{r.id}</td>
                <td className="py-3 pr-3"><PriorityBadge priority={r.priority} /></td>
                <td className="py-3 pr-3 text-slate-700 text-xs">{r.dept}</td>
                <td className="py-3 pr-3 text-slate-600 text-xs">{r.officer}</td>
                <td className="py-3 pr-3 text-slate-600 text-xs">{r.deadline}</td>
                <td className="py-3 pr-3"><SlaIndicator status={r.status} remaining={r.remaining} /></td>
                <td className="py-3 pr-3">
                  <span className={`text-xs font-medium ${r.status === "breach" ? "text-red-600" : r.status === "warn" ? "text-amber-600" : "text-green-600"}`}>
                    {r.status === "breach" ? "🔴 Breached" : r.status === "warn" ? "🟠 Nearing" : "🟢 Within SLA"}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex gap-1">
                    {r.status === "breach" && <button className="text-xs text-red-600 border border-red-200 rounded px-2 py-0.5 hover:bg-red-50">Escalate</button>}
                    <button className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50">View</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

// ─── Escalations ─────────────────────────────────────────────────────────────
export function Escalations() {
  const escalations = [
    { id: "NV-1044", title: "Road damage near school", from: "Officer Rajesh K.", to: "Department Head", reason: "SLA Exceeded", time: "2h ago", priority: "High", status: "Pending" },
    { id: "NV-1084", title: "Water supply failure Zone 4", from: "System", to: "District Officer", reason: "Critical grievance", time: "5h ago", priority: "Critical", status: "Acknowledged" },
    { id: "NV-1033", title: "Repeated garbage complaint", from: "Citizen", to: "Officer Pradeep M.", reason: "Repeated complaints", time: "1d ago", priority: "Medium", status: "Resolved" },
  ];

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Escalation Management" subtitle="Track and manage escalated grievances through authority hierarchy">
        <PrimaryBtn>+ New Escalation</PrimaryBtn>
      </PageHeader>

      {/* Hierarchy */}
      <SectionCard title="Escalation Hierarchy">
        <div className="flex items-center gap-3 text-sm">
          {["Officer", "Department Head", "District Officer", "Higher Authority"].map((lvl, i) => (
            <div key={lvl} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? "bg-blue-600 text-white" : i === 1 ? "bg-amber-100 text-amber-700" : i === 2 ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"}`}>
                  {lvl.split(" ").map(w => w[0]).join("")}
                </div>
                <span className="text-[10px] text-slate-600 mt-1 text-center w-20 leading-tight">{lvl}</span>
              </div>
              {i < 3 && <span className="text-slate-300 text-lg mb-4">→</span>}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Active Escalations">
        <div className="space-y-3">
          {escalations.map(e => (
            <div key={e.id} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-blue-600 font-semibold">{e.id}</span>
                    <PriorityBadge priority={e.priority} />
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{e.title}</p>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500">{e.time}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-slate-600 mb-3">
                <div><p className="text-slate-400 dark:text-slate-500">From</p><p className="font-medium">{e.from}</p></div>
                <div><p className="text-slate-400 dark:text-slate-500">Escalated To</p><p className="font-medium">{e.to}</p></div>
                <div><p className="text-slate-400 dark:text-slate-500">Reason</p><p className="font-medium text-amber-700">{e.reason}</p></div>
              </div>
              <div className="flex gap-2">
                <button className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1 hover:bg-blue-50">View Details</button>
                <button className="text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-1 hover:bg-slate-50 dark:bg-slate-900">View History</button>
                {e.status === "Pending" && <button className="text-xs text-red-600 border border-red-200 rounded-lg px-3 py-1 hover:bg-red-50">Escalate Further</button>}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
