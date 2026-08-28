import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  KpiCard, SectionCard, AiInsightCard, PageHeader, PrimaryBtn, SecondaryBtn, GhostBtn,
  StatusBadge, PriorityBadge, Timeline, ChartLegend, FilterChip,
} from "../components/Shared";
import MapSvg from "../components/MapSvg";
import { reverseGeocode, searchAddress } from "../services/mapService";
import {
  getMyGrievances,
  getGrievanceById,
  createGrievance,
  submitFeedback,
  reopenGrievance,
  analyzeGrievance,
  checkDuplicateGrievances,
  sendGrievanceMessage,
} from "../services/grievanceService";

import { getCurrentUser } from "./services/authService";

const CATEGORY_COLORS = [
  "#1e3a5f",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#db2777",
];

const LANGUAGE_OPTIONS = [
  ["English", "en-IN"],
  ["Hindi", "hi-IN"],
  ["Bengali", "bn-IN"],
  ["Marathi", "mr-IN"],
  ["Telugu", "te-IN"],
  ["Tamil", "ta-IN"],
] as const;

const detectLanguage = (value: string) => {
  if (/\p{Script=Devanagari}/u.test(value)) return "Hindi";
  if (/\p{Script=Bengali}/u.test(value)) return "Bengali";
  if (/\p{Script=Telugu}/u.test(value)) return "Telugu";
  if (/\p{Script=Tamil}/u.test(value)) return "Tamil";
  return "English";
};

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const formatMonth = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "short" });

const getResolutionDate = (grievance: any) => {
  const timelineResolution = grievance?.timeline?.find(
    (item: any) => item.status === "RESOLVED" || item.status === "CLOSED"
  )?.timestamp;

  return grievance?.resolution?.resolvedAt || timelineResolution || null;
};

const detectWrittenLanguage = (value: string) => {
  if (/\p{Script=Devanagari}/u.test(value)) return "Hindi";
  if (/\p{Script=Bengali}/u.test(value)) return "Bengali";
  if (/\p{Script=Telugu}/u.test(value)) return "Telugu";
  if (/\p{Script=Tamil}/u.test(value)) return "Tamil";
  return "English";
};

const getAverageResolutionDays = (items: any[]) => {
  const durations = items
    .map((g) => {
      const created = new Date(g.createdAt).getTime();
      const resolved = getResolutionDate(g);
      if (!resolved || Number.isNaN(created)) return null;
      const resolvedTime = new Date(resolved).getTime();
      if (Number.isNaN(resolvedTime) || resolvedTime < created) return null;
      return (resolvedTime - created) / (1000 * 60 * 60 * 24);
    })
    .filter((value): value is number => value != null);

  if (!durations.length) return "N/A";
  return `${(durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(1)} days`;
};

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
  const [currentUser, setCurrentUser] = useState<{ _id?: string; name: string } | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => setCurrentUser(user));
  }, []);

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

  const totalGrievances = grievances.length;
  const pendingGrievances = grievances.filter((g) =>
    ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED"].includes(g.status)
  ).length;
  const inProgressGrievances = grievances.filter(
    (g) => g.status === "IN_PROGRESS"
  ).length;
  const resolvedGrievances = grievances.filter((g) =>
    ["RESOLVED", "CLOSED"].includes(g.status)
  ).length;
  const reopenedGrievances = grievances.filter(
    (g) => g.status === "REOPENED"
  ).length;

  const categoryCounts = grievances.reduce<Record<string, number>>((acc, grievance) => {
    const category = grievance.category || grievance.aiAnalysis?.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const catData = Object.entries(categoryCounts).map(([name, value], index) => ({
    name,
    value,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));

  const now = new Date();
  const trendData = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const key = getMonthKey(date);

    return {
      month: formatMonth(date),
      submitted: grievances.filter(
        (g) => getMonthKey(new Date(g.createdAt)) === key
      ).length,
      resolved: grievances.filter((g) => {
        const resolvedAt = getResolutionDate(g);
        return resolvedAt
          ? getMonthKey(new Date(resolvedAt)) === key
          : false;
      }).length,
    };
  });

  const latestGrievance = grievances[0];
  const latestTimeline = latestGrievance?.timeline?.slice(-5).reverse() || [];

  return  (
    <div className="p-6 space-y-5">
      <PageHeader title={`Welcome back, ${currentUser?.name || "User"}`} subtitle="Your Voice. Our Responsibility.">
        <SecondaryBtn onClick={() => navigate("my-grievances")}>Track Grievances</SecondaryBtn>
        <PrimaryBtn onClick={() => navigate("submit-grievance")}><span>+</span> Submit New Grievance</PrimaryBtn>
      </PageHeader>

      <div className="flex gap-3 overflow-x-auto pb-1">
        <KpiCard label="Total Grievances" value={String(totalGrievances)} />
        <KpiCard label="Pending" value={String(pendingGrievances)} />
        <KpiCard label="In Progress" value={String(inProgressGrievances)} />
        <KpiCard label="Resolved" value={String(resolvedGrievances)} />
        <KpiCard label="Reopened" value={String(reopenedGrievances)} />
        <KpiCard label="Avg Resolution" value={getAverageResolutionDays(grievances)} />
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
                  <tr key={r.grievanceId} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`grievance-detail:${r._id}`)}>
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
            text={
              latestGrievance ? (
                <>
                  Your latest grievance <strong>{latestGrievance.grievanceId}</strong>{" "}
                  {latestGrievance.aiAnalysis?.department
                    ? <>is routed to <strong>{latestGrievance.aiAnalysis.department}</strong>.</>
                    : <>has been submitted and is awaiting department routing.</>}
                  {latestGrievance.aiAnalysis?.summary && (
                    <> AI summary: <strong>{latestGrievance.aiAnalysis.summary}</strong></>
                  )}
                </>
              ) : (
                <>Submit a grievance to see AI-assisted insights here.</>
              )
            }
            disclaimer="AI-generated insight • Not an official government decision"
          />

          <SectionCard title="Grievance Timeline">
            {latestTimeline.length ? (
              <Timeline
                steps={latestTimeline.map((item: any) => ({
                  label: formatStatus(item.status),
                  desc: item.message || "Status updated",
                  time: item.timestamp
                    ? new Date(item.timestamp).toLocaleString()
                    : "Time unavailable",
                  done: true,
                  actor: item.actor?.name || "System",
                }))}
              />
            ) : (
              <p className="text-sm text-slate-500">
                No grievance activity is available yet.
              </p>
            )}
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
  const [lang, setLang] = useState("English");
  const [inputMode, setInputMode] = useState<"voice" | "text">("text");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [chooseVoiceLanguage, setChooseVoiceLanguage] = useState(false);
  const [voiceLanguageReady, setVoiceLanguageReady] = useState(false);
  const steps = ["Describe Issue", "Location", "Evidence", "Review", "Submitted"];
  const [submittedGrievance, setSubmittedGrievance] = useState<any>(null);
