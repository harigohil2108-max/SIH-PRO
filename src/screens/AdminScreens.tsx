import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import {
  KpiCard, SectionCard, AiInsightCard, PageHeader, PrimaryBtn, SecondaryBtn, GhostBtn,
  StatusBadge, PriorityBadge, Timeline, ChartLegend, FilterChip, SlaIndicator, AiBadge,
} from "../components/Shared";
import MapSvg from "../components/MapSvg";
import { getCurrentUser } from "./services/authService";

const trendData = [
  { month: "Jan", submitted: 85, resolved: 62 }, { month: "Feb", submitted: 98, resolved: 74 },
  { month: "Mar", submitted: 120, resolved: 95 }, { month: "Apr", submitted: 105, resolved: 88 },
  { month: "May", submitted: 140, resolved: 112 }, { month: "Jun", submitted: 165, resolved: 130 },
  { month: "Jul", submitted: 190, resolved: 148 }, { month: "Aug", submitted: 175, resolved: 158 },
  { month: "Sep", submitted: 185, resolved: 160 }, { month: "Oct", submitted: 210, resolved: 172 },
  { month: "Nov", submitted: 240, resolved: 195 }, { month: "Dec", submitted: 260, resolved: 210 },
];

const catAdmin = [
  { name: "Roads", value: 280, color: "#1e3a5f" },
  { name: "Water Supply", value: 245, color: "#2563eb" },
  { name: "Electricity", value: 140, color: "#16a34a" },
  { name: "Sanitation", value: 105, color: "#d97706" },
  { name: "Waste Mgmt", value: 35, color: "#7c3aed" },
  { name: "Street Lighting", value: 35, color: "#db2777" },
  { name: "Transport", value: 24, color: "#0891b2" },
];

const depts = [
  { name: "Public Works Department", open: 42, resolved: 187, sla: 89.2, avg: "4.1 days", critical: 8, officers: 24 },
  { name: "Water Supply Authority", open: 28, resolved: 203, sla: 94.7, avg: "3.2 days", critical: 3, officers: 18 },
  { name: "Electricity Board", open: 19, resolved: 112, sla: 97.1, avg: "2.8 days", critical: 2, officers: 15 },
  { name: "Sanitation Department", open: 35, resolved: 89, sla: 78.4, avg: "5.6 days", critical: 11, officers: 20 },
  { name: "Transport Authority", open: 12, resolved: 54, sla: 91.8, avg: "3.9 days", critical: 1, officers: 10 },
];

