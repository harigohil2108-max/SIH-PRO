import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  KpiCard, SectionCard, AiInsightCard, PageHeader, PrimaryBtn, SecondaryBtn, GhostBtn,
  StatusBadge, PriorityBadge, Timeline, ChartLegend, FilterChip,
} from "../components/Shared";
import MapSvg from "../components/MapSvg";
import {
  getMyGrievances,
  getGrievanceById,
  createGrievance,
  submitFeedback,
  reopenGrievance,
} from "./services/grievanceService";

const trendData = [
  { month: "Jan", submitted: 38, resolved: 22 }, { month: "Feb", submitted: 45, resolved: 28 },
  { month: "Mar", submitted: 52, resolved: 38 }, { month: "Apr", submitted: 41, resolved: 30 },
  { month: "May", submitted: 60, resolved: 42 }, { month: "Jun", submitted: 70, resolved: 50 },
  { month: "Jul", submitted: 85, resolved: 55 }, { month: "Aug", submitted: 75, resolved: 58 },
  { month: "Sep", submitted: 80, resolved: 60 }, { month: "Oct", submitted: 95, resolved: 65 },
  { month: "Nov", submitted: 110, resolved: 72 }, { month: "Dec", submitted: 120, resolved: 80 },
];

const catData = [
  { name: "Roads", value: 8, color: "#1e3a5f" },
  { name: "Water Supply", value: 7, color: "#2563eb" },
  { name: "Electricity", value: 4, color: "#16a34a" },
  { name: "Sanitation", value: 3, color: "#d97706" },
  { name: "Waste Mgmt", value: 1, color: "#7c3aed" },
  { name: "Street Lights", value: 1, color: "#db2777" },
];

 //n

 const formatStatus = (status: string) => {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatPriority = (priority: string) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
};