const [submitting, setSubmitting] = useState(false);
const [submitError, setSubmitError] = useState("");
const [aiRecommendation, setAiRecommendation] = useState<any>(null);
const [aiAnalyzing, setAiAnalyzing] = useState(false);
const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
const [aiAnalysisError, setAiAnalysisError] = useState("");
const [location, setLocation] = useState<{
  address: string;
  city: string;
  district: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
}>({
  address: "",
  city: "",
  district: "",
  state: "",
  latitude: null,
  longitude: null,
});
const [manualLocation, setManualLocation] = useState({
  address: "",
  city: "",
  district: "",
  state: "",
});
const [searchingAddress, setSearchingAddress] = useState(false);
const [locationSearchError, setLocationSearchError] = useState("");
const [locating, setLocating] = useState(false);
const [manualLocationMode, setManualLocationMode] = useState(false);
const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);
const [evidencePreviews, setEvidencePreviews] = useState<{ name: string; type: string; url: string }[]>([]);
const evidenceInputRef = useRef<HTMLInputElement>(null);
const aiAbortController = useRef<AbortController | null>(null);
const aiRequestId = useRef(0);
const locationRequestId = useRef(0);

const addEvidenceFiles = (files: FileList | File[]) => {
  const accepted = Array.from(files).filter((file) => file.size <= 25 * 1024 * 1024);
  const nextFiles = accepted.filter((file) => !evidencePreviews.some((item) => item.name === file.name));
  if (!nextFiles.length) return;
  setEvidenceFiles((current) => [...current, ...nextFiles.map((file) => file.name)]);
  setEvidencePreviews((current) => [...current, ...nextFiles.map((file) => ({ name: file.name, type: file.type, url: URL.createObjectURL(file) }))]);
};

const removeEvidenceFile = (name: string) => {
  setEvidenceFiles((files) => files.filter((file) => file !== name));
  setEvidencePreviews((files) => {
    const removed = files.find((file) => file.name === name);
    if (removed) URL.revokeObjectURL(removed.url);
    return files.filter((file) => file.name !== name);
  });
};
const speechRecognitionRef = useRef<any>(null);

const stopVoiceInput = () => {
  speechRecognitionRef.current?.stop();
  speechRecognitionRef.current = null;
  setIsListening(false);
};

const toggleVoiceInput = () => {
  if (!isListening) {
    setInputMode("voice");
    if (voiceLanguageReady) {
      startVoiceInput();
    } else {
      setChooseVoiceLanguage(true);
    }
    setVoiceError("");
    return;
  }

  stopVoiceInput();
};