const allGrievances = [
  { id: "NV-1084", title: "Water supply failure", cat: "Water Supply", priority: "Critical", score: 94, dept: "Water Supply Auth.", officer: "Rajesh K.", location: "Zone 4", status: "Escalated", sla: "warn" as const, dup: true, date: "Aug 19" },
  { id: "NV-1079", title: "Power outage Sector 5", cat: "Electricity", priority: "Critical", score: 91, dept: "Electricity Board", officer: "Pradeep M.", location: "Zone 3", status: "Assigned", sla: "warn" as const, dup: false, date: "Aug 19" },
  { id: "NV-1072", title: "Garbage accumulation", cat: "Sanitation", priority: "High", score: 84, dept: "Sanitation Dept.", officer: "Rajesh K.", location: "Zone 4", status: "In Progress", sla: "ok" as const, dup: false, date: "Aug 18" },
  { id: "NV-1065", title: "Pothole near school", cat: "Roads", priority: "High", score: 76, dept: "Public Works", officer: "Meera R.", location: "Zone 2", status: "Assigned", sla: "ok" as const, dup: true, date: "Aug 18" },
  { id: "NV-1058", title: "Street light outage", cat: "Lighting", priority: "Medium", score: 63, dept: "Electricity Board", officer: "Suresh T.", location: "Zone 1", status: "In Progress", sla: "ok" as const, dup: false, date: "Aug 17" },
  { id: "NV-1044", title: "Road cave-in", cat: "Roads", priority: "High", score: 80, dept: "Public Works", officer: "Pradeep M.", location: "Zone 3", status: "Escalated", sla: "breach" as const, dup: false, date: "Aug 15" },
];

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export function AdminDashboard({ navigate }: { navigate: (s: string) => void }) {
  const [currentUser, setCurrentUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null));
  }, []);

  return (
    <div className="p-6 space-y-5">
      <PageHeader title={`Welcome back, ${currentUser?.name || "Administrator"}`} subtitle="Admin Command Center • Nivara Core Management Platform">
        <SecondaryBtn onClick={() => navigate("reports")}>Generate Report</SecondaryBtn>
        <PrimaryBtn onClick={() => navigate("all-grievances")}><span>+</span> System Overview</PrimaryBtn>
      </PageHeader>

      {/* Quick links */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "🗺 Geographic Intelligence", screen: "geo-intelligence" },
          { label: "◎ Complaint Clusters", screen: "complaint-clusters" },
          { label: "✦ AI Analytics", screen: "ai-analytics" },
          { label: "📋 Audit Logs", screen: "audit-logs" },
          { label: "📊 Reports", screen: "reports" },
        ].map(({ label, screen }) => (
          <button key={screen} onClick={() => navigate(screen)}
            className="px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg text-slate-700 hover:border-blue-400 hover:text-blue-700 transition-colors font-medium shadow-sm">
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        <KpiCard label="Total Grievances" value="1,247" trend="+12.5%" trendUp={true} />
        <KpiCard label="Active Cases" value="186" trend="+8.2%" trendUp={true} />
        <KpiCard label="SLA Compliance" value="91.3%" trend="-2.1%" trendUp={false} />
        <KpiCard label="Resolution Rate" value="87.6%" trend="+5.3%" trendUp={true} />
        <KpiCard label="Avg Resolution" value="3.8 days" trend="-15.7%" trendUp={false} />
        <KpiCard label="Departments Active" value="12" trend="+0%" trendUp={true} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <SectionCard
            title="Grievance Volume Overview"
            subtitle="Monthly breakdown of submitted issues vs resolved resolutions"
            extra={<button className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-50 dark:bg-slate-900">Last 12 months ∨</button>}
          >
            <ChartLegend items={[{ color: "#2563eb", label: "Submitted" }, { color: "#16a34a", label: "Resolved" }]} />
            <ResponsiveContainer width="100%" height={220}>
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

          <SectionCard title="Department Performance SLA Report" extra={<GhostBtn onClick={() => navigate("departments")}>View all departments</GhostBtn>}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  {["Department", "Open Cases", "Resolved", "SLA Compliance", "Avg Resolution", "Action"].map(h => (
                    <th key={h} className="text-left font-medium pb-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {depts.map(d => (
                  <tr key={d.name} className="hover:bg-slate-50 dark:bg-slate-900">
                    <td className="py-2.5 pr-3 font-medium text-slate-800 text-sm">{d.name}</td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400 dark:text-slate-500">{d.open}</td>
                    <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400 dark:text-slate-500">{d.resolved}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${d.sla >= 90 ? "bg-green-100 text-green-700" : d.sla >= 80 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {d.sla}%
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600 text-xs">{d.avg}</td>
                    <td className="py-2.5">
                      <button className="text-xs text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Grievances by Category">
            <div className="space-y-2.5">
              {catAdmin.map(c => (
                <div key={c.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                      <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500">{c.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{c.value}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(c.value / 280) * 100}%`, background: c.color }} />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <AiInsightCard
            title="AI-Assisted Governance Insights"
            text={<>Road-related grievances <strong>increased 18%</strong> this month in <strong>Zone 4</strong>. Water supply complaints concentrated in <strong>Sectors 3 and 7</strong> — consider preemptive infrastructure audit.</>}
            disclaimer="AI Insight helper • Verify before official action"
          />

          <SectionCard title="Recent Administrative Activity">
            <Timeline steps={[
              { label: "Department Reassignment", desc: "NV-1080 moved to Water Supply", time: "9:00 AM", done: true },
              { label: "Officer Assignment", desc: "Pradeep assigned NV-1075", time: "10:30 AM", done: true },
              { label: "SLA Escalation", desc: "NV-1084 auto-escalated", time: "11:00 AM", done: true },
              { label: "Status Update", desc: "NV-1070 marked Resolved", time: "1:15 PM", done: true },
              { label: "Audit Event", desc: "Department config updated", time: "3:00 PM", done: false },
            ]} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─── All Grievances ───────────────────────────────────────────────────────────
export function AllGrievances({ navigate }: { navigate: (s: string) => void }) {
  const [search, setSearch] = useState("");
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const toggleChip = (c: string) => setActiveChips(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);

  const chips = ["Critical", "High", "SLA Breached", "Duplicate", "Water Supply", "Roads", "Escalated"];
  const visibleGrievances = allGrievances.filter((grievance) => {
    const matchesSearch = !search ||
      grievance.title.toLowerCase().includes(search.toLowerCase()) ||
      grievance.id.toLowerCase().includes(search.toLowerCase()) ||
      grievance.cat.toLowerCase().includes(search.toLowerCase()) ||
      grievance.officer.toLowerCase().includes(search.toLowerCase());

    const matchesChips = activeChips.every((chip) => {
      if (chip === "SLA Breached") return grievance.sla === "breach";
      if (chip === "Duplicate") return grievance.dup;
      if (chip === "Escalated") return grievance.status === "Escalated";
      return grievance.priority === chip || grievance.cat === chip;
    });

    return matchesSearch && matchesChips;
  });

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="All Grievances" subtitle="Universal grievance management across all departments and officers">
        <SecondaryBtn>Export CSV</SecondaryBtn>
        <PrimaryBtn>Export PDF</PrimaryBtn>
      </PageHeader>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, title, category, officer..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
          </div>
          {["Priority ∨", "Category ∨", "Department ∨", "Officer ∨", "Zone ∨", "SLA ∨", "Status ∨", "Date ∨"].map(f => (
            <button key={f} className="px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-600 hover:border-blue-400 bg-white whitespace-nowrap">{f}</button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-slate-500 dark:text-slate-500">Quick filters:</span>
          {chips.map(c => (
            <FilterChip key={c} label={c} active={activeChips.includes(c)} onClick={() => toggleChip(c)} />
          ))}
          {activeChips.length > 0 && <button onClick={() => setActiveChips([])} className="text-xs text-slate-400 hover:text-slate-600 underline">Clear all</button>}
        </div>
      </div>

      <SectionCard>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500 dark:text-slate-500">Showing <strong>{visibleGrievances.length}</strong> grievances</p>
          <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-500">
            <span>Sort by: <button className="text-blue-600 font-medium">AI Score ∨</button></span>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
              {["ID", "Title", "Category", "Priority", "AI Score", "Department", "Officer", "Location", "Status", "SLA", "Dup.", "Created", "Action"].map(h => (
                <th key={h} className="text-left font-medium pb-3 pr-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {visibleGrievances.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate("grievance-detail")}>
                <td className="py-2.5 pr-2 font-mono text-xs text-blue-600 font-semibold">{r.id}</td>
                <td className="py-2.5 pr-2 text-slate-800 font-medium text-xs max-w-28 truncate">{r.title}</td>
                <td className="py-2.5 pr-2 text-slate-500 text-xs">{r.cat}</td>
                <td className="py-2.5 pr-2"><PriorityBadge priority={r.priority} /></td>
                <td className="py-2.5 pr-2">
                  <div className="flex items-center gap-1">
                    <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: r.score > 85 ? "#ef4444" : r.score > 70 ? "#f59e0b" : "#3b82f6" }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{r.score}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-2 text-slate-500 text-xs">{r.dept}</td>
                <td className="py-2.5 pr-2 text-slate-500 text-xs">{r.officer}</td>
                <td className="py-2.5 pr-2 text-slate-500 text-xs">{r.location}</td>
                <td className="py-2.5 pr-2"><StatusBadge status={r.status} /></td>
                <td className="py-2.5 pr-2"><SlaIndicator status={r.sla} remaining={r.sla === "breach" ? "Breached" : r.sla === "warn" ? "~2h" : "OK"} /></td>
                <td className="py-2.5 pr-2 text-center">
                  {r.dup && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">DUP</span>}
                </td>
                <td className="py-2.5 pr-2 text-slate-400 text-xs">{r.date}</td>
                <td className="py-2.5">
                  <button className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleGrievances.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No grievances match the current search and filters.
          </p>
        )}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 dark:text-slate-500">
          <span>Page 1 of 48</span>
          <div className="flex gap-1">
            {["←", "1", "2", "3", "...", "48", "→"].map((p, i) => (
              <button key={i} className={`w-7 h-7 rounded text-xs ${p === "1" ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900"}`}>{p}</button>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Departments ──────────────────────────────────────────────────────────────
export function Departments() {
  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Department Management" subtitle="Manage departments, SLA configuration and officer assignments">
        <PrimaryBtn>+ Add Department</PrimaryBtn>
      </PageHeader>

      <div className="flex gap-3">
        <KpiCard label="Total Departments" value="12" trend="+0%" trendUp={true} />
        <KpiCard label="Active Officers" value="142" trend="+8%" trendUp={true} />
        <KpiCard label="Avg SLA Compliance" value="91.3%" trend="-2.1%" trendUp={false} />
        <KpiCard label="Open Cases" value="186" trend="+8.2%" trendUp={false} />
      </div>

      <SectionCard>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
              {["Department", "Open Cases", "Resolved", "SLA Compliance", "Avg Resolution", "Critical", "Officers", "Actions"].map(h => (
                <th key={h} className="text-left font-medium pb-3 pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {depts.map(d => (
              <tr key={d.name} className="hover:bg-slate-50 dark:bg-slate-900">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                      {d.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{d.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-slate-600 dark:text-slate-400 dark:text-slate-500">{d.open}</td>
                <td className="py-3 pr-3 text-slate-600 dark:text-slate-400 dark:text-slate-500">{d.resolved}</td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${d.sla}%`, background: d.sla >= 90 ? "#16a34a" : d.sla >= 80 ? "#d97706" : "#ef4444" }} />
                    </div>
                    <span className={`text-xs font-semibold ${d.sla >= 90 ? "text-green-700" : d.sla >= 80 ? "text-amber-700" : "text-red-700"}`}>{d.sla}%</span>
                  </div>
                </td>
                <td className="py-3 pr-3 text-slate-600 text-xs">{d.avg}</td>
                <td className="py-3 pr-3">
                  {d.critical > 0 && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">{d.critical}</span>}
                </td>
                <td className="py-3 pr-3 text-slate-600 dark:text-slate-400 dark:text-slate-500">{d.officers}</td>
                <td className="py-3">
                  <div className="flex gap-1">
                    <button className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50">View</button>
                    <button className="text-xs text-slate-600 border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-50 dark:bg-slate-900">SLA Config</button>
                    <button className="text-xs text-slate-600 border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-50 dark:bg-slate-900">Officers</button>
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

// ─── Geographic Intelligence (Admin) ─────────────────────────────────────────
export function AdminGeoIntelligence({ navigate }: { navigate: (screen: string) => void }) {
  const [mapMode, setMapMode] = useState<"markers" | "heatmap" | "clusters">("heatmap");
  const [selectedZone, setSelectedZone] = useState<string | null>("Zone 4");

  return (
    <div className="p-6 space-y-4">
      <PageHeader title="Geographic Intelligence" subtitle="AI-powered spatial analysis — complaint density, hotspots and trend overlays">
        <SecondaryBtn>Export Map</SecondaryBtn>
        <PrimaryBtn onClick={() => navigate("reports")}>Generate Zone Report</PrimaryBtn>
      </PageHeader>

      <div className="flex gap-3">
        <KpiCard label="Total Complaints" value="1,247" trend="+12.5%" trendUp={true} />
        <KpiCard label="Critical Complaints" value="42" trend="+18%" trendUp={false} />
        <KpiCard label="Active Hotspots" value="3" trend="+50%" trendUp={false} />
        <KpiCard label="Emerging Trends" value="5" trend="+25%" trendUp={false} />
        <KpiCard label="Affected Population" value="58,420" trend="+8%" trendUp={false} />
      </div>

      <div className="grid grid-cols-4 gap-5">
        <div className="col-span-3 space-y-3">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <div className="flex gap-1">
              {(["markers", "heatmap", "clusters"] as const).map(m => (
                <button key={m} onClick={() => setMapMode(m)} className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${mapMode === m ? "bg-[#0f2b4e] text-white" : "text-slate-600 hover:bg-slate-100 dark:bg-slate-700"}`}>
                  {m === "markers" ? "📍 Markers" : m === "heatmap" ? "🌡 Heatmap" : "◎ Clusters"}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <input type="text" placeholder="Search area, zone, locality..." className="flex-1 text-sm text-slate-600 outline-none" />
            <div className="flex gap-1">
              {["Layers ∨", "Zones ∨", "Dept. Boundaries ∨"].map(b => (
                <button key={b} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-50 dark:bg-slate-900">{b}</button>
              ))}
            </div>
          </div>
          <MapSvg mode={mapMode} height={500} showControls={true} selectedZone={selectedZone} onZoneClick={z => setSelectedZone(z === selectedZone ? null : z)} />
        </div>

        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 600 }}>
          <SectionCard title="Zone Summary">
            <div className="space-y-2">
              {[
                { zone: "Zone 4", count: 438, pct: 35, level: "Critical", color: "#ef4444" },
                { zone: "Zone 3", count: 201, pct: 16, level: "High", color: "#f59e0b" },
                { zone: "Zone 1", count: 142, pct: 11, level: "Moderate", color: "#eab308" },
                { zone: "Zone 2", count: 89, pct: 7, level: "Low", color: "#22c55e" },
                { zone: "Zone 5", count: 67, pct: 5, level: "Moderate", color: "#eab308" },
                { zone: "Zone 6", count: 45, pct: 4, level: "Low", color: "#22c55e" },
              ].map(z => (
                <div key={z.zone} onClick={() => setSelectedZone(z.zone === selectedZone ? null : z.zone)}
                  className={`p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${selectedZone === z.zone ? "ring-2 ring-blue-500 bg-blue-50" : "bg-slate-50 dark:bg-slate-900"}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{z.zone}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{z.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${z.pct * 2.5}%`, background: z.color }} />
                  </div>
                  <span className="text-[10px]" style={{ color: z.color }}>{z.level}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {selectedZone === "Zone 4" && (
            <SectionCard title="Zone 4 — Details" className="border-red-200">
              <div className="space-y-2 text-xs mb-3">
                {[["Total", "438"], ["Critical", "42"], ["High", "97"], ["Water", "173"], ["Roads", "122"], ["Sanitation", "81"], ["Trend", "↑ 37%"], ["Population", "18,420"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-500">{k}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate("all-grievances")} className="w-full text-xs bg-red-600 text-white rounded-lg py-1.5 hover:bg-red-700">View Zone Grievances</button>
            </SectionCard>
          )}

          <AiInsightCard
            title="AI Spatial Analysis"
            text={<>Zone 4 complaint density <strong>increased 37%</strong> this week. Water + Roads complaints converging near Sector 7 market. Recommend coordinated infrastructure inspection.</>}
            disclaimer="AI-generated • Not an official government decision"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Complaint Clusters ───────────────────────────────────────────────────────
export function ComplaintClusters({ navigate }: { navigate: (s: string) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const clusters = [
    { id: 17, title: "Water Supply Failure", zone: "Zone 4", count: 187, area: "2.4 km²", priority: "Critical", trend: "+64%", trendUp: false, categories: [["Water", 173], ["Sanitation", 14]], first: "Aug 12", latest: "Aug 21" },
    { id: 12, title: "Road Deterioration", zone: "Zone 3", count: 124, area: "1.8 km²", priority: "High", trend: "+38%", trendUp: false, categories: [["Roads", 98], ["Drainage", 26]], first: "Aug 10", latest: "Aug 21" },
    { id: 8, title: "Power Outages", zone: "Zone 5", count: 89, area: "3.1 km²", priority: "High", trend: "+22%", trendUp: false, categories: [["Electricity", 89]], first: "Aug 15", latest: "Aug 21" },
    { id: 5, title: "Garbage Accumulation", zone: "Zone 2", count: 54, area: "0.9 km²", priority: "Medium", trend: "+15%", trendUp: false, categories: [["Sanitation", 42], ["Waste Mgmt", 12]], first: "Aug 18", latest: "Aug 21" },
  ];

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Complaint Clusters" subtitle="AI-detected emerging civic problem clusters requiring coordinated response">
        <SecondaryBtn>Export Analysis</SecondaryBtn>
        <PrimaryBtn onClick={() => navigate("geo-intelligence")}>View on Map</PrimaryBtn>
      </PageHeader>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          {/* Cluster map */}
          <SectionCard title="Cluster Map Visualization">
            <MapSvg mode="clusters" height={320} showControls={true} />
          </SectionCard>

          {/* Cluster cards */}
          <div className="space-y-3">
            {clusters.map((c, i) => (
              <div key={c.id} onClick={() => setSelected(selected === i ? null : i)}
                className={`bg-white dark:bg-slate-800 border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${selected === i ? "border-blue-400 shadow-md" : "border-slate-200 dark:border-slate-700"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400 font-semibold">CLUSTER #{c.id}</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{c.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{c.zone} • {c.area} affected area</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{c.count}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">complaints</p>
                    <p className={`text-xs font-bold mt-0.5 ${c.trendUp ? "text-green-600" : "text-red-600"}`}>↑ {c.trend} this week</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-xs mb-3">
                  {[["First Reported", c.first], ["Latest", c.latest], ["Zone", c.zone], ["Area", c.area]].map(([k, v]) => (
                    <div key={k as string}>
                      <p className="text-slate-400 dark:text-slate-500">{k}</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{v}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-2 flex-1">
                    {c.categories.map(([cat, n]) => (
                      <span key={cat as string} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{cat}: {n}</span>
                    ))}
                  </div>
                  <button className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1 hover:bg-blue-50 font-medium">View Cluster Grievances</button>
                </div>

                {selected === i && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <AiInsightCard
                      title="AI Cluster Analysis"
                      text={<>This cluster shows <strong>coordinated infrastructure failure</strong> signs. {c.count} complaints share similar geo-coordinates and time pattern. Recommend unified field inspection.</>}
                      disclaimer="AI-generated cluster analysis • Not an official decision"
                      actions={<>
                        <button className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg">Assign Task Force</button>
                        <button className="text-xs border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg">Generate Report</button>
                      </>}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <SectionCard title="Trend Detection" extra={<AiBadge />}>
            <div className="space-y-4">
              {[
                { cat: "Water Complaints", vals: [42, 56, 81, 124], color: "#2563eb", pct: "+195%" },
                { cat: "Road Damage", vals: [28, 35, 48, 65], color: "#d97706", pct: "+132%" },
                { cat: "Power Outages", vals: [18, 22, 34, 41], color: "#f59e0b", pct: "+128%" },
              ].map(t => (
                <div key={t.cat} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.cat}</p>
                    <span className="text-xs font-bold text-red-600">{t.pct}</span>
                  </div>
                  {t.vals.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-1 text-xs">
                      <span className="text-slate-400 w-10">Week {idx + 1}</span>
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(v / 124) * 100}%`, background: t.color }} />
                      </div>
                      <span className="font-bold text-slate-700 w-6">{v}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-red-600 mt-1.5 font-medium">⚠ Emerging Hotspot Detected</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3">ⓘ AI-generated trend detection • Not official government data</p>
          </SectionCard>

          <AiInsightCard
            title="AI Governance Alert"
            text={<>3 active cluster patterns detected. Zone 4 Water cluster <strong>highest urgency</strong>. Coordinated multi-department response recommended within 24 hours.</>}
            disclaimer="AI recommendation • Requires human authorization"
            actions={<>
              <button className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg">Trigger Response</button>
              <button className="text-xs border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg">Dismiss</button>
            </>}
          />
        </div>
      </div>
    </div>
  );
}

// ─── AI Analytics ─────────────────────────────────────────────────────────────
export function AIAnalytics() {
  const confData = [
    { range: "90-100%", count: 342 }, { range: "80-90%", count: 518 },
    { range: "70-80%", count: 287 }, { range: "60-70%", count: 64 }, { range: "<60%", count: 36 },
  ];
  return (
    <div className="p-6 space-y-5">
      <PageHeader title="AI Analytics Dashboard" subtitle="Monitor AI model performance, accuracy and human-in-the-loop governance metrics">
        <SecondaryBtn>Export Report</SecondaryBtn>
      </PageHeader>

      <div className="flex gap-3 flex-wrap">
        <KpiCard label="Classification Accuracy" value="94.2%" trend="+1.8%" trendUp={true} />
        <KpiCard label="Duplicate Detection" value="91.7%" trend="+3.2%" trendUp={true} />
        <KpiCard label="Avg AI Confidence" value="87.3%" trend="+2.1%" trendUp={true} />
        <KpiCard label="AI Overrides" value="142" trend="+18%" trendUp={false} />
        <KpiCard label="Human Acceptance" value="78.4%" trend="-4.2%" trendUp={false} />
        <KpiCard label="AI-assisted Resolved" value="892" trend="+22%" trendUp={true} />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <SectionCard title="AI Confidence Distribution" subtitle="How confident AI is across all classifications">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={confData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="AI vs Human Decisions" subtitle="Acceptance, override and rejection breakdown">
          <div className="flex items-center justify-center gap-8 mb-4">
            {[["Accepted", 892, "#16a34a"], ["Overridden", 142, "#f59e0b"], ["Rejected", 34, "#ef4444"]].map(([label, val, color]) => (
              <div key={label as string} className="text-center">
                <p className="text-2xl font-black" style={{ color: color as string }}>{val}</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="h-3 rounded-full overflow-hidden flex">
            <div className="bg-green-500" style={{ width: "83%" }} />
            <div className="bg-amber-400" style={{ width: "13%" }} />
            <div className="bg-red-500" style={{ width: "4%" }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>Accepted 83%</span><span>Overridden 13%</span><span>Rejected 4%</span>
          </div>
        </SectionCard>

        <SectionCard title="Classification Accuracy by Category">
          <div className="space-y-2.5">
            {[["Roads", 96], ["Water Supply", 94], ["Electricity", 92], ["Sanitation", 89], ["Waste Mgmt", 85], ["Street Lighting", 91]].map(([cat, acc]) => (
              <div key={cat as string} className="flex items-center gap-3 text-xs">
                <span className="text-slate-600 w-28">{cat}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${acc}%` }} />
                </div>
                <span className="font-bold text-slate-700 w-10">{acc}%</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Priority Score Distribution">
          <div className="space-y-2">
            {[["Critical (90-100)", 89, "#ef4444"], ["High (70-89)", 247, "#f59e0b"], ["Medium (50-69)", 412, "#3b82f6"], ["Low (<50)", 499, "#64748b"]].map(([label, val, color]) => (
              <div key={label as string} className="flex items-center gap-3 text-xs">
                <span className="text-slate-600 w-32">{label}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(val as number / 499) * 100}%`, background: color as string }} />
                </div>
                <span className="font-bold text-slate-700 w-8">{val}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <AiInsightCard
        title="AI Performance Governance Insight"
        text={<>AI classification accuracy improved <strong>1.8%</strong> this month. Human override rate increased in Sanitation category — consider retraining with recent override data. Duplicate detection performing above target at <strong>91.7%</strong>.</>}
        disclaimer="AI-generated performance analysis • For governance review only"
      />
    </div>
  );
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export function AuditLogs() {
  const events = [
    { who: "Citizen Priya S.", what: "Complaint Created", detail: "NV-1024 — Pothole near Main Gate", when: "Aug 15, 09:30 AM", why: "Citizen submission", type: "create" },
    { who: "Nivara AI", what: "AI Classified", detail: "Roads > Pothole — Confidence 94%", when: "Aug 15, 09:31 AM", why: "Automated classification", type: "ai" },
    { who: "Nivara AI", what: "Priority Generated", detail: "Score 78/100 — High priority", when: "Aug 15, 09:31 AM", why: "AI priority scoring", type: "ai" },
    { who: "System", what: "Department Assigned", detail: "Routed to Public Works Dept.", when: "Aug 15, 10:00 AM", why: "AI routing — Confidence 96%", type: "system" },
    { who: "Officer Rajesh K.", what: "Assignment Accepted", detail: "NV-1024 accepted by Rajesh Kumar", when: "Aug 16, 09:00 AM", why: "Officer confirmed assignment", type: "officer" },
    { who: "Officer Rajesh K.", what: "Priority Changed", detail: "HIGH → CRITICAL", when: "Aug 19, 10:42 AM", why: "Safety risk verified during inspection", type: "override" },
    { who: "Officer Rajesh K.", what: "Resolution Submitted", detail: "Field repair completed with evidence", when: "Aug 20, 02:15 PM", why: "Repair work confirmed", type: "resolve" },
    { who: "Citizen Priya S.", what: "Citizen Feedback", detail: "Rated 4/5 — satisfied with resolution", when: "Aug 21, 11:00 AM", why: "Citizen review", type: "feedback" },
  ];

  const typeConfig: Record<string, { color: string; icon: string }> = {
    create: { color: "bg-blue-100 text-blue-700", icon: "📝" },
    ai: { color: "bg-purple-100 text-purple-700", icon: "✦" },
    system: { color: "bg-slate-100 text-slate-600 dark:text-slate-400 dark:text-slate-500", icon: "⚙" },
    officer: { color: "bg-green-100 text-green-700", icon: "👤" },
    override: { color: "bg-amber-100 text-amber-700", icon: "⚡" },
    resolve: { color: "bg-green-100 text-green-700", icon: "✓" },
    feedback: { color: "bg-blue-100 text-blue-700", icon: "★" },
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Audit Logs" subtitle="Complete immutable audit trail of all platform events and decisions">
        <SecondaryBtn>Export Logs</SecondaryBtn>
        <SecondaryBtn>Filter</SecondaryBtn>
      </PageHeader>

      <div className="flex gap-2 flex-wrap">
        {["All Events", "AI Decisions", "Human Overrides", "Resolutions", "System Events", "Citizen Actions"].map(f => (
          <FilterChip key={f} label={f} active={f === "All Events"} />
        ))}
        <div className="ml-auto">
          <input type="text" placeholder="Search logs..." className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 rounded-lg text-xs text-slate-600 outline-none focus:border-blue-400 w-48" />
        </div>
      </div>

      <SectionCard>
        <div className="space-y-0">
          {events.map((e, i) => {
            const cfg = typeConfig[e.type];
            return (
              <div key={i} className="flex gap-4 py-4 border-b border-slate-50 hover:bg-slate-50 rounded-lg px-2 transition-colors">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  {i < events.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-2" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{e.what}</span>
                        {e.type === "ai" && <AiBadge />}
                        {e.type === "override" && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">HUMAN OVERRIDE</span>}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{e.detail}</p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{e.when}</span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-slate-500 dark:text-slate-500">
                    <span><strong className="text-slate-700 dark:text-slate-300">WHO:</strong> {e.who}</span>
                    <span><strong className="text-slate-700 dark:text-slate-300">WHY:</strong> {e.why}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 dark:text-slate-500">
          <span>Showing 8 of 1,247 events</span>
          <div className="flex gap-1">
            {["←", "1", "2", "3", "...", "→"].map((p, i) => (
              <button key={i} className={`w-7 h-7 rounded text-xs ${p === "1" ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900"}`}>{p}</button>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export function Reports() {
  const [selected, setSelected] = useState("Grievance Report");
  const types = ["Grievance Report", "Department Performance", "SLA Report", "Geographic Report", "AI Performance Report", "Audit Report"];

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Report Generation" subtitle="Generate, filter and export platform reports">
        <SecondaryBtn>Scheduled Reports</SecondaryBtn>
        <PrimaryBtn>+ Generate Report</PrimaryBtn>
      </PageHeader>

      <div className="grid grid-cols-3 gap-5">
        <div className="space-y-3">
          <SectionCard title="Report Type">
            <div className="space-y-1">
              {types.map(t => (
                <button key={t} onClick={() => setSelected(t)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selected === t ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200" : "text-slate-600 hover:bg-slate-50 dark:bg-slate-900"}`}>
                  {t}
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="col-span-2 space-y-4">
          <SectionCard title={`Configure: ${selected}`}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[["Date Range", "Last 30 days ∨"], ["Department", "All Departments ∨"], ["Category", "All Categories ∨"], ["Zone", "All Zones ∨"], ["Priority", "All Priorities ∨"], ["Status", "All Statuses ∨"]].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <button className="w-full text-left px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 hover:border-blue-400 transition-colors">{val}</button>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">Preview — {selected}</p>
              <div className="space-y-1 text-xs text-slate-500 dark:text-slate-500">
                <p>• Period: Aug 1 – Aug 21, 2026</p>
                <p>• Total records: 1,247 grievances</p>
                <p>• Departments: 12 active</p>
                <p>• Estimated file size: ~2.4 MB</p>
              </div>
            </div>

            <div className="flex gap-2">
              <PrimaryBtn className="flex-1 justify-center">Generate Report</PrimaryBtn>
              <SecondaryBtn className="flex-1 justify-center">Export CSV</SecondaryBtn>
              <SecondaryBtn className="flex-1 justify-center">Export PDF</SecondaryBtn>
            </div>
          </SectionCard>

          <SectionCard title="Recent Reports">
            <div className="space-y-2">
              {[
                { name: "Monthly SLA Report — July 2026", date: "Aug 1, 9:00 AM", size: "1.8 MB" },
                { name: "Department Performance Q2 2026", date: "Jul 15, 2:00 PM", size: "3.2 MB" },
                { name: "AI Performance Report — July", date: "Aug 1, 9:05 AM", size: "0.9 MB" },
                { name: "Geographic Analysis — Zone 4", date: "Aug 10, 11:00 AM", size: "4.1 MB" },
              ].map(r => (
                <div key={r.name} className="flex items-center justify-between py-2 border-b border-slate-50 hover:bg-slate-50 rounded-lg px-2 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{r.date} • {r.size}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50">Download</button>
                    <button className="text-xs text-slate-400 border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-50 dark:bg-slate-900">View</button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