// ─── Citizen Dashboard ────────────────────────────────────────────────────────
export function CitizenDashboard({
  navigate,
}: {
  navigate: (screen: string) => void;
}) {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login to view your grievances");
          setLoading(false);
          return;
        }

        const data = await getMyGrievances(token);

        setGrievances(data.grievances || []);
      } catch (error) {
        console.error("Failed to load grievances:", error);
        setError("Failed to load grievances");
      } finally {
        setLoading(false);
      }
    };

    fetchGrievances();
  }, []);

  return  (
    <div className="p-6 space-y-5">
      <PageHeader title="Welcome back, Priya" subtitle="Your Voice. Our Responsibility.">
        <SecondaryBtn onClick={() => navigate("my-grievances")}>Track Grievances</SecondaryBtn>
        <PrimaryBtn onClick={() => navigate("submit-grievance")}><span>+</span> Submit New Grievance</PrimaryBtn>
      </PageHeader>

      <div className="flex gap-3 overflow-x-auto pb-1">
        <KpiCard label="Total Grievances" value="24" trend="+12.5%" trendUp={true} />
        <KpiCard label="Pending" value="8" trend="+23.1%" trendUp={true} />
        <KpiCard label="In Progress" value="6" trend="+8.2%" trendUp={true} />
        <KpiCard label="Resolved" value="7" trend="-2.1%" trendUp={false} />
        <KpiCard label="Reopened" value="2" trend="+5.3%" trendUp={true} />
        <KpiCard label="Avg Resolution" value="4.2 days" trend="+15.7%" trendUp={true} />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <SectionCard
            title="Grievance Status Trend"
            subtitle="Overview of grievance submissions vs resolutions"
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

          <SectionCard title="Recent Grievances" extra={<GhostBtn onClick={() => navigate("my-grievances")}>View all</GhostBtn>}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  {["ID", "Title", "Category", "Status", "Priority", "Date", "Action"].map(h => (
                    <th key={h} className="text-left font-medium pb-2 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {grievances.map((r) => (
                  <tr key={r.grievanceId} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate("grievance-detail")}>
                    <td className="py-2.5 pr-3 font-mono text-xs text-slate-500 dark:text-slate-500">{r.grievanceId}</td>
                    <td className="py-2.5 pr-3 text-slate-800 font-medium text-sm">{r.title}</td>
                    <td className="py-2.5 pr-3 text-slate-500 text-xs">{r.category}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={formatStatus(r.status)} /></td>
                    <td className="py-2.5 pr-3"><PriorityBadge priority={formatPriority(r.priority)} /></td>
                    <td className="py-2.5 pr-3 text-slate-500 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5"><button className="text-xs text-blue-600 hover:underline font-medium">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Grievances by Category">
            <div className="flex justify-center mb-3">
              <PieChart width={160} height={160}>
                <Pie data={catData} innerRadius={45} outerRadius={72} dataKey="value" stroke="none">
                  {catData.map(e => <Cell key={e.name} fill={e.color} />)}
                </Pie>
              </PieChart>
            </div>
            <div className="space-y-1.5">
              {catData.map(c => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    <span className="text-slate-600 dark:text-slate-400 dark:text-slate-500">{c.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{c.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <AiInsightCard
            title="AI-Assisted Insight"
            text={<>Your grievance <strong>NV-1024</strong> has been assigned to the <strong>Public Works Department</strong>. The current expected next step is field verification.</>}
            disclaimer="AI-generated insight • Not an official government decision"
          />

          <SectionCard title="Grievance Timeline">
            <Timeline steps={[
              { label: "Submitted", desc: "Citizen filed pothole grievance", time: "Aug 15, 09:30 AM", done: true, actor: "You" },
              { label: "AI Analyzed", desc: "Classified as Roads – High Priority", time: "Aug 15, 09:31 AM", done: true, actor: "Nivara AI" },
              { label: "Assigned", desc: "Routed to Public Works Dept.", time: "Aug 15, 10:00 AM", done: true, actor: "System" },
              { label: "Officer Assigned", desc: "Assigned to Officer Rajesh K.", time: "Aug 16, 09:00 AM", done: false },
              { label: "Resolved", desc: "Awaiting field verification", time: "Pending", done: false },
            ]} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─── My Grievances ────────────────────────────────────────────────────────────
export function MyGrievances({
  navigate,
}: {
  navigate: (screen: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filters = [
    "All",
    "Submitted",
    "In Progress",
    "Resolved",
    "Escalated",
    "Reopened",
  ];

  useEffect(() => {
    const fetchGrievances = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Please login to view your grievances");
          setLoading(false);
          return;
        }

        const data = await getMyGrievances(token);

        setGrievances(data.grievances || []);
      } catch (error) {
        console.error("Failed to load grievances:", error);
        setError("Failed to load grievances");
      } finally {
        setLoading(false);
      }
    };

    fetchGrievances();
  }, []);

  const filtered =
    activeFilter === "All"
      ? grievances
      : grievances.filter(
          (g) => formatStatus(g.status) === activeFilter
        );
  

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="My Grievances" subtitle="Track and manage all your submitted grievances">
        <PrimaryBtn onClick={() => navigate("submit-grievance")}><span>+</span> Submit New Grievance</PrimaryBtn>
      </PageHeader>

      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => <FilterChip key={f} label={f} active={activeFilter === f} onClick={() => setActiveFilter(f)} />)}
        <div className="ml-auto flex items-center gap-2">
          <input type="text" placeholder="Search grievances..." className="pl-3 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 rounded-lg text-sm text-slate-600 placeholder:text-slate-400 outline-none focus:border-blue-400 w-48" />
        </div>
      </div>

      <SectionCard>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
              {["ID", "Title", "Category", "Status", "Priority", "Date Submitted", "Last Updated", "Action"].map(h => (
                <th key={h} className="text-left font-medium pb-3 pr-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
  {loading ? (
    <tr>
      <td
        colSpan={8}
        className="py-6 text-center text-slate-400"
      >
        Loading grievances...
      </td>
    </tr>
  ) : error ? (
    <tr>
      <td
        colSpan={8}
        className="py-6 text-center text-red-500"
      >
        {error}
      </td>
    </tr>
  ) : filtered.length === 0 ? (
    <tr>
      <td
        colSpan={8}
        className="py-6 text-center text-slate-400"
      >
        No grievances found.
      </td>
    </tr>
  ) : (
    filtered.map((r) => (
      <tr
        key={r._id}
        className="hover:bg-slate-50 cursor-pointer"
        onClick={() => navigate(`grievance-detail:${r._id}`)}
      >
        <td className="py-3 pr-3 font-mono text-xs text-blue-600 font-semibold">
          {r.grievanceId}
        </td>

        <td className="py-3 pr-3 text-slate-800 font-medium">
          {r.title}
        </td>

        <td className="py-3 pr-3 text-slate-500 text-xs">
          {r.category}
        </td>

        <td className="py-3 pr-3">
          <StatusBadge status={formatStatus(r.status)} />
        </td>

        <td className="py-3 pr-3">
          <PriorityBadge priority={formatPriority(r.priority)} />
        </td>

        <td className="py-3 pr-3 text-slate-500 text-xs">
          {new Date(r.createdAt).toLocaleDateString()}
        </td>

        <td className="py-3 pr-3 text-slate-500 text-xs">
          {new Date(r.updatedAt).toLocaleDateString()}
        </td>

        <td className="py-3">
          <button className="text-xs text-blue-600 hover:underline font-medium mr-2">
            View
          </button>

          {formatStatus(r.status) === "Resolved" && (
            <button className="text-xs text-slate-400 hover:text-slate-600">
              Rate
            </button>
          )}
        </td>
      </tr>
    ))
  )}
</tbody>
        </table>
      </SectionCard>
    </div>
  );
}

// ─── Submit Grievance (Multi-step) ────────────────────────────────────────────
export function SubmitGrievance({ navigate }: { navigate: (screen: string) => void }) {
  const [step, setStep] = useState(1);
  const [text, setText] = useState("");
  const [lang, setLang] = useState("Hindi");
  const [inputMode, setInputMode] = useState<"voice" | "text">("text");
  const steps = ["Describe Issue", "Location", "Evidence", "Review", "Submitted"];
  const [submittedGrievance, setSubmittedGrievance] = useState<any>(null);
const [submitting, setSubmitting] = useState(false);
const [submitError, setSubmitError] = useState("");
const handleSubmit = async () => {
  try {
    setSubmitting(true);
    setSubmitError("");

    const token = localStorage.getItem("token");

    if (!token) {
      setSubmitError("Please login first.");
      return;
    }

    if (!text.trim()) {
      setSubmitError("Please describe your grievance.");
      setStep(1);
      return;
    }

    const data = await createGrievance(token, {
      title:
        text.trim().length > 60
          ? text.trim().substring(0, 60) + "..."
          : text.trim(),

      description: text.trim(),

      category: "Roads",
      subcategory: "Pothole",

      location: {
        address: "Main Gate Road, Sector 7",
        city: "Raipur",
        state: "Chhattisgarh",
      },

      evidence: [],
    });

    console.log("Grievance created:", data);

    setSubmittedGrievance(data.grievance);
    setStep(5);
  } catch (error) {
    console.error("Submit grievance error:", error);
    setSubmitError(
      error instanceof Error
        ? error.message
        : "Failed to submit grievance"
    );
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader title="Submit New Grievance" subtitle="AI-powered multi-step grievance submission">
        <SecondaryBtn onClick={() => navigate("dashboard")}>← Cancel</SecondaryBtn>
      </PageHeader>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  step > i + 1 ? "bg-blue-600 border-blue-600 text-white" :
                  step === i + 1 ? "bg-[#0f2b4e] border-[#0f2b4e] text-white" :
                  "bg-white dark:bg-slate-800 border-slate-300 text-slate-400 dark:text-slate-500"
                }`}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${step === i + 1 ? "text-[#0f2b4e]" : step > i + 1 ? "text-blue-600" : "text-slate-400 dark:text-slate-500"}`}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 ${step > i + 1 ? "bg-blue-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <SectionCard title="Describe Your Issue">
              <div className="flex gap-2 mb-4">
                <button onClick={() => setInputMode("text")} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border font-medium transition-colors ${inputMode === "text" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 dark:border-slate-700"}`}>
                  ✏ Type Complaint
                </button>
                <button onClick={() => setInputMode("voice")} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border font-medium transition-colors ${inputMode === "voice" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 dark:border-slate-700"}`}>
                  🎙 Voice Input
                </button>
                <div className="ml-auto flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer">
                  🌐 Language: <strong className="ml-1">{lang}</strong> ∨
                </div>
              </div>

              {inputMode === "voice" ? (
                <div className="flex flex-col items-center justify-center h-40 bg-blue-50 rounded-xl border-2 border-dashed border-blue-200">
                  <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl mb-2 animate-pulse">🎙</div>
                  <p className="text-sm text-slate-600 font-medium">Recording... Speak your grievance</p>
                  <p className="text-xs text-slate-400 mt-1">Hindi detected • Tap to stop</p>
                </div>
              ) : (
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={6}
                  placeholder="Describe your grievance in your own words... (e.g., There is a large pothole near the main gate that has been there for 5 days)"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none outline-none focus:border-blue-400 focus:bg-white dark:bg-slate-800"
                />
              )}

              <div className="flex items-center gap-2 mt-2">
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <span>🌐</span> Detected Language: <strong className="text-slate-700 dark:text-slate-300">{lang}</strong>
                </div>
                <button className="text-xs text-blue-600 hover:underline ml-1">Change</button>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-600">✦</span>
                <span className="text-sm font-semibold text-purple-800">AI Analysis</span>
                <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-semibold">LIVE</span>
              </div>
              <p className="text-xs text-slate-600 mb-3">AI automatically extracts key information as you type.</p>

              <div className="space-y-2">
                {[
                  { label: "Category", value: "Roads", conf: null },
                  { label: "Subcategory", value: "Pothole", conf: null },
                  { label: "AI Confidence", value: "94%", conf: 94 },
                  { label: "Issue Duration", value: "~5 days", conf: null },
                  { label: "Urgency", value: "High", conf: null },
                  { label: "Affected People", value: "~200 households", conf: null },
                ].map(({ label, value, conf }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-500">{label}</span>
                    <div className="flex items-center gap-1.5">
                      {conf && <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${conf}%` }} /></div>}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">ⓘ AI-extracted • Review before submitting</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">💬 AI Assistant</p>
              <p className="text-xs text-slate-600 leading-relaxed italic">"Tell us what happened. You can describe the problem naturally in your own language."</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Location */}
      {step === 2 && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <SectionCard title="Where is the problem located?">
              <div className="flex gap-2 mb-3">
                <PrimaryBtn className="text-xs py-1.5">◎ Use My Current Location</PrimaryBtn>
                <SecondaryBtn className="text-xs py-1.5">📍 Select Location Manually</SecondaryBtn>
              </div>
              <div className="relative mb-3">
                <input type="text" placeholder="Search area, street, landmark..." className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" defaultValue="Main Gate Road, Sector 7" />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              </div>
              <MapSvg mode="markers" height={320} showLocationPicker={true} />
              <p className="text-xs text-slate-500 mt-2">Drag the pin to adjust the exact location</p>
            </SectionCard>
          </div>

          <SectionCard title="Selected Location">
            <div className="space-y-3">
              {[
                { label: "Location", value: "Main Gate Road, Sector 7" },
                { label: "Latitude", value: "21.2514" },
                { label: "Longitude", value: "81.6296" },
                { label: "Accuracy", value: "±12 m" },
                { label: "Zone", value: "Zone 4" },
                { label: "Ward", value: "Ward 12" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
                  <p className="text-sm text-slate-800 font-medium">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 font-semibold mb-1">⚡ AI Route Prediction</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500">Based on location, this will likely route to <strong>Public Works Dept.</strong></p>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Step 3 — Evidence */}
      {step === 3 && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <SectionCard title="Upload Evidence">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                <div className="text-4xl mb-3">📎</div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Drag & drop files here</p>
                <p className="text-xs text-slate-400 mt-1">or</p>
                <button className="mt-3 px-4 py-2 bg-[#0f2b4e] text-white text-sm rounded-lg font-medium hover:bg-[#1a3a5c]">Upload Evidence</button>
                <p className="text-xs text-slate-400 mt-2">Photos, Videos, Documents • Max 25MB per file</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                {["photo_1.jpg", "photo_2.jpg", "video_1.mp4"].map(name => (
                  <div key={name} className="bg-slate-100 rounded-lg h-24 flex flex-col items-center justify-center text-slate-500 border border-slate-200 relative group cursor-pointer hover:bg-slate-50 dark:bg-slate-900">
                    <span className="text-2xl">{name.includes("video") ? "🎥" : "🖼"}</span>
                    <span className="text-xs mt-1 text-slate-500 dark:text-slate-500">{name}</span>
                    <button className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] hidden group-hover:flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-600">✦</span>
                <span className="text-sm font-semibold text-purple-800">AI Evidence Analysis</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Issue Detected</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Road damage / Pothole</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Visual Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: "91%" }} />
                    </div>
                    <span className="text-xs font-bold text-green-700">91%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Severity Assessment</p>
                  <p className="text-sm font-semibold text-amber-700">Moderate–High</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3">ⓘ AI assessment only — does not constitute official action</p>
            </div>

            <SectionCard title="File Requirements">
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500">
                {["At least 1 photo is recommended", "Videos: max 2 minutes", "Documents: PDF, DOCX", "Clear images improve AI accuracy"].map(r => (
                  <li key={r} className="flex items-center gap-1.5"><span className="text-green-500">✓</span>{r}</li>
                ))}
              </ul>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Step 4 — Review */}
      {step === 4 && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <SectionCard title="Review Your Grievance">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Complaint Description</p>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">There is a large pothole near the main gate that has been there for 5 days causing accidents and damaging vehicles.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Category", value: "Roads" }, { label: "Subcategory", value: "Pothole" },
                    { label: "Priority", value: "High" }, { label: "Location", value: "Main Gate Road, Sector 7" },
                    { label: "Zone", value: "Zone 4" }, { label: "Expected SLA", value: "24 hours" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Attachments</p>
                  <div className="flex gap-2">
                    {["photo_1.jpg", "photo_2.jpg", "video_1.mp4"].map(f => (
                      <div key={f} className="bg-slate-100 rounded px-2 py-1 text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500">{f}</div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Duplicate Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-lg mt-0.5">⚠</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Possible Similar Grievance Found</p>
                  <div className="mt-2 bg-white rounded-lg border border-amber-100 p-3">
                    <p className="font-mono text-xs text-blue-600 font-semibold">GRV-1021</p>
                    <p className="text-sm text-slate-700 mt-0.5">"Large pothole near railway crossing"</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-500">Similarity:</span>
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-24"><div className="h-full bg-amber-500 rounded-full" style={{ width: "93%" }} /></div>
                      <span className="text-xs font-bold text-amber-700">93%</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">View Similar Grievance</button>
                    <button className="text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 dark:bg-slate-900">Continue Anyway</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-800 mb-3">✦ AI Summary</p>
              <div className="space-y-2 text-xs">
                {[
                  { k: "Issue", v: "Road damage near Main Gate" },
                  { k: "Duration", v: "5 days" },
                  { k: "Affected", v: "~200 households" },
                  { k: "Risk", v: "High pedestrian safety risk" },
                  { k: "Similar", v: "17 similar complaints" },
                  { k: "Dept.", v: "Public Works Dept." },
                ].map(({ k, v }) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-500">{k}</span>
                    <span className="font-semibold text-slate-800 text-right max-w-24">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <SectionCard title="AI Routing Recommendation">
              <div className="space-y-2 text-xs">
                <div><p className="text-slate-400 dark:text-slate-500">Department</p><p className="font-semibold text-slate-800 dark:text-slate-200">Public Works Department</p></div>
                <div><p className="text-slate-400 dark:text-slate-500">Sub-Department</p><p className="font-semibold text-slate-800 dark:text-slate-200">Road Maintenance</p></div>
                <div><p className="text-slate-400 dark:text-slate-500">Confidence</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: "96%" }} /></div>
                    <span className="font-bold text-blue-700">96%</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3">ⓘ AI recommendation only</p>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Step 5 — Success */}
      {step === 5 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Grievance Submitted!</h2>
          <p className="text-slate-500 mb-6">Your grievance has been received and is being processed</p>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-6 w-full max-w-md shadow-sm mb-6">
            <div className="space-y-3 text-sm">
              {[
                {
                  label: "Complaint ID",
                  value: submittedGrievance?.grievanceId || "Generating...",
                  mono: true,
                },
                { label: "Status", value: "Submitted" },
                { label: "Expected SLA", value: "24 hours" },
                { label: "Assigned Department", value: "Public Works Department" },
                { label: "AI Priority Score", value: "78 / 100" },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex justify-between items-center pb-2 border-b border-slate-50 last:border-0">
                  <span className="text-slate-500 dark:text-slate-500">{label}</span>
                  <span className={`font-semibold text-slate-900 ${mono ? "font-mono text-blue-600" : ""}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <PrimaryBtn onClick={() => navigate("grievance-detail")}>Track Grievance</PrimaryBtn>
            <SecondaryBtn onClick={() => navigate("dashboard")}>Back to Dashboard</SecondaryBtn>
          </div>
        </div>
      )}

      {submitError && (
  <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
    {submitError}
  </div>
)}
      {/* Navigation Buttons */}
      {step < 5 && (
        <div className="flex justify-between pt-2">
          <SecondaryBtn onClick={() => step > 1 ? setStep(s => s - 1) : navigate("dashboard")}>
            {step === 1 ? "Cancel" : "← Back"}
          </SecondaryBtn>
          <PrimaryBtn
  onClick={step === 4 ? handleSubmit : () => setStep(s => s + 1)}
>
  {step === 4
    ? submitting
      ? "Submitting..."
      : "Submit Grievance"
    : "Continue →"}
</PrimaryBtn>
        </div>
      )}
    </div>
  );
}

// ─── Grievance Detail ─────────────────────────────────────────────────────────
export function GrievanceDetail({
  navigate,
  grievanceId,
}: {
  navigate: (screen: string) => void;
  grievanceId?: string;
}) {
  const [tab, setTab] = useState<"overview" | "communication" | "resolution">("overview");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
const [feedback, setFeedback] = useState("");
const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
const [feedbackMessage, setFeedbackMessage] = useState("");
  const [grievance, setGrievance] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
useEffect(() => {
  const fetchGrievance = async () => {
    const token = localStorage.getItem("token");

    if (!token || !grievanceId) {
      setError("Unable to load grievance");
      setLoading(false);
      return;
    }

    try {
      const data = await getGrievanceById(token, grievanceId);

      setGrievance(data.grievance || data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load grievance"
      );
    } finally {
      setLoading(false);
    }
  };

  fetchGrievance();
}, [grievanceId]);

if (loading) {
  return <div className="p-6">Loading grievance...</div>;
}

if (error) {
  return <div className="p-6 text-red-600">{error}</div>;
}

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate("my-grievances")} className="mt-1 text-slate-400 hover:text-slate-700 text-sm">← Back</button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
  {grievance.grievanceId} — {grievance.title}
</h1>

<StatusBadge status={grievance.status} />

<PriorityBadge priority={grievance.priority} />
            </div>
           <p className="text-xs text-slate-500 mt-1">
  Category: {grievance.category} • Submitted{" "}
  {new Date(grievance.createdAt).toLocaleDateString()} •{" "}
  {grievance.location?.city || "Location not specified"}
</p>
          </div>
        </div>
        <div className="flex gap-2">
          <SecondaryBtn>Share</SecondaryBtn>
          <PrimaryBtn>Escalate</PrimaryBtn>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 bg-slate-100 rounded-lg p-1 w-fit">
        {(["overview", "communication", "resolution"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-300"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            {/* AI Summary */}
            <AiInsightCard
              title="AI-Generated Complaint Summary"
              text={grievance.aiSummary || grievance.description || "No summary available."}
              disclaimer="AI-generated summary • Verify with official records"
            />

            {/* Location Map */}
            <SectionCard title="Complaint Location" subtitle={
  grievance.location?.address ||
  grievance.location?.city ||
  "Location not specified"
}>
              <MapSvg mode="markers" height={240} showLocationPicker={true} />
            </SectionCard>

            {/* Timeline */}
            <SectionCard title="Complaint Timeline">
              <Timeline steps={grievance.timeline.map((item: any) => ({
  label: item.status.replace(/_/g, " "),
  desc: item.message,
  time: new Date(item.timestamp).toLocaleString(),
  done: true,
}))} />
            </SectionCard>
          </div>

          <div className="space-y-4">
            {/* SLA */}
            <SectionCard title="SLA Status">
              <div className="space-y-3 text-sm">
  <div>
    <p className="text-xs text-slate-400 dark:text-slate-500">
      Status
    </p>
    <p
      className={`font-semibold ${
        grievance.sla?.breached
          ? "text-red-600"
          : "text-green-600"
      }`}
    >
      {grievance.sla?.breached ? "SLA Breached" : "Within SLA"}
    </p>
  </div>

  <div>
    <p className="text-xs text-slate-400 dark:text-slate-500">
      Escalation
    </p>
    <p className="font-semibold text-slate-800 dark:text-slate-200">
      {grievance.sla?.escalated ? "Escalated" : "Not escalated"}
    </p>
  </div>
</div>
            </SectionCard>

            {/* Assigned */}
            <SectionCard title="Assigned Department">
              <div className="space-y-2 text-sm">
  <div>
    <p className="text-xs text-slate-400 dark:text-slate-500">
      Department
    </p>
    <p className="font-semibold text-slate-800 dark:text-slate-200">
      {grievance.department?.name || "Not assigned yet"}
    </p>
  </div>

  <div>
    <p className="text-xs text-slate-400 dark:text-slate-500">
      Officer
    </p>
    <p className="font-semibold text-slate-800 dark:text-slate-200">
      {grievance.assignedOfficer?.name || "Not assigned yet"}
    </p>
  </div>
</div>
            </SectionCard>

            {/* Resolution actions */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</p>
              <div className="space-y-2">
                <SecondaryBtn className="w-full justify-center text-xs">📎 Upload More Evidence</SecondaryBtn>
                <SecondaryBtn className="w-full justify-center text-xs">📋 Download Report</SecondaryBtn>
                <button className="w-full text-xs text-red-600 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50">⚠ Escalate Grievance</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "communication" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2">
            <SectionCard title="Messages">
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {[
                  { sender: "Officer", name: "Rajesh Kumar", text: "We have received your complaint and will schedule a field visit shortly.", time: "Aug 16, 09:15 AM", self: false },
                  { sender: "You", name: "Priya Sharma", text: "Thank you. The pothole has caused two accidents already. Please prioritize.", time: "Aug 16, 10:30 AM", self: true },
                  { sender: "Officer", name: "Rajesh Kumar", text: "Noted. We have escalated the priority to High. Field visit scheduled for Aug 18.", time: "Aug 17, 09:00 AM", self: false },
                ].map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.self ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${msg.self ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600 dark:text-slate-400 dark:text-slate-500"}`}>
                      {msg.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className={`max-w-xs ${msg.self ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`px-3 py-2 rounded-xl text-sm ${msg.self ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800 dark:text-slate-200"}`}>{msg.text}</div>
                      <p className="text-[10px] text-slate-400 mt-1">{msg.name} • {msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-slate-100 pt-4">
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a reply..." className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                <PrimaryBtn>Send</PrimaryBtn>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Communication Info">
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500">
              <p>Messages are shared between you and the assigned officer.</p>
              <p className="text-slate-400 dark:text-slate-500">Internal officer notes are not visible to citizens.</p>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                <p className="font-semibold text-slate-700 mb-2">Attach Evidence</p>
                <button className="w-full border-2 border-dashed border-slate-200 rounded-lg py-3 text-slate-400 text-xs hover:border-blue-300 hover:bg-blue-50 transition-colors">
                  + Add Photos / Documents
                </button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === "resolution" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <SectionCard title="Resolution Evidence">
              <div className="grid grid-cols-2 gap-4 mb-4">
  {grievance.resolution?.evidence?.length > 0 ? (
    grievance.resolution.evidence.map((item: string, index: number) => (
      <div key={index}>
        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
          Evidence {index + 1}
        </p>
        <div className="bg-slate-100 rounded-xl h-40 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
          {item}
        </div>
      </div>
    ))
  ) : (
    <div className="col-span-2 bg-slate-100 rounded-xl h-40 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
      No resolution evidence uploaded yet.
    </div>
  )}
</div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Officer Resolution Note</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
  {grievance.resolution?.note || "No resolution note available yet."}
</p>
              </div>
            </SectionCard>

            <AiInsightCard
              title="AI-Assisted Evidence Assessment"
              text={<>
                <span className="text-green-600 font-semibold">✓</span> Location appears consistent with reported address<br />
                <span className="text-amber-600 font-semibold">⏳</span> Resolution evidence not yet uploaded<br />
                AI Confidence: <strong>Pending complete evidence</strong>
              </>}
              disclaimer="AI-assisted assessment — final decision remains with authorized officer"
            />

            <div className="flex gap-3">
              <PrimaryBtn className="flex-1 justify-center">Accept Resolution</PrimaryBtn>
              <SecondaryBtn className="flex-1 justify-center">Reject Resolution</SecondaryBtn>
              <button
  className="flex-1 px-4 py-2 text-sm font-medium border border-amber-300 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100"
  onClick={async () => {
    const token = localStorage.getItem("token");

    if (!token || !grievanceId) {
      alert("Unable to reopen grievance.");
      return;
    }

    const reason = window.prompt(
      "Why do you want to reopen this grievance?"
    );

    if (reason === null) {
      return;
    }

    try {
      await reopenGrievance(token, grievanceId, reason);

      alert("Grievance reopened successfully.");

      const data = await getGrievanceById(token, grievanceId);
      setGrievance(data.grievance || data);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to reopen grievance."
      );
    }
  }}
>
  Reopen
</button>
            </div>
          </div>

          <div className="space-y-4">
            <SectionCard title="Rate Resolution">
              <p className="text-xs text-slate-500 mb-3">How satisfied are you with the resolution?</p>
              <div className="flex gap-2 justify-center text-3xl mb-3">
               {[1, 2, 3, 4, 5].map(s => (
  <button
    key={s}
    onClick={() => setRating(s)}
    className={`hover:scale-125 transition-transform ${
      s <= rating ? "text-yellow-500" : "text-slate-300"
    }`}
  >
    {"★"}
  </button>
))}
              </div>
              <textarea rows={3}
  value={feedback}
  onChange={(e) => setFeedback(e.target.value)} placeholder="Share your feedback..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none outline-none focus:border-blue-400" />
              <PrimaryBtn
  className="w-full mt-3 justify-center"
  onClick={async () => {
    const token = localStorage.getItem("token");

    if (!token || !grievanceId) {
      setFeedbackMessage("Unable to submit feedback.");
      return;
    }

    if (!rating) {
      setFeedbackMessage("Please select a rating.");
      return;
    }

    try {
      setFeedbackSubmitting(true);
      setFeedbackMessage("");

      await submitFeedback(
        token,
        grievanceId,
        rating,
        feedback
      );

      setFeedbackMessage("Feedback submitted successfully.");
    } catch (err) {
      setFeedbackMessage(
        err instanceof Error
          ? err.message
          : "Failed to submit feedback."
      );
    } finally {
      setFeedbackSubmitting(false);
    }
  }}
>
  {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
</PrimaryBtn>{feedbackMessage && (
  <p className="text-xs text-slate-500 mt-2">
    {feedbackMessage}
  </p>
)}
            </SectionCard>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function CitizenNotifications() {
  const notifs = [
    { icon: "🔔", title: "Status Update", desc: "NV-1024 is now In Progress. Officer Rajesh assigned.", time: "2h ago", unread: true },
    { icon: "✦", title: "AI Insight", desc: "Your grievance NV-1024 has been prioritized. Field visit scheduled.", time: "5h ago", unread: true },
    { icon: "📩", title: "New Message", desc: "Officer Rajesh: Field visit scheduled for Aug 18.", time: "1d ago", unread: false },
    { icon: "✓", title: "Resolved", desc: "NV-1019 marked as resolved. Rate your experience.", time: "3d ago", unread: false },
    { icon: "⚠", title: "SLA Warning", desc: "NV-1023 approaching response deadline in 6 hours.", time: "4d ago", unread: false },
  ];
  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Notifications" subtitle="Stay updated on your grievances and platform activity" />
      <SectionCard>
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {notifs.map((n, i) => (
            <div key={i} className={`flex gap-4 py-4 hover:bg-slate-50 cursor-pointer rounded-lg px-2 transition-colors ${n.unread ? "bg-blue-50/30" : ""}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${n.unread ? "bg-blue-100" : "bg-slate-100 dark:bg-slate-700"}`}>{n.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{n.title}</span>
                  {n.unread && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{n.desc}</p>
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">{n.time}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