const startVoiceInput = () => {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setVoiceError("Voice input is not supported in this browser. Please use Chrome or Edge.");
    setInputMode("voice");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = LANGUAGE_OPTIONS.find(([name]) => name === lang)?.[1] || "en-IN";
  recognition.onstart = () => {
    setVoiceError("");
    setIsListening(true);
  };
  recognition.onresult = (event: any) => {
    const transcript = Array.from(event.results)
      .slice(event.resultIndex)
      .map((result: any) => result[0]?.transcript || "")
      .join(" ")
      .trim();
    if (transcript) {
      const detectedLanguage = detectWrittenLanguage(transcript);
      const detectedCode = LANGUAGE_OPTIONS.find(([name]) => name === detectedLanguage)?.[1];
      if (detectedCode) recognition.lang = detectedCode;
      setLang(detectedLanguage);
      setText((current) => current ? `${current} ${transcript}` : transcript);
    }
  };
  recognition.onerror = (event: any) => {
    setIsListening(false);
    setVoiceError(event.error === "not-allowed" ? "Microphone permission was denied." : "Voice input could not start. Please try again.");
  };
  recognition.onend = () => setIsListening(false);
  speechRecognitionRef.current = recognition;
  setInputMode("voice");
  setVoiceLanguageReady(true);
  setChooseVoiceLanguage(false);
  recognition.start();
};

const handleAddressSearch = async () => {
  const query = location.address.trim();
  if (!query) return;

  setSearchingAddress(true);
  setLocationSearchError("");
  try {
    const results = await searchAddress(query);
    const result = results[0];
    if (!result) {
      setLocationSearchError("No matching location found.");
      return;
    }
    setLocation(result);
  } catch (error) {
    setLocationSearchError(error instanceof Error ? error.message : "Location search failed.");
  } finally {
    setSearchingAddress(false);
  }
};

const handleManualLocationSearch = async () => {
  const query = [manualLocation.address, manualLocation.city, manualLocation.district, manualLocation.state]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ");
  if (!query) {
    setLocationSearchError("Enter an address or area to search.");
    return;
  }

  setSearchingAddress(true);
  setLocationSearchError("");
  try {
    const results = await searchAddress(query);
    const result = results[0];
    if (!result) {
      setLocationSearchError("No matching location found.");
      return;
    }
    setLocation((current) => ({
      ...current,
      address: manualLocation.address,
      city: manualLocation.city,
      district: manualLocation.district,
      state: manualLocation.state,
      latitude: result.latitude,
      longitude: result.longitude,
    }));
  } catch (error) {
    setLocationSearchError(error instanceof Error ? error.message : "Location search failed.");
  } finally {
    setSearchingAddress(false);
  }
};

const handleMapLocationChange = async (longitude: number, latitude: number) => {
  const requestId = ++locationRequestId.current;
  setLocation((current) => ({ ...current, longitude, latitude }));
  try {
    const result = await reverseGeocode(latitude, longitude);
    if (requestId !== locationRequestId.current) return;
    setLocation((current) => ({
      ...current,
      address: result.address,
      city: result.city,
      district: result.district,
      state: result.state,
      longitude,
      latitude,
    }));
  } catch (error) {
    console.error("Reverse geocoding error:", error);
  }
};

const handleCurrentLocation = () => {
  if (!navigator.geolocation) {
    setLocationSearchError("Location services are not supported by this browser.");
    return;
  }

  setLocating(true);
  setLocationSearchError("");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      void handleMapLocationChange(coords.longitude, coords.latitude);
      setLocating(false);
    },
    (error) => {
      setLocating(false);
      setLocationSearchError(error.code === error.PERMISSION_DENIED
        ? "Location permission was denied. Please allow access or select a point manually."
        : "Could not determine your current location.");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
};

const handleManualLocation = () => {
  setManualLocationMode(true);
  setLocationSearchError("");
  setManualLocation((current) => current.address || current.city || current.district || current.state
    ? current
    : {
      address: location.address,
      city: location.city,
      district: location.district,
      state: location.state,
    });
};

const updateManualLocation = (field: "address" | "city" | "district" | "state" | "latitude" | "longitude", value: string) => {
  if (field === "latitude" || field === "longitude") return;
  setManualLocation((current) => ({
    ...current,
    [field]: value,
  }));
};

const runAIAnalysis = async () => {
  const description = text.trim();

  if (!description) {
    setAiRecommendation(null);
    setDuplicateMatches([]);
    return null;
  }

  if (typeof document !== "undefined" && document.hidden) return null;

  const token = localStorage.getItem("token");
  if (!token) {
    setAiAnalysisError("Please login again.");
    return null;
  }

  aiAbortController.current?.abort();
  const controller = new AbortController();
  aiAbortController.current = controller;
  const requestId = ++aiRequestId.current;

  try {
    setAiAnalyzing(true);
    setAiAnalysisError("");

    const title = description.slice(0, 80);

    const result = await analyzeGrievance(
      token,
      {
        title,
        description,
        category: aiRecommendation?.category,
        subcategory: aiRecommendation?.subcategory,
        location: {
          address: location.address,
          city: location.city,
          state: location.state,
        },
        evidence: evidencePreviews.map(preview => ({
          url: preview.url,
          type: preview.type.startsWith('image/') ? 'IMAGE' : preview.type.startsWith('video/') ? 'VIDEO' : 'DOCUMENT',
        })),
      },
      controller.signal
    );

    if (
      controller.signal.aborted ||
      requestId !== aiRequestId.current ||
      document.hidden
    ) return;

    setAiRecommendation(result.aiAnalysis || null);

    try {
      const duplicateResult = await checkDuplicateGrievances(
        token,
        {
          title,
          description,
          category: result.aiAnalysis?.category,
          subcategory: result.aiAnalysis?.subcategory,
          location: {
            address: location.address,
            city: location.city,
            state: location.state,
          },
        },
        controller.signal
      );

      if (
        controller.signal.aborted ||
        requestId !== aiRequestId.current ||
        document.hidden
      ) return;

      setDuplicateMatches(
        duplicateResult.hasDuplicates
          ? duplicateResult.duplicateMatches || []
          : []
      );
    } catch (duplicateError) {
      if (!controller.signal.aborted) {
        console.error("Duplicate check error:", duplicateError);
        setDuplicateMatches([]);
      }
    }

    return result.aiAnalysis || null;
  } catch (error) {
    if (controller.signal.aborted) return;

    console.error("AI analysis error:", error);
    setAiAnalysisError(
      error instanceof Error ? error.message : "Failed to analyze grievance"
    );
    return null;
  } finally {
    if (requestId === aiRequestId.current) {
      setAiAnalyzing(false);
    }
  }
};

const handleSubmit = async () => {
  try {
    setSubmitting(true);
    setSubmitError("");

    // Always perform one final analysis using the exact latest complaint
    // before creating the grievance. This makes submission the final
    // completion point for the AI analysis.
    let analysis = aiRecommendation;
    if (text.trim()) {
      analysis = await runAIAnalysis();
    }

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

      category: analysis?.category || undefined,
      subcategory: analysis?.subcategory || undefined,

      aiAnalysis: analysis || undefined,

      duplicateMatches: duplicateMatches.map((match) => ({
        grievance: match.grievance,
        similarity: match.similarity,
      })),

      location: {
        address: location.address,
        city: location.city,
        district: location.district,
        state: location.state,
        coordinates:
          location.latitude != null && location.longitude != null
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
              }
            : undefined,
      },

      evidence: evidencePreviews.map(({ name, type }) => ({
        url: name,
        type: type.startsWith("image/")
          ? "IMAGE"
          : type.startsWith("video/")
            ? "VIDEO"
            : "DOCUMENT",
      })),
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
                <button onClick={() => { stopVoiceInput(); setChooseVoiceLanguage(false); setInputMode("text"); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border font-medium transition-colors ${inputMode === "text" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}>
                  ✏ Type Complaint
                </button>
                <button onClick={toggleVoiceInput} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border font-medium transition-colors ${inputMode === "voice" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}>
                  🎙 {isListening ? "Stop Voice Input" : "Voice Input"}
                </button>
                <label className="ml-auto flex items-center gap-2 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300">
                  🌐 Language:
                  <select value={lang} onChange={(e) => { setLang(e.target.value); setVoiceLanguageReady(true); }} className="bg-transparent font-semibold text-slate-700 dark:text-slate-200 outline-none">
                    {LANGUAGE_OPTIONS.map(([name]) => <option key={name} className="theme-option">{name}</option>)}
                  </select>
                </label>
              </div>

              {inputMode === "voice" ? (
                <div className="flex flex-col items-center justify-center h-40 bg-blue-50 dark:bg-blue-950/30 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800">
                  {chooseVoiceLanguage && !isListening ? (
                    <>
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Choose your speaking language</p>
                      <select value={lang} onChange={(e) => setLang(e.target.value)} className="mt-2 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none">
                        {LANGUAGE_OPTIONS.map(([name]) => <option key={name} className="theme-option">{name}</option>)}
                      </select>
                      <button type="button" onClick={startVoiceInput} className="mt-2 rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Start Voice Input</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={toggleVoiceInput} className={`w-14 h-14 rounded-full ${isListening ? "bg-red-500 animate-pulse" : "bg-slate-400"} flex items-center justify-center text-white text-2xl mb-2`} aria-label={isListening ? "Stop voice input" : "Choose voice language"}>🎙</button>
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{isListening ? "Recording... Speak your grievance" : "Tap the Voice Input button to choose a language"}</p>
                      <p className="text-xs text-slate-400 mt-1">{isListening ? `${lang} selected • Tap to stop` : "Your speech will be added to the complaint"}</p>
                    </>
                  )}
                  {voiceError && <p className="max-w-sm px-3 text-center text-xs text-red-500">{voiceError}</p>}
                </div>
              ) : (
                <textarea
                  value={text}
                  onChange={e => {
                    setText(e.target.value);
                    if (e.target.value.trim()) setLang(detectWrittenLanguage(e.target.value));
                  }}
                  rows={6}
                  placeholder="Describe your grievance in your own words... (e.g., There is a large pothole near the main gate that has been there for 5 days)"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none outline-none focus:border-blue-400 focus:bg-slate-50 dark:focus:bg-slate-800"
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
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/40 dark:to-blue-950/40 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-purple-600">✦</span>
                <span className="text-sm font-semibold text-purple-800 dark:text-purple-300">AI Analysis</span>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded-full font-semibold">ON REQUEST</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">Analyze your complaint when you are ready. Submission also runs analysis automatically.</p>
              <button
                type="button"
                onClick={() => void runAIAnalysis()}
                disabled={aiAnalyzing || !text.trim()}
                className="mb-3 w-full rounded-md bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiAnalyzing ? "Analyzing..." : "Analyze with AI"}
              </button>

              <div className="space-y-2">
                {[
                  { label: "Category", value: aiRecommendation?.category || "Analyzing..." },
                  { label: "Subcategory", value: aiRecommendation?.subcategory || "Analyzing..." },
                  {
                    label: "AI Confidence",
                    value: aiRecommendation?.confidence != null
                      ? `${Math.round(aiRecommendation.confidence * 100)}%`
                      : "Analyzing...",
                  },
                  {
                    label: "Priority Score",
                    value: aiRecommendation?.priorityScore != null
                      ? `${aiRecommendation.priorityScore} / 100`
                      : "Analyzing...",
                  },
                  { label: "Department", value: aiRecommendation?.department || "Analyzing..." },
                  { label: "Duplicate Matches", value: duplicateMatches.length ? `${duplicateMatches.length} found` : "None found" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right max-w-40">{value}</span>
                  </div>
                ))}
              </div>

              {aiRecommendation?.summary && (
                <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-900">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Summary</p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{aiRecommendation.summary}</p>
                </div>
              )}

              {aiAnalysisError && (
                <p className="text-[10px] text-red-500 mt-2">{aiAnalysisError}</p>
              )}

              <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">ⓘ AI-extracted • Review before submitting</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">💬 AI Assistant</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">"Tell us what happened. You can describe the problem naturally in your own language."</p>
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
                <PrimaryBtn onClick={() => { if (!locating) handleCurrentLocation(); }} className={`text-xs py-1.5 ${locating ? "opacity-60" : ""}`}>
                  {locating ? "Locating..." : "◎ Use My Current Location"}
                </PrimaryBtn>
                <SecondaryBtn onClick={handleManualLocation} className={`text-xs py-1.5 ${manualLocationMode ? "ring-2 ring-blue-400" : ""}`}>
                  📍 {manualLocationMode ? "Manual Location Active" : "Select Location Manually"}
                </SecondaryBtn>
              </div>
              <div className="relative mb-3">
                <input
                  type="text"
                  placeholder="Search area, street, landmark..."
                  value={location.address}
                  onChange={(e) =>
                    setLocation((current) => ({
                      ...current,
                      address: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleAddressSearch();
                    }
                  }}
                  className="w-full pl-8 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                <button type="button" onClick={() => void handleAddressSearch()} disabled={searchingAddress} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-[#0f2b4e] px-2.5 py-1 text-xs text-white disabled:opacity-50">
                  {searchingAddress ? "Searching..." : "Search"}
                </button>
              </div>
              {locationSearchError && <p className="mb-2 text-xs text-red-500">{locationSearchError}</p>}
              <MapSvg
                mode="markers"
                height={320}
                showLocationPicker={true}
                allowMapClick={!manualLocationMode}
                location={location}
                onLocationChange={handleMapLocationChange}
              />
              <p className="text-xs text-slate-500 mt-2">
                {manualLocationMode ? "Enter the location details below, or adjust the coordinates." : "Click the map or drag the pin to adjust the exact location"}
              </p>
              {manualLocationMode && (
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                  {[
                    ["address", "Address"],
                    ["city", "City/Village"],
                    ["district", "District"],
                    ["state", "State"],
                  ].map(([field, label]) => (
                    <label key={field} className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      {label}
                      <input
                        type={field === "latitude" || field === "longitude" ? "number" : "text"}
                        step="any"
                        value={manualLocation[field as keyof typeof manualLocation] ?? ""}
                        onChange={(e) => updateManualLocation(field as "address" | "city" | "district" | "state" | "latitude" | "longitude", e.target.value)}
                        className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-blue-400"
                      />
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => void handleManualLocationSearch()}
                    disabled={searchingAddress}
                    className="col-span-2 rounded-md bg-[#0f2b4e] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1a3a5c] disabled:opacity-60"
                  >
                    {searchingAddress ? "Finding Location..." : "Find on Map and Update Location"}
                  </button>
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Selected Location">
            <div className="space-y-3">
              {[
                { label: "Location", value: location.address || "Not selected" },
                { label: "Latitude", value: location.latitude != null ? location.latitude.toFixed(6) : "Not captured" },
                { label: "Longitude", value: location.longitude != null ? location.longitude.toFixed(6) : "Not captured" },
                { label: "City/Village", value: location.city || "Not captured" },
                { label: "District", value: location.district || "Not captured" },
                { label: "State", value: location.state || "Not captured" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
                  <p className="text-sm text-slate-800 font-medium">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-700 font-semibold mb-1">⚡ AI Route Prediction</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 dark:text-slate-500">
                {aiRecommendation?.department
                  ? <>Based on the current complaint analysis, this will likely route to <strong>{aiRecommendation.department}</strong>.</>
                  : "AI routing will appear after analysis."}
              </p>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Step 3 — Evidence */}
      {step === 3 && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <SectionCard title="Upload Evidence">
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); addEvidenceFiles(event.dataTransfer.files); }}
                onClick={() => evidenceInputRef.current?.click()}
              >
                <input
                  ref={evidenceInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  multiple
                  className="hidden"
                  onChange={(event) => { if (event.target.files) addEvidenceFiles(event.target.files); event.target.value = ""; }}
                />
                <div className="text-4xl mb-3">📎</div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Drag & drop files here</p>
                <p className="text-xs text-slate-400 mt-1">or</p>
                <button type="button" onClick={(event) => { event.stopPropagation(); evidenceInputRef.current?.click(); }} className="mt-3 px-4 py-2 bg-[#0f2b4e] text-white text-sm rounded-lg font-medium hover:bg-[#1a3a5c]">Upload Evidence</button>
                <p className="text-xs text-slate-400 mt-2">Photos, Videos, Documents • Max 25MB per file</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                {evidencePreviews.length ? (
                  evidencePreviews.map(({ name, type, url }) => (
                    <div key={name} className="bg-slate-100 rounded-lg h-24 flex flex-col items-center justify-center text-slate-500 border border-slate-200 relative group cursor-pointer hover:bg-slate-50 dark:bg-slate-900">
                      {type.startsWith("image/") ? <img src={url} alt={name} className="h-12 max-w-20 object-cover rounded" /> : <span className="text-2xl">{type.startsWith("video/") ? "🎥" : "📄"}</span>}
                      <span className="text-xs mt-1 text-slate-500 dark:text-slate-500">{name}</span>
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); removeEvidenceFile(name); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] hidden group-hover:flex items-center justify-center"
                      >×</button>
                    </div>
                  ))
                ) : (
                  <p className="col-span-3 text-xs text-slate-400 text-center py-4">
                    No evidence attached yet.
                  </p>
                )}
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
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {aiRecommendation?.subcategory || aiRecommendation?.category || "No issue classified yet"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Visual Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${Math.round((aiRecommendation?.confidence || 0) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-green-700">
                      {aiRecommendation?.confidence != null
                        ? `${Math.round(aiRecommendation.confidence * 100)}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Severity Assessment</p>
                  <p className="text-sm font-semibold text-amber-700">
                    {aiRecommendation?.priorityScore != null
                      ? aiRecommendation.priorityScore >= 70
                        ? "High"
                        : aiRecommendation.priorityScore >= 40
                          ? "Moderate"
                          : "Low"
                      : "Not assessed"}
                  </p>
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
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{text.trim() || "No complaint entered."}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Category", value: aiRecommendation?.category || "Not analyzed" },
                    { label: "Subcategory", value: aiRecommendation?.subcategory || "Not analyzed" },
                    {
                      label: "Priority",
                      value: aiRecommendation?.priorityScore != null
                        ? `${aiRecommendation.priorityScore} / 100`
                        : "Not analyzed",
                    },
                    { label: "Department", value: aiRecommendation?.department || "Not analyzed" },
                    { label: "Location", value: location.address || "Not selected" },
                    {
                      label: "Confidence",
                      value: aiRecommendation?.confidence != null
                        ? `${Math.round(aiRecommendation.confidence * 100)}%`
                        : "Not analyzed",
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Attachments</p>
                  <div className="flex gap-2 flex-wrap">
                    {evidenceFiles.length ? evidenceFiles.map((file) => (
                      <div key={file} className="bg-slate-100 rounded px-2 py-1 text-xs text-slate-600 dark:text-slate-400">{file}</div>
                    )) : (
                      <span className="text-xs text-slate-400">No evidence attached</span>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Duplicate Warning */}
            {duplicateMatches.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-lg mt-0.5">⚠</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Possible Similar Grievance Found</p>
                  <div className="mt-2 bg-white rounded-lg border border-amber-100 p-3">
                    <p className="font-mono text-xs text-blue-600 font-semibold">
  {duplicateMatches[0]?.grievance}
</p>
                    <p className="text-sm text-slate-700 mt-0.5">
                      {duplicateMatches[0]?.title || "Similar grievance detected"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500 dark:text-slate-500">Similarity:</span>
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden max-w-24"><div className="h-full bg-amber-500 rounded-full" style={{
  width: `${Math.round(
    (duplicateMatches[0]?.similarity || 0) * 100
  )}%`,
}} /></div>
                      <span className="text-xs font-bold text-amber-700">
  {Math.round((duplicateMatches[0]?.similarity || 0) * 100)}%
</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() =>
                        duplicateMatches[0]?.grievance &&
                        navigate(`grievance-detail:${duplicateMatches[0].grievance}`)
                      }
                      className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50"
                    >
                      View Similar Grievance
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicateMatches([])}
                      className="text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 dark:bg-slate-900"
                    >
                      Continue Anyway
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}</div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-800 mb-3">✦ AI Summary</p>
              <div className="space-y-2 text-xs">
                {[
                  { k: "Summary", v: aiRecommendation?.summary || "AI analysis will appear as you type." },
                  { k: "Category", v: aiRecommendation?.category || "Not analyzed" },
                  { k: "Priority", v: aiRecommendation?.priorityScore != null ? `${aiRecommendation.priorityScore} / 100` : "Not analyzed" },
                  { k: "Department", v: aiRecommendation?.department || "Not analyzed" },
                  { k: "Confidence", v: aiRecommendation?.confidence != null ? `${Math.round(aiRecommendation.confidence * 100)}%` : "Not analyzed" },
                  { k: "Similar", v: duplicateMatches.length ? `${duplicateMatches.length} found` : "None found" },
                ].map(({ k, v }) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-500">{k}</span>
                    <span className="font-semibold text-slate-800 text-right max-w-24">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full mb-3 px-4 py-2 rounded-lg bg-purple-50 border border-purple-100 text-purple-700 text-xs font-semibold text-center">
              {aiAnalyzing
                ? "✦ AI is analyzing your complaint..."
                : aiRecommendation
                  ? "✓ AI analysis updated"
                  : text.trim()
                    ? "✦ AI analysis will start automatically"
                    : "Start typing to begin AI analysis"}
            </div>

            <SectionCard title="AI Routing Recommendation">
  <div className="space-y-2 text-xs">
    <div>
      <p className="text-slate-400 dark:text-slate-500">
        Department
      </p>
      <p className="font-semibold text-slate-800 dark:text-slate-200">
        {aiRecommendation?.department || "Not analyzed yet"}
      </p>
    </div>

    <div>
      <p className="text-slate-400 dark:text-slate-500">
        Sub-Department
      </p>
      <p className="font-semibold text-slate-800 dark:text-slate-200">
        {aiRecommendation?.subcategory || "Not analyzed yet"}
      </p>
    </div>

    <div>
      <p className="text-slate-400 dark:text-slate-500">
        Confidence
      </p>

      <div className="flex items-center gap-2 mt-0.5">
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{
              width: `${
                aiRecommendation?.confidence != null
                  ? aiRecommendation.confidence * 100
                  : 0
              }%`,
            }}
          />
        </div>

        <span className="font-bold text-blue-700">
          {aiRecommendation?.confidence != null
            ? `${Math.round(aiRecommendation.confidence * 100)}%`
            : "N/A"}
        </span>
      </div>
    </div>
  </div>

  <p className="text-[10px] text-slate-400 mt-3">
    ⓘ AI recommendation only
  </p>
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
                { label: "Status", value: submittedGrievance?.status ? formatStatus(submittedGrievance.status) : "Submitted" },
                {
                  label: "Expected SLA",
                  value: submittedGrievance?.sla?.dueAt
                    ? new Date(submittedGrievance.sla.dueAt).toLocaleString()
                    : "Not assigned",
                },
                { label: "Assigned Department", value: submittedGrievance?.aiAnalysis?.department || aiRecommendation?.department || "Processing" },
                { label: "AI Priority Score", value: submittedGrievance?.aiAnalysis?.priorityScore != null ? `${submittedGrievance.aiAnalysis.priorityScore} / 100` : "Processing" },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex justify-between items-center pb-2 border-b border-slate-50 last:border-0">
                  <span className="text-slate-500 dark:text-slate-500">{label}</span>
                  <span className={`font-semibold text-slate-900 ${mono ? "font-mono text-blue-600" : ""}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <PrimaryBtn
  onClick={() =>
    navigate(
      `grievance-detail:${submittedGrievance?._id}`
    )
  }
>
  Track Grievance
</PrimaryBtn>
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
  const [messages, setMessages] = useState<any[]>([]);
  const [rating, setRating] = useState(0);
const [feedback, setFeedback] = useState("");
const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
const [feedbackMessage, setFeedbackMessage] = useState("");
  const [grievance, setGrievance] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<{ _id?: string; name: string } | null>(null);

useEffect(() => {
  getCurrentUser().then((user) => setCurrentUser(user));
}, []);

const handleSendMessage = async () => {
  if (!message.trim() || !grievance?._id) {
    return;
  }

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Authentication token not found.");
    }

    console.log("Sending message:", message);

    const response = await sendGrievanceMessage(
      token,
      grievance._id,
      message.trim()
    );

    console.log("Message sent:", response);

    setMessage("");

    const data = await getGrievanceById(token, grievance._id);
    const updatedGrievance = data.grievance || data;
    setGrievance(updatedGrievance);
    setMessages(updatedGrievance.messages || data.messages || []);
  } catch (err) {
    console.error("Failed to send message:", err);
    alert(
      err instanceof Error
        ? err.message
        : "Failed to send message"
    );
  }
};

const getAIPriority = (score?: number) => {
  if (score == null) return "N/A";
  if (score >= 85) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
};
const aiPriority = getAIPriority(
  grievance?.aiAnalysis?.priorityScore
);
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

      const loadedGrievance = data.grievance || data;
      setGrievance(loadedGrievance);
      setMessages(loadedGrievance.messages || data.messages || []);
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
  text={
    grievance.aiAnalysis?.summary ||
    grievance.description ||
    "No summary available."
  }
  disclaimer="AI-generated summary • Verify with official records"
/>
            {grievance?.aiAnalysis && (
  <SectionCard title="AI Analysis">
    <div className="grid grid-cols-2 gap-4">

      <div>
        <p className="text-xs text-slate-400">Category</p>
        <p className="font-medium text-slate-800">
          {grievance.aiAnalysis.category || "Not available"}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-400">Subcategory</p>
        <p className="font-medium text-slate-800">
          {grievance.aiAnalysis.subcategory || "Not available"}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-400">Department</p>
        <p className="font-medium text-slate-800">
          {grievance.aiAnalysis.department || "Not assigned"}
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-400">Priority Score</p>
        <p className="font-medium text-slate-800">
          {grievance.aiAnalysis.priorityScore ?? "Not available"}/100
        </p>
      </div>

      <div>
        <p className="text-xs text-slate-400">Confidence</p>
        <p className="font-medium text-slate-800">
          {grievance.aiAnalysis.confidence != null
            ? `${Math.round(grievance.aiAnalysis.confidence * 100)}%`
            : "Not available"}
        </p>
      </div>
      <div>
  <p className="text-xs text-slate-400">
    AI Priority Recommendation
  </p>
  <p className="font-semibold text-slate-800">
    {aiPriority}
  </p>
</div>

    </div>

    {grievance.aiAnalysis.priorityReason && (
      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-400 mb-1">
          AI Priority Reason
        </p>

        <p className="text-sm text-slate-700">
          {grievance.aiAnalysis.priorityReason}
        </p>
      </div>
    )}
  </SectionCard>
)}

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
                
                {messages.map((msg: any, i: number) => {
  const self =
    msg.sender?._id === currentUser?._id ||
    msg.sender === currentUser?._id ||
    msg.sender?.name === currentUser?.name ||
    msg.sender === "You";

  const name =
    msg.sender?.name ||
    msg.senderName ||
    (self ? currentUser?.name : "Officer");

  const text =
    msg.message ||
    msg.text ||
    "";

  const time = msg.createdAt
    ? new Date(msg.createdAt).toLocaleString()
    : msg.time || "Just now";

  return (
    <div
      key={msg._id || i}
      className={`flex gap-3 ${
        self ? "flex-row-reverse" : ""
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          self
            ? "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-600"
        }`}
      >
        {name
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)}
      </div>

              <div
                className={`max-w-xs ${
                  self ? "items-end" : "items-start"
                } flex flex-col`}
              >
                <div
                  className={`px-3 py-2 rounded-xl text-sm ${
                    self
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {text}
                </div>

                <p className="text-[10px] text-slate-400 mt-1">
                  {name} • {time}
                </p>
              </div>
            </div>
          );
        })}
                {(grievance.timeline || []).length ? (
                  [...(grievance.timeline || [])].reverse().map((item: any, i: number) => {
                    const name = item.actor?.name || "System";
                    const self = item.actor?._id === grievance.citizen?._id;
                    return (
                      <div key={i} className={`flex gap-3 ${self ? "flex-row-reverse" : ""}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${self ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600 dark:text-slate-400 dark:text-slate-500"}`}>
                          {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className={`max-w-xs ${self ? "items-end" : "items-start"} flex flex-col`}>
                          <div className={`px-3 py-2 rounded-xl text-sm ${self ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800 dark:text-slate-200"}`}>
                            {item.message || formatStatus(item.status)}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {name} • {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Time unavailable"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500">No communication history is available yet.</p>
                )}
              </div>
              <div className="flex gap-2 border-t border-slate-100 pt-4">
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a reply..." className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400" />
                <PrimaryBtn onClick={handleSendMessage}>
  Send
</PrimaryBtn>
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
              text={
                <>
                  <span className="text-slate-500 font-semibold">
                    {grievance.resolution?.evidence?.length ? "✓" : "⏳"}
                  </span>{" "}
                  {grievance.resolution?.evidence?.length
                    ? `${grievance.resolution.evidence.length} resolution evidence item(s) uploaded.`
                    : "Resolution evidence has not been uploaded yet."}
                  <br />
                  AI Confidence:{" "}
                  <strong>
                    {grievance.aiAnalysis?.confidence != null
                      ? `${Math.round(grievance.aiAnalysis.confidence * 100)}%`
                      : "Not available"}
                  </strong>
                </>
              }
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
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getMyGrievances(token);
        setGrievances(data.grievances || []);
      } catch (error) {
        console.error("Failed to load grievance notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const notifs = grievances
    .flatMap((grievance) =>
      (grievance.timeline || []).map((item: any) => ({
        icon:
          item.status === "RESOLVED" || item.status === "CLOSED"
            ? "✓"
            : item.status === "REOPENED"
              ? "⚠"
              : "🔔",
        title: `${grievance.grievanceId} • ${formatStatus(item.status)}`,
        desc: item.message || "Grievance status updated.",
        time: item.timestamp
          ? new Date(item.timestamp).toLocaleString()
          : "Time unavailable",
        unread: false,
        createdAt: item.timestamp || grievance.createdAt,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Notifications" subtitle="Stay updated on your grievances and platform activity" />
      <SectionCard>
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {loading ? (
            <p className="py-6 text-sm text-slate-500">Loading notifications...</p>
          ) : notifs.length ? notifs.map((n, i) => (
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
          )) : (
            <p className="py-6 text-sm text-slate-500">No grievance notifications yet.</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}