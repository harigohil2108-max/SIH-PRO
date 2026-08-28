import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import {
  KpiCard, SectionCard, AiInsightCard, PageHeader, PrimaryBtn, SecondaryBtn, GhostBtn,
  StatusBadge, PriorityBadge, Timeline, ChartLegend, FilterChip, SlaIndicator, AiBadge,
} from "../components/Shared";
import MapSvg from "../components/MapSvg";
import { getCurrentUser } from "./services/authService";
import {
  getMyGrievances,
  routeGrievanceDepartment,
} from "../services/grievanceService";
import {
  getDepartments,
} from "../services/departmentService";
import {
  getAllUsers,
} from "./services/userService";

import { exportGrievancesToCSV, exportGrievancesToPDF } from "../utils/exportUtils";


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

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
export function AdminDashboard({
  navigate,
}: {
  navigate: (s: string) => void;
}) {
  const [currentUser, setCurrentUser] = useState<{
    name: string;
  } | null>(null);

  const [grievances, setGrievances] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentUser()
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found");

        const [grievanceResponse, departmentResponse] = await Promise.all([
          getMyGrievances(token),
          getDepartments(token),
        ]);

        const grievanceItems = Array.isArray(grievanceResponse)
          ? grievanceResponse
          : Array.isArray(grievanceResponse?.grievances)
          ? grievanceResponse.grievances
          : Array.isArray(grievanceResponse?.data)
          ? grievanceResponse.data
          : [];

        const departmentItems = Array.isArray(departmentResponse?.departments)
          ? departmentResponse.departments
          : [];

        setGrievances(grievanceItems);
        setDepartments(departmentItems);
      } catch (err) {
        console.error("Failed to load admin dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const totalGrievances = grievances.length;

  const activeGrievances = grievances.filter(
    (g) => !["RESOLVED", "CLOSED", "REJECTED"].includes(g.status)
  ).length;

  const resolvedGrievances = grievances.filter(
    (g) => g.status === "RESOLVED" || g.status === "CLOSED"
  ).length;

  const resolutionRate =
    totalGrievances > 0
      ? ((resolvedGrievances / totalGrievances) * 100).toFixed(1)
      : "0.0";

  const slaBreached = grievances.filter((g) => {
    if (g?.sla?.breached === true) return true;
    if (!g?.sla?.dueAt) return false;
    return new Date(g.sla.dueAt).getTime() < Date.now();
  }).length;

  const slaWithDeadline = grievances.filter((g) => g?.sla?.dueAt);

  const slaCompliant =
    slaWithDeadline.length > 0
      ? (((slaWithDeadline.length - slaBreached) / slaWithDeadline.length) * 100).toFixed(1)
      : "0.0";

  const resolvedWithDates = grievances.filter(
    (g) =>
      (g.status === "RESOLVED" || g.status === "CLOSED") &&
      g.createdAt &&
      (g?.resolution?.resolvedAt || g.updatedAt)
  );

  let averageResolutionDays = 0;
  if (resolvedWithDates.length > 0) {
    const totalResolutionTime = resolvedWithDates.reduce((total, grievance) => {
      const created = new Date(grievance.createdAt).getTime();
      const resolved = new Date(
        grievance?.resolution?.resolvedAt || grievance.updatedAt
      ).getTime();

      if (Number.isNaN(created) || Number.isNaN(resolved) || resolved < created) {
        return total;
      }
      return total + (resolved - created) / (1000 * 60 * 60 * 24);
    }, 0);

    averageResolutionDays = totalResolutionTime / resolvedWithDates.length;
  }

  const departmentNames = new Set<string>();
  grievances.forEach((g) => {
    if (!g.department) return;
    if (typeof g.department === "string") {
      departmentNames.add(g.department);
      return;
    }
    if (g.department.name) {
      departmentNames.add(g.department.name);
    } else if (g.department.code) {
      departmentNames.add(g.department.code);
    }
  });

  const departmentsActive = departmentNames.size;

  const categoryCounts: Record<string, number> = {};
  grievances.forEach((g) => {
    const category = g.category?.trim() || "Uncategorized";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const categoryColors = [
    "#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"
  ];

  const catAdminDynamic = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([name, value], index) => ({
      name,
      value,
      color: categoryColors[index % categoryColors.length],
    }));

  const departmentMap: Record<string, any[]> = {};
  departments.forEach((department) => {
    const key = department._id || department.code || department.name;
    departmentMap[key] = [];
  });
  departmentMap["__UNASSIGNED__"] = [];

  grievances.forEach((g) => {
    let matchedKey: string | null = null;
    const grievanceDepartment = g.department;

    if (grievanceDepartment) {
      const departmentId =
        typeof grievanceDepartment === "string"
          ? grievanceDepartment
          : grievanceDepartment?._id;

      const departmentName =
        typeof grievanceDepartment === "object" ? grievanceDepartment?.name : null;

      const departmentCode =
        typeof grievanceDepartment === "object" ? grievanceDepartment?.code : null;

      const matchedDepartment = departments.find((department) => {
        return (
          String(department._id) === String(departmentId) ||
          department.name === departmentName ||
          department.code === departmentCode ||
          department.name === grievanceDepartment ||
          department.code === grievanceDepartment
        );
      });

      if (matchedDepartment) {
        matchedKey = matchedDepartment._id || matchedDepartment.code || matchedDepartment.name;
      }
    }

    if (matchedKey) {
      departmentMap[matchedKey].push(g);
    } else {
      departmentMap["__UNASSIGNED__"].push(g);
    }
  });

  const depts = Object.entries(departmentMap)
    .filter(([key, items]) => key !== "__UNASSIGNED__" || items.length > 0)
    .map(([key, items]) => {
      const department = departments.find(
        (d) => String(d._id) === String(key) || d.code === key || d.name === key
      );

      const name = key === "__UNASSIGNED__" ? "Unassigned / Needs Routing" : department?.name || key;
      const open = items.filter(
        (g) => !["RESOLVED", "CLOSED", "REJECTED"].includes(g.status)
      ).length;

      const resolved = items.filter(
        (g) => g.status === "RESOLVED" || g.status === "CLOSED"
      ).length;

      const withSla = items.filter((g) => g?.sla?.dueAt);
      const breached = withSla.filter((g) => {
        if (g?.sla?.breached === true) return true;
        return new Date(g.sla.dueAt).getTime() < Date.now();
      }).length;

      const sla =
        withSla.length > 0
          ? Math.round(((withSla.length - breached) / withSla.length) * 100)
          : 0;

      const resolvedItems = items.filter(
        (g) =>
          (g.status === "RESOLVED" || g.status === "CLOSED") &&
          g.createdAt &&
          (g?.resolution?.resolvedAt || g.updatedAt)
      );

      let avgDays = 0;
      if (resolvedItems.length > 0) {
        const totalDays = resolvedItems.reduce((total, g) => {
          const created = new Date(g.createdAt).getTime();
          const resolved = new Date(g?.resolution?.resolvedAt || g.updatedAt).getTime();
          if (Number.isNaN(created) || Number.isNaN(resolved) || resolved < created) return total;
          return total + (resolved - created) / (1000 * 60 * 60 * 24);
        }, 0);
        avgDays = totalDays / resolvedItems.length;
      }

      return {
        name,
        open,
        resolved,
        sla,
        avg: avgDays > 0 ? `${avgDays.toFixed(1)} days` : "—",
      };
    });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();

  const dynamicTrendData = Array.from({ length: 12 }, (_, index) => {
    const monthIndex = (now.getMonth() - 11 + index + 12) % 12;
    const year = now.getFullYear() - (monthIndex > now.getMonth() ? 1 : 0);

    const submitted = grievances.filter((g) => {
      if (!g.createdAt) return false;
      const date = new Date(g.createdAt);
      return date.getMonth() === monthIndex && date.getFullYear() === year;
    }).length;

    const resolved = grievances.filter((g) => {
      const resolvedDate =
        g?.resolution?.resolvedAt ||
        (g.status === "RESOLVED" || g.status === "CLOSED" ? g.updatedAt : null);
      if (!resolvedDate) return false;
      const date = new Date(resolvedDate);
      return date.getMonth() === monthIndex && date.getFullYear() === year;
    }).length;

    return {
      month: monthNames[monthIndex],
      submitted,
      resolved,
    };
  });

  const activities: any[] = [];
  grievances.forEach((g) => {
    if (Array.isArray(g.timeline)) {
      g.timeline.forEach((event: any) => {
        activities.push({
          label: event.status || "Grievance Activity",
          desc: event.message || g.title || g.grievanceId,
          time: event.timestamp || g.updatedAt || g.createdAt,
          timestamp: new Date(event.timestamp || g.updatedAt || g.createdAt).getTime(),
        });
      });
    }
  });

  const recentActivities = activities
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const highestCategory = catAdminDynamic.length > 0 ? catAdminDynamic[0] : null;
  const governanceInsight = highestCategory
    ? `${highestCategory.name} currently has the highest number of grievances with ${highestCategory.value} cases.`
    : "No grievance category data is available yet.";

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title={`Welcome back, ${currentUser?.name || "Administrator"}`}
        subtitle="Admin Command Center • Nivara Core Management Platform"
      >
        <SecondaryBtn onClick={() => navigate("reports")}>
          Generate Report
        </SecondaryBtn>
        <PrimaryBtn onClick={() => navigate("all-grievances")}>
          <span>+</span> System Overview
        </PrimaryBtn>
      </PageHeader>

      <div className="flex gap-2 flex-wrap">
        {[
          // { label: "🗺 Geographic Intelligence", screen: "geo-intelligence" },
          { label: "📋 Audit Logs", screen: "audit-logs" },
          { label: "📊 Reports", screen: "reports" },
        ].map(({ label, screen }) => (
          <button
            key={screen}
            onClick={() => navigate(screen)}
            className="px-3 py-1.5 text-xs border border-slate-200 bg-white rounded-lg text-slate-700 hover:border-blue-400 hover:text-blue-700 transition-colors font-medium shadow-sm"
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-500">
          Loading dashboard data...
        </div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-red-600">
          {error}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          <KpiCard label="Total Grievances" value={String(totalGrievances)} trend="Live" trendUp={true} />
          <KpiCard label="Active Cases" value={String(activeGrievances)} trend="Live" trendUp={true} />
          <KpiCard label="SLA Compliance" value={`${slaCompliant}%`} trend="Live" trendUp={Number(slaCompliant) >= 90} />
          <KpiCard label="Resolution Rate" value={`${resolutionRate}%`} trend="Live" trendUp={Number(resolutionRate) >= 70} />
          <KpiCard
            label="Avg Resolution"
            value={averageResolutionDays > 0 ? `${averageResolutionDays.toFixed(1)} days` : "—"}
            trend="Live"
            trendUp={averageResolutionDays < 3}
          />
          <KpiCard label="Departments Active" value={String(departmentsActive)} trend="Live" trendUp={true} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <SectionCard
            title="Grievance Volume Overview"
            subtitle="Monthly breakdown of submitted issues vs resolved resolutions"
            extra={
              <button className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-50 dark:bg-slate-900">
                Last 12 months ∨
              </button>
            }
          >
            <ChartLegend
              items={[
                { color: "#2563eb", label: "Submitted" },
                { color: "#16a34a", label: "Resolved" },
              ]}
            />
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dynamicTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="submitted" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resolved" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </SectionCard>

          <SectionCard
            title="Department Performance SLA Report"
            extra={
              <GhostBtn onClick={() => navigate("departments")}>
                View all departments
              </GhostBtn>
            }
          >
            {depts.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No department data available.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
                    {["Department", "Open Cases", "Resolved", "SLA Compliance", "Avg Resolution", "Action"].map(
                      (heading) => (
                        <th key={heading} className="text-left font-medium pb-2 pr-3">
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {depts.map((department) => (
                    <tr key={department.name} className="hover:bg-slate-50 dark:bg-slate-900">
                      <td className="py-2.5 pr-3 font-medium text-slate-800 text-sm">
                        {department.name}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{department.open}</td>
                      <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-400">{department.resolved}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            department.sla >= 90
                              ? "bg-green-100 text-green-700"
                              : department.sla >= 80
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {department.sla}%
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600 text-xs">{department.avg}</td>
                      <td className="py-2.5">
                        <button
                          onClick={() => navigate("departments")}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Grievances by Category">
            {catAdminDynamic.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No category data available.
              </div>
            ) : (
              <div className="space-y-2.5">
                {catAdminDynamic.map((category) => (
                  <div key={category.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: category.color }} />
                        <span className="text-slate-600 dark:text-slate-400">{category.name}</span>
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{category.value}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${totalGrievances > 0 ? (category.value / totalGrievances) * 100 : 0}%`,
                          background: category.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <AiInsightCard
            title="AI-Assisted Governance Insights"
            text={<>{governanceInsight}</>}
            disclaimer="Dashboard insight generated from current grievance data."
          />

          <SectionCard title="Recent Administrative Activity">
            {recentActivities.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">
                No recent activity available.
              </div>
            ) : (
              <Timeline
                steps={recentActivities.map((activity) => ({
                  label: activity.label,
                  desc: activity.desc,
                  time: new Date(activity.time).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                  }),
                  done: true,
                }))}
              />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─── All Grievances (With Active Routing & Exports) ───────────────────────────
export function AllGrievances({
  navigate,
}: {
  navigate: (s: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [grievances, setGrievances] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ─── Routing Modal States ───
  const [routingGrievance, setRoutingGrievance] = useState<any>(null);
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("MEDIUM");
  const [routingLoading, setRoutingLoading] = useState(false);

  const toggleChip = (chip: string) => {
    setActiveChips((previous) =>
      previous.includes(chip)
        ? previous.filter((item) => item !== chip)
        : [...previous, chip]
    );
  };

  const chips = [
    "Unassigned / Needs Routing",
    "Critical",
    "High",
    "SLA Breached",
    "Duplicate",
    "Water Supply",
    "Roads",
    "Escalated",
  ];

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found");

      const [grievanceRes, deptRes] = await Promise.all([
        getMyGrievances(token),
        getDepartments(token),
      ]);

      const items = Array.isArray(grievanceRes)
        ? grievanceRes
        : Array.isArray(grievanceRes?.grievances)
        ? grievanceRes.grievances
        : Array.isArray(grievanceRes?.data)
        ? grievanceRes.data
        : [];

      const deptList = Array.isArray(deptRes?.departments) ? deptRes.departments : [];

      setGrievances(items);
      setDepartments(deptList);
    } catch (err) {
      console.error("Failed to load grievances:", err);
      setError(err instanceof Error ? err.message : "Failed to load grievances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRouteSubmit = async () => {
    if (!selectedDeptId || !routingGrievance) return;
    try {
      setRoutingLoading(true);
      const token = localStorage.getItem("token") || "";
      await routeGrievanceDepartment(
        token,
        routingGrievance._id || routingGrievance.grievanceId,
        selectedDeptId,
        selectedPriority
      );
      alert("Grievance successfully assigned to department!");
      setRoutingGrievance(null);
      setSelectedDeptId("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to route grievance");
    } finally {
      setRoutingLoading(false);
    }
  };

  const getDepartmentName = (grievance: any) => {
    if (!grievance.department) return null;
    if (typeof grievance.department === "string") return grievance.department;
    return grievance.department.name || grievance.department.code || null;
  };

  const getOfficerName = (grievance: any) => {
    if (!grievance.assignedOfficer) return "Unassigned";
    if (typeof grievance.assignedOfficer === "string") return grievance.assignedOfficer;
    return grievance.assignedOfficer.name || "Unassigned";
  };

  const getLocation = (grievance: any) => {
    const location = grievance.location;
    if (!location) return "Not provided";
    return location.city || location.district || location.state || location.address || "Not provided";
  };

  const getAiScore = (grievance: any) => {
    const score = grievance?.aiAnalysis?.priorityScore;
    return typeof score === "number" ? score : null;
  };

  const getSlaStatus = (grievance: any) => {
    if (grievance?.sla?.breached) return "breach" as const;
    if (!grievance?.sla?.dueAt) return "ok" as const;
    const dueAt = new Date(grievance.sla.dueAt).getTime();
    if (Number.isNaN(dueAt)) return "ok" as const;
    const remaining = dueAt - Date.now();
    if (remaining <= 0) return "breach" as const;
    if (remaining <= 24 * 60 * 60 * 1000) return "warn" as const;
    return "ok" as const;
  };

  const getSlaRemaining = (grievance: any) => {
    const slaStatus = getSlaStatus(grievance);
    if (slaStatus === "breach") return "Breached";
    if (!grievance?.sla?.dueAt) return "Not set";
    const dueAt = new Date(grievance.sla.dueAt).getTime();
    if (Number.isNaN(dueAt)) return "Not set";
    const difference = dueAt - Date.now();
    if (difference <= 0) return "Breached";

    const totalMinutes = Math.floor(difference / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (date: string) => {
    if (!date) return "Unknown";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Unknown";
    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const matchesSearch = (grievance: any) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const values = [
      grievance.grievanceId,
      grievance._id,
      grievance.title,
      grievance.description,
      grievance.category,
      grievance.subcategory,
      getDepartmentName(grievance),
      getOfficerName(grievance),
      getLocation(grievance),
      grievance.status,
      grievance.priority,
    ];
    return values.some((value) => String(value || "").toLowerCase().includes(query));
  };

  const matchesQuickFilters = (grievance: any) => {
    if (activeChips.length === 0) return true;
    return activeChips.every((chip) => {
      switch (chip) {
        case "Unassigned / Needs Routing":
          return !grievance.department;
        case "Critical":
          return grievance.priority === "CRITICAL";
        case "High":
          return grievance.priority === "HIGH";
        case "SLA Breached":
          return getSlaStatus(grievance) === "breach";
        case "Duplicate":
          return Array.isArray(grievance.duplicateMatches) && grievance.duplicateMatches.length > 0;
        case "Water Supply":
          return String(grievance.category || "").toLowerCase().includes("water");
        case "Roads":
          return (
            String(grievance.category || "").toLowerCase().includes("road") ||
            String(grievance.subcategory || "").toLowerCase().includes("road")
          );
        case "Escalated":
          return grievance?.sla?.escalated === true;
        default:
          return true;
      }
    });
  };

  const filteredGrievances = grievances.filter(
    (grievance) => matchesSearch(grievance) && matchesQuickFilters(grievance)
  );

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="All Grievances"
        subtitle="Universal grievance management across all departments and officers"
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportGrievancesToCSV(filteredGrievances, "all_grievances.csv")}
            className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => exportGrievancesToPDF(filteredGrievances, "all_grievances_report.pdf")}
            className="px-3.5 py-1.5 bg-[#0f2b4e] text-white text-sm font-medium rounded-lg hover:bg-[#184275] transition"
          >
            Export PDF
          </button>
        </div>
      </PageHeader>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title, category, officer..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-slate-500">Quick filters:</span>
          {chips.map((chip) => (
            <FilterChip
              key={chip}
              label={chip}
              active={activeChips.includes(chip)}
              onClick={() => toggleChip(chip)}
            />
          ))}

          {activeChips.length > 0 && (
            <button
              onClick={() => setActiveChips([])}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <SectionCard>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500">
            Showing <strong>{filteredGrievances.length}</strong> grievances
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading grievances...</div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-red-600">{error}</div>
        ) : filteredGrievances.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No grievances found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  {[
                    "ID", "Title", "Category", "Priority", "AI Score",
                    "Department", "Officer", "Location", "Status", "SLA", "Dup.", "Created", "Action",
                  ].map((heading) => (
                    <th key={heading} className="text-left font-medium pb-3 pr-2">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filteredGrievances.map((grievance) => {
                  const targetId = grievance._id || grievance.grievanceId;
                  const deptName = getDepartmentName(grievance);
                  const isUnassigned = !deptName;
                  const aiScore = getAiScore(grievance);
                  const slaStatus = getSlaStatus(grievance);
                  const slaRemaining = getSlaRemaining(grievance);

                  return (
                    <tr
                      key={targetId}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`grievance-detail:${targetId}`)}
                    >
                      <td className="py-2.5 pr-2 font-mono text-xs text-blue-600 font-semibold">
                        {grievance.grievanceId || grievance._id || "—"}
                      </td>

                      <td className="py-2.5 pr-2 text-slate-800 font-medium text-xs max-w-28 truncate">
                        {grievance.title || "Untitled grievance"}
                      </td>

                      <td className="py-2.5 pr-2 text-slate-500 text-xs">
                        {grievance.category || "Uncategorized"}
                      </td>

                      <td className="py-2.5 pr-2">
                        <PriorityBadge priority={grievance.priority || "MEDIUM"} />
                      </td>

                      <td className="py-2.5 pr-2">
                        {aiScore !== null ? (
                          <div className="flex items-center gap-1">
                            <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.max(0, aiScore))}%`,
                                  background:
                                    aiScore > 85 ? "#ef4444" : aiScore > 70 ? "#f59e0b" : "#3b82f6",
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {aiScore}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-2.5 pr-2 text-xs">
                        {isUnassigned ? (
                          <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded">
                            ⚠️ Needs Routing
                          </span>
                        ) : (
                          <span className="text-slate-600">{deptName}</span>
                        )}
                      </td>

                      <td className="py-2.5 pr-2 text-slate-500 text-xs">
                        {getOfficerName(grievance)}
                      </td>

                      <td className="py-2.5 pr-2 text-slate-500 text-xs">
                        {getLocation(grievance)}
                      </td>

                      <td className="py-2.5 pr-2">
                        <StatusBadge status={grievance.status || "SUBMITTED"} />
                      </td>

                      <td className="py-2.5 pr-2">
                        <SlaIndicator status={slaStatus} remaining={slaRemaining} />
                      </td>

                      <td className="py-2.5 pr-2 text-center">
                        {Array.isArray(grievance.duplicateMatches) && grievance.duplicateMatches.length > 0 ? (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                            DUP
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-2.5 pr-2 text-slate-400 text-xs">
                        {formatDate(grievance.createdAt)}
                      </td>

                      <td className="py-2.5" onClick={(event) => event.stopPropagation()}>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => navigate(`grievance-detail:${targetId}`)}
                            className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50"
                          >
                            View
                          </button>

                          {isUnassigned && (
                            <button
                              onClick={() => {
                                setRoutingGrievance(grievance);
                                setSelectedDeptId("");
                                setSelectedPriority(grievance.priority || "MEDIUM");
                              }}
                              className="text-xs bg-amber-600 text-white rounded px-2 py-0.5 hover:bg-amber-700 font-medium whitespace-nowrap"
                            >
                              Assign Dept
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ─── Manual Department Assignment Modal ─── */}
      {routingGrievance && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Assign Department
              </h3>
              <button
                onClick={() => setRoutingGrievance(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-blue-600 font-mono font-semibold">
                {routingGrievance.grievanceId || routingGrievance._id}
              </p>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                {routingGrievance.title || "Untitled Grievance"}
              </p>
              <p className="text-xs text-slate-500 line-clamp-2">
                {routingGrievance.description || "No description"}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Department *
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="">Select a department...</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} {dept.code ? `(${dept.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Set Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg p-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRoutingGrievance(null)}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedDeptId || routingLoading}
                onClick={handleRouteSubmit}
                className="px-4 py-2 text-sm bg-[#0f2b4e] text-white rounded-lg hover:bg-blue-900 disabled:opacity-50 font-medium"
              >
                {routingLoading ? "Routing..." : "Confirm & Route"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Departments ──────────────────────────────────────────────────────────────
export function Departments() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGrievances = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found");

        const response = await getMyGrievances(token);
        const items = Array.isArray(response)
          ? response
          : Array.isArray(response?.grievances)
          ? response.grievances
          : Array.isArray(response?.data)
          ? response.data
          : [];

        setGrievances(items);
      } catch (err) {
        console.error("Failed to load department data:", err);
        setError(err instanceof Error ? err.message : "Failed to load department data");
      } finally {
        setLoading(false);
      }
    };

    loadGrievances();
  }, []);

  const departmentMap: Record<string, any[]> = {};
  grievances.forEach((grievance) => {
    let departmentName = "Unassigned";
    if (typeof grievance.department === "string") {
      departmentName = grievance.department;
    } else if (grievance.department?.name) {
      departmentName = grievance.department.name;
    } else if (grievance.department?.code) {
      departmentName = grievance.department.code;
    }

    if (!departmentMap[departmentName]) {
      departmentMap[departmentName] = [];
    }
    departmentMap[departmentName].push(grievance);
  });

  const departmentData = Object.entries(departmentMap).map(([name, items]) => {
    const open = items.filter(
      (grievance) => !["RESOLVED", "CLOSED", "REJECTED"].includes(grievance.status)
    ).length;

    const resolved = items.filter(
      (grievance) => grievance.status === "RESOLVED" || grievance.status === "CLOSED"
    ).length;

    const critical = items.filter(
      (grievance) => grievance.priority === "CRITICAL"
    ).length;

    const grievancesWithSla = items.filter((grievance) => grievance?.sla?.dueAt);
    const breached = grievancesWithSla.filter((grievance) => {
      if (grievance?.sla?.breached === true) return true;
      return new Date(grievance.sla.dueAt).getTime() < Date.now();
    }).length;

    const sla =
      grievancesWithSla.length > 0
        ? Math.round(((grievancesWithSla.length - breached) / grievancesWithSla.length) * 100)
        : 0;

    const resolvedWithDates = items.filter(
      (grievance) =>
        (grievance.status === "RESOLVED" || grievance.status === "CLOSED") &&
        grievance.createdAt &&
        (grievance?.resolution?.resolvedAt || grievance.updatedAt)
    );

    let averageDays = 0;
    if (resolvedWithDates.length > 0) {
      const totalDays = resolvedWithDates.reduce((total, grievance) => {
        const created = new Date(grievance.createdAt).getTime();
        const resolved = new Date(
          grievance?.resolution?.resolvedAt || grievance.updatedAt
        ).getTime();

        if (Number.isNaN(created) || Number.isNaN(resolved) || resolved < created) return total;
        return total + (resolved - created) / (1000 * 60 * 60 * 24);
      }, 0);

      averageDays = totalDays / resolvedWithDates.length;
    }

    const officers = new Set<string>();
    items.forEach((grievance) => {
      if (!grievance.assignedOfficer) return;
      if (typeof grievance.assignedOfficer === "string") {
        officers.add(grievance.assignedOfficer);
      } else if (grievance.assignedOfficer._id) {
        officers.add(grievance.assignedOfficer._id);
      }
    });

    return {
      name,
      open,
      resolved,
      sla,
      avg: averageDays > 0 ? `${averageDays.toFixed(1)} days` : "—",
      critical,
      officers: officers.size,
    };
  });

  const totalDepartments = departmentData.length;
  const totalOpenCases = grievances.filter(
    (grievance) => !["RESOLVED", "CLOSED", "REJECTED"].includes(grievance.status)
  ).length;

  const allWithSla = grievances.filter((grievance) => grievance?.sla?.dueAt);
  const allBreached = allWithSla.filter((grievance) => {
    if (grievance?.sla?.breached === true) return true;
    return new Date(grievance.sla.dueAt).getTime() < Date.now();
  }).length;

  const averageSla =
    allWithSla.length > 0
      ? (((allWithSla.length - allBreached) / allWithSla.length) * 100).toFixed(1)
      : "0.0";

  const activeOfficers = new Set<string>();
  grievances.forEach((grievance) => {
    if (!grievance.assignedOfficer) return;
    if (typeof grievance.assignedOfficer === "string") {
      activeOfficers.add(grievance.assignedOfficer);
    } else if (grievance.assignedOfficer._id) {
      activeOfficers.add(grievance.assignedOfficer._id);
    }
  });

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Department Management"
        subtitle="Manage departments, SLA configuration and officer assignments"
      >
        <PrimaryBtn>+ Add Department</PrimaryBtn>
      </PageHeader>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-500">
          Loading department data...
        </div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-red-600">
          {error}
        </div>
      ) : (
        <>
          <div className="flex gap-3">
            <KpiCard label="Total Departments" value={String(totalDepartments)} trend="Live" trendUp={true} />
            <KpiCard label="Active Officers" value={String(activeOfficers.size)} trend="Assigned grievances" trendUp={true} />
            <KpiCard label="Avg SLA Compliance" value={`${averageSla}%`} trend="Live" trendUp={Number(averageSla) >= 90} />
            <KpiCard label="Open Cases" value={String(totalOpenCases)} trend="Live" trendUp={totalOpenCases > 0} />
          </div>

          <SectionCard>
            {departmentData.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">
                No department grievance data available.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
                    {[
                      "Department", "Open Cases", "Resolved", "SLA Compliance",
                      "Avg Resolution", "Critical", "Officers", "Actions",
                    ].map((heading) => (
                      <th key={heading} className="text-left font-medium pb-3 pr-3">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {departmentData.map((department) => (
                    <tr key={department.name} className="hover:bg-slate-50 dark:bg-slate-900">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                            {department.name
                              .split(" ")
                              .map((word) => word[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {department.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">{department.open}</td>
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">{department.resolved}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${department.sla}%`,
                                background:
                                  department.sla >= 90
                                    ? "#16a34a"
                                    : department.sla >= 80
                                    ? "#d97706"
                                    : "#ef4444",
                              }}
                            />
                          </div>
                          <span
                            className={`text-xs font-semibold ${
                              department.sla >= 90
                                ? "text-green-700"
                                : department.sla >= 80
                                ? "text-amber-700"
                                : "text-red-700"
                            }`}
                          >
                            {department.sla}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-slate-600 text-xs">{department.avg}</td>
                      <td className="py-3 pr-3">
                        {department.critical > 0 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                            {department.critical}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">{department.officers}</td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <button className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50">
                            View
                          </button>
                          <button className="text-xs text-slate-600 border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-50 dark:bg-slate-900">
                            SLA Config
                          </button>
                          <button className="text-xs text-slate-600 border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-50 dark:bg-slate-900">
                            Officers
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

// ─── Geographic Intelligence (Admin) ─────────────────────────────────────────
// export function AdminGeoIntelligence() {
//   const [mapMode, setMapMode] = useState<"markers" | "heatmap" | "clusters">("heatmap");
//   const [selectedZone, setSelectedZone] = useState<string | null>("Zone 4");

//   return (
//     <div className="p-6 space-y-4">
//       <PageHeader
//         title="Geographic Intelligence"
//         subtitle="AI-powered spatial analysis — complaint density, hotspots and trend overlays"
//       >
//         <SecondaryBtn>Export Map</SecondaryBtn>
//         <PrimaryBtn>Generate Zone Report</PrimaryBtn>
//       </PageHeader>

//       <div className="flex gap-3">
//         <KpiCard label="Total Complaints" value="1,247" trend="+12.5%" trendUp={true} />
//         <KpiCard label="Critical Complaints" value="42" trend="+18%" trendUp={false} />
//         <KpiCard label="Active Hotspots" value="3" trend="+50%" trendUp={false} />
//         <KpiCard label="Emerging Trends" value="5" trend="+25%" trendUp={false} />
//         <KpiCard label="Affected Population" value="58,420" trend="+8%" trendUp={false} />
//       </div>

//       <div className="grid grid-cols-4 gap-5">
//         <div className="col-span-3 space-y-3">
//           <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
//             <div className="flex gap-1">
//               {(["markers", "heatmap", "clusters"] as const).map((m) => (
//                 <button
//                   key={m}
//                   onClick={() => setMapMode(m)}
//                   className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
//                     mapMode === m ? "bg-[#0f2b4e] text-white" : "text-slate-600 hover:bg-slate-100 dark:bg-slate-700"
//                   }`}
//                 >
//                   {m === "markers" ? "📍 Markers" : m === "heatmap" ? "🌡 Heatmap" : "◎ Clusters"}
//                 </button>
//               ))}
//             </div>
//             <div className="h-4 w-px bg-slate-200" />
//             <input
//               type="text"
//               placeholder="Search area, zone, locality..."
//               className="flex-1 text-sm text-slate-600 outline-none"
//             />
//             <div className="flex gap-1">
//               {["Layers ∨", "Zones ∨", "Dept. Boundaries ∨"].map((b) => (
//                 <button
//                   key={b}
//                   className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 hover:bg-slate-50 dark:bg-slate-900"
//                 >
//                   {b}
//                 </button>
//               ))}
//             </div>
//           </div>
//           <MapSvg
//             mode={mapMode}
//             height={500}
//             showControls={true}
//             selectedZone={selectedZone}
//             onZoneClick={(z) => setSelectedZone(z === selectedZone ? null : z)}
//           />
//         </div>

//         <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 600 }}>
//           <SectionCard title="Zone Summary">
//             <div className="space-y-2">
//               {[
//                 { zone: "Zone 4", count: 438, pct: 35, level: "Critical", color: "#ef4444" },
//                 { zone: "Zone 3", count: 201, pct: 16, level: "High", color: "#f59e0b" },
//                 { zone: "Zone 1", count: 142, pct: 11, level: "Moderate", color: "#eab308" },
//                 { zone: "Zone 2", count: 89, pct: 7, level: "Low", color: "#22c55e" },
//                 { zone: "Zone 5", count: 67, pct: 5, level: "Moderate", color: "#eab308" },
//                 { zone: "Zone 6", count: 45, pct: 4, level: "Low", color: "#22c55e" },
//               ].map((z) => (
//                 <div
//                   key={z.zone}
//                   onClick={() => setSelectedZone(z.zone === selectedZone ? null : z.zone)}
//                   className={`p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${
//                     selectedZone === z.zone ? "ring-2 ring-blue-500 bg-blue-50" : "bg-slate-50 dark:bg-slate-900"
//                   }`}
//                 >
//                   <div className="flex justify-between items-center mb-1">
//                     <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{z.zone}</span>
//                     <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{z.count}</span>
//                   </div>
//                   <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
//                     <div className="h-full rounded-full" style={{ width: `${z.pct * 2.5}%`, background: z.color }} />
//                   </div>
//                   <span className="text-[10px]" style={{ color: z.color }}>{z.level}</span>
//                 </div>
//               ))}
//             </div>
//           </SectionCard>

//           {selectedZone === "Zone 4" && (
//             <SectionCard title="Zone 4 — Details" className="border-red-200">
//               <div className="space-y-2 text-xs mb-3">
//                 {[
//                   ["Total", "438"], ["Critical", "42"], ["High", "97"], ["Water", "173"],
//                   ["Roads", "122"], ["Sanitation", "81"], ["Trend", "↑ 37%"], ["Population", "18,420"],
//                 ].map(([k, v]) => (
//                   <div key={k} className="flex justify-between">
//                     <span className="text-slate-500">{k}</span>
//                     <span className="font-semibold text-slate-800 dark:text-slate-200">{v}</span>
//                   </div>
//                 ))}
//               </div>
//               <button className="w-full text-xs bg-red-600 text-white rounded-lg py-1.5 hover:bg-red-700">
//                 View Zone Grievances
//               </button>
//             </SectionCard>
//           )}

//           <AiInsightCard
//             title="AI Spatial Analysis"
//             text={
//               <>
//                 Zone 4 complaint density <strong>increased 37%</strong> this week. Water + Roads
//                 complaints converging near Sector 7 market. Recommend coordinated infrastructure inspection.
//               </>
//             }
//             disclaimer="AI-generated • Not an official government decision"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }



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
                <p className="text-xs text-slate-500">{label}</p>
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
        text={
          <>
            AI classification accuracy improved <strong>1.8%</strong> this month. Human override rate
            increased in Sanitation category — consider retraining with recent override data. Duplicate
            detection performing above target at <strong>91.7%</strong>.
          </>
        }
        disclaimer="AI-generated performance analysis • For governance review only"
      />
    </div>
  );
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export function AuditLogs() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Events");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [actorFilter, setActorFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const EVENTS_PER_PAGE = 8;

  // ─────────────────────────────────────────────────────────────
  // Load real grievance data
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadAuditData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await getMyGrievances(token);

        const items = Array.isArray(response)
          ? response
          : Array.isArray(response?.grievances)
          ? response.grievances
          : Array.isArray(response?.data)
          ? response.data
          : [];

        setGrievances(items);
      } catch (err) {
        console.error("Failed to load audit logs:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load audit logs"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAuditData();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Convert grievance data into audit events
  // ─────────────────────────────────────────────────────────────
  const events = grievances.flatMap((grievance) => {
    const generatedEvents: any[] = [];

    const grievanceId =
      grievance.grievanceId || grievance._id || "Unknown ID";

    const citizenName =
      typeof grievance.citizen === "object"
        ? grievance.citizen?.name || "Citizen"
        : "Citizen";

    const officerName =
      typeof grievance.assignedOfficer === "object"
        ? grievance.assignedOfficer?.name || "Officer"
        : grievance.assignedOfficer || "Officer";

    const departmentName =
      typeof grievance.department === "object"
        ? grievance.department?.name || grievance.department?.code
        : grievance.department || "Unassigned";

    // 1. Complaint Created
    if (grievance.createdAt) {
      generatedEvents.push({
        id: `${grievanceId}-created`,
        who: citizenName,
        what: "Complaint Created",
        detail: `${grievanceId} — ${grievance.title || "Untitled grievance"}`,
        when: grievance.createdAt,
        why: "Citizen submission",
        type: "create",
        grievanceId,
      });
    }

    // 2. AI Classification
    if (
      grievance.aiAnalysis?.category ||
      grievance.aiAnalysis?.subcategory
    ) {
      const category =
        grievance.aiAnalysis?.category ||
        grievance.category ||
        "Unclassified";

      const subcategory =
        grievance.aiAnalysis?.subcategory ||
        grievance.subcategory ||
        "";

      const confidence =
        typeof grievance.aiAnalysis?.confidence === "number"
          ? `${Math.round(grievance.aiAnalysis.confidence * 100)}%`
          : "Available";

      generatedEvents.push({
        id: `${grievanceId}-ai-classification`,
        who: "Nivara AI",
        what: "AI Classified",
        detail: `${category}${
          subcategory ? ` > ${subcategory}` : ""
        } — Confidence ${confidence}`,
        when: grievance.createdAt,
        why: "Automated classification",
        type: "ai",
        grievanceId,
      });
    }

    // 3. AI Priority
    if (
      grievance.aiAnalysis?.priorityScore !== undefined
    ) {
      generatedEvents.push({
        id: `${grievanceId}-ai-priority`,
        who: "Nivara AI",
        what: "Priority Generated",
        detail: `Score ${grievance.aiAnalysis.priorityScore}/100 — ${
          grievance.priority || "MEDIUM"
        } priority`,
        when: grievance.createdAt,
        why:
          grievance.aiAnalysis?.priorityReason ||
          "AI priority scoring",
        type: "ai",
        grievanceId,
      });
    }

    // 4. Department assignment
    if (grievance.department) {
      generatedEvents.push({
        id: `${grievanceId}-department`,
        who: "System",
        what: "Department Assigned",
        detail: `Routed to ${departmentName}`,
        when:
          grievance.timeline?.find(
            (item: any) =>
              String(item.message || "")
                .toLowerCase()
                .includes("department")
          )?.timestamp || grievance.createdAt,
        why: "Department routing",
        type: "system",
        grievanceId,
      });
    }

    // 5. Timeline events from MongoDB
    if (Array.isArray(grievance.timeline)) {
      grievance.timeline.forEach(
        (timelineItem: any, index: number) => {
          const status = String(
            timelineItem.status || ""
          ).toUpperCase();

          const message =
            timelineItem.message ||
            status.replace(/_/g, " ") ||
            "Grievance updated";

          let type = "system";
          let what = status
            ? status.replace(/_/g, " ")
            : "Grievance Updated";

          const lowerMessage = message.toLowerCase();

          // AI-related event
          if (
            lowerMessage.includes("ai") ||
            lowerMessage.includes("automated") ||
            lowerMessage.includes("classification") ||
            lowerMessage.includes("priority scoring")
          ) {
            type = "ai";
          }

          // Human override / decision
          if (
            lowerMessage.includes("override") ||
            lowerMessage.includes("priority changed") ||
            lowerMessage.includes("decision")
          ) {
            type = "override";
            what = "Human Decision";
          }

          // Resolution
          if (
            status === "RESOLVED" ||
            status === "CLOSED" ||
            lowerMessage.includes("resolution") ||
            lowerMessage.includes("resolved")
          ) {
            type = "resolve";
            what = "Resolution Update";
          }

          // Citizen action
          if (
            lowerMessage.includes("feedback") ||
            lowerMessage.includes("citizen")
          ) {
            type = "feedback";
            what = "Citizen Action";
          }

          generatedEvents.push({
            id: `${grievanceId}-timeline-${index}`,
            who:
              timelineItem.actor?.name ||
              timelineItem.actor?.email ||
              (type === "ai"
                ? "Nivara AI"
                : type === "feedback"
                ? citizenName
                : officerName),
            what,
            detail: `${grievanceId} — ${message}`,
            when:
              timelineItem.timestamp ||
              grievance.updatedAt ||
              grievance.createdAt,
            why:
              type === "ai"
                ? "Automated platform decision"
                : type === "override"
                ? "Human decision or override"
                : type === "resolve"
                ? "Resolution workflow"
                : type === "feedback"
                ? "Citizen action"
                : "System workflow",
            type,
            grievanceId,
          });
        }
      );
    }

    // 6. Resolution
    if (grievance.resolution?.resolvedAt) {
      generatedEvents.push({
        id: `${grievanceId}-resolution`,
        who:
          typeof grievance.resolution?.resolvedBy === "object"
            ? grievance.resolution?.resolvedBy?.name || officerName
            : officerName,
        what: "Resolution Submitted",
        detail:
          grievance.resolution?.message ||
          `${grievanceId} marked as resolved`,
        when: grievance.resolution.resolvedAt,
        why: "Resolution submitted",
        type: "resolve",
        grievanceId,
      });
    }

    // 7. Citizen feedback
    if (grievance.feedback?.submittedAt) {
      generatedEvents.push({
        id: `${grievanceId}-feedback`,
        who: citizenName,
        what: "Citizen Feedback",
        detail: `Rated ${
          grievance.feedback.rating || "—"
        }/5${
          grievance.feedback.comment
            ? ` — ${grievance.feedback.comment}`
            : ""
        }`,
        when: grievance.feedback.submittedAt,
        why: "Citizen review",
        type: "feedback",
        grievanceId,
      });
    }

    return generatedEvents;
  });

  // ─────────────────────────────────────────────────────────────
  // Sort newest first
  // ─────────────────────────────────────────────────────────────
  const sortedEvents = [...events].sort(
    (a, b) =>
      new Date(b.when).getTime() -
      new Date(a.when).getTime()
  );

  // ─────────────────────────────────────────────────────────────
  // Filter by tab
  // ─────────────────────────────────────────────────────────────
  const filteredByType = sortedEvents.filter((event) => {
    switch (activeFilter) {
      case "AI Decisions":
        return event.type === "ai";

      case "Human Overrides":
        return event.type === "override";

      case "Resolutions":
        return event.type === "resolve";

      case "System Events":
        return event.type === "system";

      case "Citizen Actions":
        return (
          event.type === "create" ||
          event.type === "feedback"
        );

      default:
        return true;
    }
  });

  // ─────────────────────────────────────────────────────────────
  // Search + advanced filters
  // ─────────────────────────────────────────────────────────────
  const filteredEvents = filteredByType.filter((event) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      String(event.grievanceId || "")
        .toLowerCase()
        .includes(query) ||
      String(event.who || "")
        .toLowerCase()
        .includes(query) ||
      String(event.what || "")
        .toLowerCase()
        .includes(query) ||
      String(event.detail || "")
        .toLowerCase()
        .includes(query) ||
      String(event.why || "")
        .toLowerCase()
        .includes(query);

    const matchesActor =
      actorFilter === "All" ||
      String(event.who || "") === actorFilter;

    let matchesDate = true;

    if (dateFilter !== "All") {
      const eventDate = new Date(event.when);
      const now = new Date();

      if (dateFilter === "Today") {
        matchesDate =
          eventDate.toDateString() === now.toDateString();
      }

      if (dateFilter === "7 Days") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesDate = eventDate >= sevenDaysAgo;
      }

      if (dateFilter === "30 Days") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        matchesDate = eventDate >= thirtyDaysAgo;
      }
    }

    return (
      matchesSearch &&
      matchesActor &&
      matchesDate
    );
  });

  // ─────────────────────────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredEvents.length / EVENTS_PER_PAGE
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) * EVENTS_PER_PAGE;

  const paginatedEvents = filteredEvents.slice(
    startIndex,
    startIndex + EVENTS_PER_PAGE
  );

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter, actorFilter, dateFilter]);

  // ─────────────────────────────────────────────────────────────
  // Export current filtered logs
  // ─────────────────────────────────────────────────────────────
  const exportLogs = () => {
    if (filteredEvents.length === 0) {
      alert("No audit logs available to export.");
      return;
    }

    const headers = [
      "Grievance ID",
      "Event",
      "Details",
      "WHO",
      "WHY",
      "Date",
    ];

    const escapeCSV = (value: any) =>
      `"${String(value ?? "")
        .replace(/"/g, '""')}"`;

    const rows = filteredEvents.map((event) =>
      [
        event.grievanceId,
        event.what,
        event.detail,
        event.who,
        event.why,
        new Date(event.when).toLocaleString("en-IN"),
      ]
        .map(escapeCSV)
        .join(",")
    );

    const csv =
      "\uFEFF" +
      [headers.join(","), ...rows].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `nivara-audit-logs-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────
  // Unique actors for filter
  // ─────────────────────────────────────────────────────────────
  const actors = Array.from(
    new Set(
      sortedEvents
        .map((event) => event.who)
        .filter(Boolean)
    )
  );

  const typeConfig: Record<
    string,
    { color: string; icon: string }
  > = {
    create: {
      color: "bg-blue-100 text-blue-700",
      icon: "📝",
    },
    ai: {
      color: "bg-purple-100 text-purple-700",
      icon: "✦",
    },
    system: {
      color: "bg-slate-100 text-slate-600",
      icon: "⚙",
    },
    officer: {
      color: "bg-green-100 text-green-700",
      icon: "👤",
    },
    override: {
      color: "bg-amber-100 text-amber-700",
      icon: "⚡",
    },
    resolve: {
      color: "bg-green-100 text-green-700",
      icon: "✓",
    },
    feedback: {
      color: "bg-blue-100 text-blue-700",
      icon: "★",
    },
  };

  const formatDateTime = (date: string) => {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Unknown";
    }

    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Audit Logs"
        subtitle="Complete audit trail of platform events and decisions"
      >
        <SecondaryBtn onClick={exportLogs}>
          Export Logs
        </SecondaryBtn>

        <SecondaryBtn
          onClick={() =>
            setShowFilters((previous) => !previous)
          }
        >
          Filter
        </SecondaryBtn>
      </PageHeader>

      {/* Tabs + Search */}
      <div className="flex gap-2 flex-wrap items-center">
        {[
          "All Events",
          "AI Decisions",
          "Human Overrides",
          "Resolutions",
          "System Events",
          "Citizen Actions",
        ].map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            active={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
          />
        ))}

        <div className="ml-auto">
          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search logs..."
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 rounded-lg text-xs text-slate-600 outline-none focus:border-blue-400 w-52"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 rounded-xl p-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Actor
            </label>

            <select
              value={actorFilter}
              onChange={(e) =>
                setActorFilter(e.target.value)
              }
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="All">All Actors</option>

              {actors.map((actor) => (
                <option key={actor} value={actor}>
                  {actor}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Date
            </label>

            <select
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value)
              }
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="7 Days">Last 7 Days</option>
              <option value="30 Days">
                Last 30 Days
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setActorFilter("All");
              setDateFilter("All");
              setSearch("");
            }}
            className="px-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Clear Filters
          </button>
        </div>
      )}

      <SectionCard>
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading audit logs...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-sm text-red-600">
            {error}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No audit events found.
          </div>
        ) : (
          <>
            <div className="space-y-0">
              {paginatedEvents.map((event, index) => {
                const cfg =
                  typeConfig[event.type] ||
                  typeConfig.system;

                const isLast =
                  index ===
                  paginatedEvents.length - 1;

                return (
                  <div
                    key={event.id}
                    className="flex gap-4 py-4 border-b border-slate-50 hover:bg-slate-50 rounded-lg px-2 transition-colors"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${cfg.color}`}
                      >
                        {cfg.icon}
                      </div>

                      {!isLast && (
                        <div className="w-px flex-1 bg-slate-100 mt-2" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {event.what}
                            </span>

                            {event.type === "ai" && (
                              <AiBadge />
                            )}

                            {event.type ===
                              "override" && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                                HUMAN OVERRIDE
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 mt-0.5">
                            {event.detail}
                          </p>
                        </div>

                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {formatDateTime(
                            event.when
                          )}
                        </span>
                      </div>

                      <div className="flex gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">
                            WHO:
                          </strong>{" "}
                          {event.who}
                        </span>

                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">
                            WHY:
                          </strong>{" "}
                          {event.why}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
              <span>
                Showing{" "}
                {filteredEvents.length === 0
                  ? 0
                  : startIndex + 1}
                –
                {Math.min(
                  startIndex +
                    EVENTS_PER_PAGE,
                  filteredEvents.length
                )}{" "}
                of {filteredEvents.length} events
              </span>

              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(1, page - 1)
                    )
                  }
                  className="w-7 h-7 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  ←
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                )
                  .slice(
                    Math.max(0, safePage - 3),
                    Math.min(
                      totalPages,
                      safePage + 2
                    )
                  )
                  .map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() =>
                        setCurrentPage(page)
                      }
                      className={`w-7 h-7 rounded text-xs ${
                        page === safePage
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  type="button"
                  disabled={
                    safePage === totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  className="w-7 h-7 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  →
                </button>
              </div>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export function Reports() {
  const [selected, setSelected] = useState("Grievance Report");

  const [grievances, setGrievances] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [dateRange, setDateRange] = useState("Last 30 days");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [zoneFilter, setZoneFilter] = useState("All Zones");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const [recentReports, setRecentReports] = useState<any[]>([]);

  const types = [
    "Grievance Report",
    "Department Performance",
    "SLA Report",
    "Geographic Report",
    "AI Performance Report",
    "Audit Report",
  ];

  // ─────────────────────────────────────────────────────────────
  // Load real data
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const [grievanceResponse, departmentResponse] =
          await Promise.all([
            getMyGrievances(token),
            getDepartments(token),
          ]);

        const grievanceItems = Array.isArray(grievanceResponse)
          ? grievanceResponse
          : Array.isArray(grievanceResponse?.grievances)
          ? grievanceResponse.grievances
          : Array.isArray(grievanceResponse?.data)
          ? grievanceResponse.data
          : [];

        const departmentItems = Array.isArray(
          departmentResponse?.departments
        )
          ? departmentResponse.departments
          : [];

        setGrievances(grievanceItems);
        setDepartments(departmentItems);
      } catch (error) {
        console.error(
          "Failed to load report data:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadReportData();

    // Load locally generated reports
    try {
      const storedReports = localStorage.getItem(
        "nivara_recent_reports"
      );

      if (storedReports) {
        setRecentReports(JSON.parse(storedReports));
      }
    } catch {
      setRecentReports([]);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Get department name
  // ─────────────────────────────────────────────────────────────
  const getDepartmentName = (grievance: any) => {
    if (!grievance?.department) {
      return "Unassigned";
    }

    if (typeof grievance.department === "string") {
      return grievance.department;
    }

    return (
      grievance.department?.name ||
      grievance.department?.code ||
      "Unassigned"
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Get zone
  // ─────────────────────────────────────────────────────────────
  const getZone = (grievance: any) => {
    return (
      grievance?.zone ||
      grievance?.location?.zone ||
      grievance?.location?.area ||
      grievance?.location?.district ||
      "Unknown"
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Date filtering
  // ─────────────────────────────────────────────────────────────
  const matchesDateRange = (grievance: any) => {
    if (dateRange === "All time") {
      return true;
    }

    if (!grievance?.createdAt) {
      return false;
    }

    const createdAt = new Date(
      grievance.createdAt
    );

    if (Number.isNaN(createdAt.getTime())) {
      return false;
    }

    const now = new Date();

    let days = 30;

    if (dateRange === "Last 7 days") {
      days = 7;
    }

    if (dateRange === "Last 30 days") {
      days = 30;
    }

    if (dateRange === "Last 90 days") {
      days = 90;
    }

    if (dateRange === "This year") {
      return (
        createdAt.getFullYear() ===
        now.getFullYear()
      );
    }

    const startDate = new Date();
    startDate.setDate(
      now.getDate() - days
    );

    return createdAt >= startDate;
  };

  // ─────────────────────────────────────────────────────────────
  // Filter available grievances
  // ─────────────────────────────────────────────────────────────
  const filteredGrievances = grievances.filter(
    (grievance) => {
      const matchesDepartment =
        departmentFilter === "All Departments" ||
        getDepartmentName(grievance) ===
          departmentFilter;

      const matchesCategory =
        categoryFilter === "All Categories" ||
        String(
          grievance.category || ""
        ) === categoryFilter;

      const matchesZone =
        zoneFilter === "All Zones" ||
        getZone(grievance) === zoneFilter;

      const matchesPriority =
        priorityFilter === "All Priorities" ||
        String(
          grievance.priority || ""
        ).toUpperCase() ===
          priorityFilter.toUpperCase();

      const matchesStatus =
        statusFilter === "All Statuses" ||
        String(
          grievance.status || ""
        ).toUpperCase() ===
          statusFilter.toUpperCase();

      return (
        matchesDateRange(grievance) &&
        matchesDepartment &&
        matchesCategory &&
        matchesZone &&
        matchesPriority &&
        matchesStatus
      );
    }
  );

  // ─────────────────────────────────────────────────────────────
  // Dynamic dropdown options
  // ─────────────────────────────────────────────────────────────
  const categories = Array.from(
    new Set(
      grievances
        .map((g) => g.category)
        .filter(Boolean)
    )
  );

  const zones = Array.from(
    new Set(
      grievances
        .map((g) => getZone(g))
        .filter(
          (zone) => zone && zone !== "Unknown"
        )
    )
  );

  const priorities = Array.from(
    new Set(
      grievances
        .map((g) => g.priority)
        .filter(Boolean)
    )
  );

  const statuses = Array.from(
    new Set(
      grievances
        .map((g) => g.status)
        .filter(Boolean)
    )
  );

  // ─────────────────────────────────────────────────────────────
  // Report statistics
  // ─────────────────────────────────────────────────────────────
  const totalRecords =
    filteredGrievances.length;

  const resolvedRecords =
    filteredGrievances.filter(
      (g) =>
        g.status === "RESOLVED" ||
        g.status === "CLOSED"
    ).length;

  const openRecords =
    filteredGrievances.filter(
      (g) =>
        ![
          "RESOLVED",
          "CLOSED",
          "REJECTED",
        ].includes(g.status)
    ).length;

  const criticalRecords =
    filteredGrievances.filter(
      (g) =>
        String(g.priority).toUpperCase() ===
        "CRITICAL"
    ).length;

  const slaRecords =
    filteredGrievances.filter(
      (g) => g?.sla?.dueAt
    );

  const slaBreached =
    slaRecords.filter((g) => {
      if (g?.sla?.breached === true) {
        return true;
      }

      return (
        new Date(
          g.sla.dueAt
        ).getTime() < Date.now()
      );
    }).length;

  const slaCompliance =
    slaRecords.length > 0
      ? (
          ((slaRecords.length -
            slaBreached) /
            slaRecords.length) *
          100
        ).toFixed(1)
      : "0.0";

  // ─────────────────────────────────────────────────────────────
  // Create CSV from filtered report
  // ─────────────────────────────────────────────────────────────
  const exportReportCSV = () => {
    if (filteredGrievances.length === 0) {
      alert(
        "No records match the selected filters."
      );
      return;
    }

    exportGrievancesToCSV(
      filteredGrievances,
      `${selected
        .toLowerCase()
        .replace(/\s+/g, "_")}.csv`
    );

    saveRecentReport();
  };

  // ─────────────────────────────────────────────────────────────
  // Export PDF
  // ─────────────────────────────────────────────────────────────
  const exportReportPDF = () => {
    if (filteredGrievances.length === 0) {
      alert(
        "No records match the selected filters."
      );
      return;
    }

    exportGrievancesToPDF(
      filteredGrievances,
      `${selected
        .toLowerCase()
        .replace(/\s+/g, "_")}.pdf`
    );

    saveRecentReport();
  };

  // ─────────────────────────────────────────────────────────────
  // Generate report
  // ─────────────────────────────────────────────────────────────
  const generateReport = () => {
    if (filteredGrievances.length === 0) {
      alert(
        "No records match the selected filters."
      );
      return;
    }

    setGenerating(true);

    setTimeout(() => {
      exportGrievancesToCSV(
        filteredGrievances,
        `${selected
          .toLowerCase()
          .replace(/\s+/g, "_")}_generated.csv`
      );

      saveRecentReport();

      setGenerating(false);

      alert(
        `${selected} generated successfully.\n\n${filteredGrievances.length} records included.`
      );
    }, 500);
  };

  // ─────────────────────────────────────────────────────────────
  // Save generated report in browser history
  // ─────────────────────────────────────────────────────────────
  const saveRecentReport = () => {
    const report = {
      id: Date.now(),
      name: `${selected} — ${new Date().toLocaleDateString(
        "en-IN"
      )}`,
      date: new Date().toLocaleString("en-IN"),
      records: filteredGrievances.length,
      size: `${Math.max(
        1,
        Math.round(
          (filteredGrievances.length *
            0.8) /
            100
        ) / 10
      )} MB`,
    };

    const existing = [...recentReports];

    const updated = [
      report,
      ...existing,
    ].slice(0, 10);

    setRecentReports(updated);

    localStorage.setItem(
      "nivara_recent_reports",
      JSON.stringify(updated)
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Scheduled Reports
  // ─────────────────────────────────────────────────────────────
  const handleScheduledReports = () => {
    alert(
      "Scheduled Reports\n\nReport scheduling is ready to be connected to a backend scheduler."
    );
  };

  // ─────────────────────────────────────────────────────────────
  // Reset filters
  // ─────────────────────────────────────────────────────────────
  const resetFilters = () => {
    setDateRange("Last 30 days");
    setDepartmentFilter(
      "All Departments"
    );
    setCategoryFilter(
      "All Categories"
    );
    setZoneFilter("All Zones");
    setPriorityFilter(
      "All Priorities"
    );
    setStatusFilter("All Statuses");
  };

  // ─────────────────────────────────────────────────────────────
  // Date range text
  // ─────────────────────────────────────────────────────────────
  const getDateRangeText = () => {
    if (dateRange === "All time") {
      return "All available records";
    }

    if (dateRange === "This year") {
      return `Jan 1 – ${new Date().toLocaleDateString(
        "en-IN"
      )}`;
    }

    const days =
      dateRange === "Last 7 days"
        ? 7
        : dateRange === "Last 90 days"
        ? 90
        : 30;

    const start = new Date();

    start.setDate(
      start.getDate() - days
    );

    return `${start.toLocaleDateString(
      "en-IN"
    )} – ${new Date().toLocaleDateString(
      "en-IN"
    )}`;
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Report Generation"
        subtitle="Generate, filter and export platform reports"
      >
        <SecondaryBtn
          onClick={handleScheduledReports}
        >
          Scheduled Reports
        </SecondaryBtn>

        <PrimaryBtn
          onClick={generateReport}
        >
          {generating
            ? "Generating..."
            : "+ Generate Report"}
        </PrimaryBtn>
      </PageHeader>

      <div className="grid grid-cols-3 gap-5">
        {/* ─────────────────────────────────────────────
            Report Types
        ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <SectionCard title="Report Type">
            <div className="space-y-1">
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setSelected(type)
                  }
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selected === type
                      ? "bg-blue-50 text-blue-700 font-semibold border border-blue-200"
                      : "text-slate-600 hover:bg-slate-50 dark:bg-slate-900"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Quick statistics */}
          <SectionCard title="Current Data">
            {loading ? (
              <p className="text-xs text-slate-500">
                Loading data...
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">
                    Total records
                  </span>

                  <strong className="text-sm">
                    {totalRecords}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">
                    Open
                  </span>

                  <strong className="text-sm">
                    {openRecords}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">
                    Resolved
                  </span>

                  <strong className="text-sm">
                    {resolvedRecords}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">
                    Critical
                  </span>

                  <strong className="text-sm">
                    {criticalRecords}
                  </strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">
                    SLA Compliance
                  </span>

                  <strong className="text-sm">
                    {slaCompliance}%
                  </strong>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ─────────────────────────────────────────────
            Configuration
        ───────────────────────────────────────────── */}
        <div className="col-span-2 space-y-4">
          <SectionCard
            title={`Configure: ${selected}`}
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Date */}
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Date Range
                </p>

                <select
                  value={dateRange}
                  onChange={(e) =>
                    setDateRange(
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400"
                >
                  <option>
                    Last 7 days
                  </option>
                  <option>
                    Last 30 days
                  </option>
                  <option>
                    Last 90 days
                  </option>
                  <option>
                    This year
                  </option>
                  <option>
                    All time
                  </option>
                </select>
              </div>

              {/* Department */}
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Department
                </p>

                <select
                  value={departmentFilter}
                  onChange={(e) =>
                    setDepartmentFilter(
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400"
                >
                  <option>
                    All Departments
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={
                          department._id ||
                          department.code ||
                          department.name
                        }
                        value={
                          department.name ||
                          department.code
                        }
                      >
                        {department.name ||
                          department.code}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Category */}
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Category
                </p>

                <select
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400"
                >
                  <option>
                    All Categories
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Zone */}
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Zone
                </p>

                <select
                  value={zoneFilter}
                  onChange={(e) =>
                    setZoneFilter(
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400"
                >
                  <option>
                    All Zones
                  </option>

                  {zones.map((zone) => (
                    <option
                      key={zone}
                      value={zone}
                    >
                      {zone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Priority
                </p>

                <select
                  value={priorityFilter}
                  onChange={(e) =>
                    setPriorityFilter(
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400"
                >
                  <option>
                    All Priorities
                  </option>

                  {priorities.map(
                    (priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {priority}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Status
                </p>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400"
                >
                  <option>
                    All Statuses
                  </option>

                  {statuses.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Preview — {selected}
              </p>

              <div className="grid grid-cols-2 gap-y-1 text-xs text-slate-500">
                <p>
                  • Period:{" "}
                  {getDateRangeText()}
                </p>

                <p>
                  • Total records:{" "}
                  <strong className="text-slate-700">
                    {totalRecords}
                  </strong>
                </p>

                <p>
                  • Departments:{" "}
                  <strong className="text-slate-700">
                    {departments.length}
                  </strong>
                </p>

                <p>
                  • Open cases:{" "}
                  <strong className="text-slate-700">
                    {openRecords}
                  </strong>
                </p>

                <p>
                  • Resolved cases:{" "}
                  <strong className="text-slate-700">
                    {resolvedRecords}
                  </strong>
                </p>

                <p>
                  • SLA compliance:{" "}
                  <strong className="text-slate-700">
                    {slaCompliance}%
                  </strong>
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <PrimaryBtn
                onClick={generateReport}
                className="flex-1 justify-center"
              >
                {generating
                  ? "Generating..."
                  : "Generate Report"}
              </PrimaryBtn>

              <SecondaryBtn
                onClick={exportReportCSV}
                className="flex-1 justify-center"
              >
                Export CSV
              </SecondaryBtn>

              <SecondaryBtn
                onClick={exportReportPDF}
                className="flex-1 justify-center"
              >
                Export PDF
              </SecondaryBtn>
            </div>

            {/* Reset */}
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-slate-500 hover:text-blue-600 underline"
              >
                Reset filters
              </button>
            </div>
          </SectionCard>

          {/* ─────────────────────────────────────────────
              Recent Reports
          ───────────────────────────────────────────── */}
          <SectionCard title="Recent Reports">
            {recentReports.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No reports generated yet.
              </div>
            ) : (
              <div className="space-y-2">
                {recentReports.map(
                  (report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between py-2 border-b border-slate-50 hover:bg-slate-50 rounded-lg px-2 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {report.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          {report.date} •{" "}
                          {report.records} records •{" "}
                          {report.size}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              filteredGrievances.length ===
                              0
                            ) {
                              alert(
                                "No current records available for this report."
                              );
                              return;
                            }

                            exportReportCSV();
                          }}
                          className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50"
                        >
                          Download
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `${report.name}\n\nGenerated: ${report.date}\nRecords: ${report.records}\nSize: ${report.size}`
                            )
                          }
                          className="text-xs text-slate-500 border border-slate-200 rounded px-2 py-0.5 hover:bg-slate-50"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ─── Admin People Management ───────────────────────────────────────────────────

export function AdminPeople({
  kind,
}: {
  kind: "OFFICER" | "CITIZEN";
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] =
    useState<any | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAllUsers();

      setUsers(
        data.filter(
          (user: any) =>
            user.role === kind
        )
      );
    } catch (err) {
      console.error(
        "Failed to load users:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [kind]);

  const filteredUsers = users.filter(
    (user) => {
      const query =
        search.trim().toLowerCase();

      if (!query) return true;

      return [
        user.name,
        user.email,
        user.phone,
        user.officialId,
        user.designation,
        user.department?.name,
        user.department?.code,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    }
  );

  const activeUsers = users.filter(
    (user) => user.isActive !== false
  ).length;

  const inactiveUsers =
    users.length - activeUsers;

  const title =
    kind === "OFFICER"
      ? "Officer Management"
      : "Citizen Management";

  const subtitle =
    kind === "OFFICER"
      ? "View and manage registered government officers"
      : "View and manage registered citizens";

  return (
    <div className="p-6 space-y-5">

      <PageHeader
        title={title}
        subtitle={subtitle}
      >
        <SecondaryBtn onClick={loadUsers}>
          Refresh
        </SecondaryBtn>
      </PageHeader>

      {/* Statistics */}

      <div className="flex gap-3">

        <KpiCard
          label={`Total ${
            kind === "OFFICER"
              ? "Officers"
              : "Citizens"
          }`}
          value={String(users.length)}
          trend="Live"
          trendUp={true}
        />

        <KpiCard
          label="Active"
          value={String(activeUsers)}
          trend="Accounts"
          trendUp={true}
        />

        <KpiCard
          label="Inactive"
          value={String(inactiveUsers)}
          trend="Accounts"
          trendUp={inactiveUsers === 0}
        />

      </div>

      {/* Search */}

      <SectionCard>

        <div className="flex items-center gap-3 mb-4">

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder={
              kind === "OFFICER"
                ? "Search officer by name, email, ID..."
                : "Search citizen by name, email, phone..."
            }
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400"
          />

          <span className="text-xs text-slate-500">
            {filteredUsers.length} result
            {filteredUsers.length !== 1
              ? "s"
              : ""}
          </span>

        </div>

        {/* Loading */}

        {loading ? (

          <div className="py-12 text-center text-sm text-slate-500">
            Loading{" "}
            {kind === "OFFICER"
              ? "officers"
              : "citizens"}
            ...
          </div>

        ) : error ? (

          <div className="py-12 text-center text-sm text-red-600">
            {error}
          </div>

        ) : filteredUsers.length === 0 ? (

          <div className="py-12 text-center text-sm text-slate-500">
            No{" "}
            {kind === "OFFICER"
              ? "officers"
              : "citizens"}{" "}
            found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="text-xs text-slate-400 border-b border-slate-100">

                  <th className="text-left pb-3 pr-4">
                    Name
                  </th>

                  <th className="text-left pb-3 pr-4">
                    Email
                  </th>

                  {kind === "OFFICER" && (
                    <>
                      <th className="text-left pb-3 pr-4">
                        Department
                      </th>

                      <th className="text-left pb-3 pr-4">
                        Designation
                      </th>

                      <th className="text-left pb-3 pr-4">
                        Official ID
                      </th>
                    </>
                  )}

                  {kind === "CITIZEN" && (
                    <th className="text-left pb-3 pr-4">
                      Phone
                    </th>
                  )}

                  <th className="text-left pb-3 pr-4">
                    Status
                  </th>

                  <th className="text-left pb-3">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-50">

                {filteredUsers.map(
                  (user) => (

                    <tr
                      key={user._id}
                      className="hover:bg-slate-50"
                    >

                      <td className="py-3 pr-4">

                        <div className="flex items-center gap-3">

                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">

                            {String(
                              user.name || "U"
                            )
                              .split(" ")
                              .map(
                                (word) =>
                                  word[0]
                              )
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}

                          </div>

                          <span className="font-medium text-slate-800">
                            {user.name}
                          </span>

                        </div>

                      </td>

                      <td className="py-3 pr-4 text-slate-500">
                        {user.email}
                      </td>

                      {kind === "OFFICER" && (
                        <>
                          <td className="py-3 pr-4 text-slate-600">
                            {user.department?.name ||
                              user.department?.code ||
                              "Unassigned"}
                          </td>

                          <td className="py-3 pr-4 text-slate-600">
                            {user.designation ||
                              "—"}
                          </td>

                          <td className="py-3 pr-4 font-mono text-xs text-slate-500">
                            {user.officialId ||
                              "—"}
                          </td>
                        </>
                      )}

                      {kind === "CITIZEN" && (
                        <td className="py-3 pr-4 text-slate-500">
                          {user.phone ||
                            "—"}
                        </td>
                      )}

                      <td className="py-3 pr-4">

                        <span
                          className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                            user.isActive !==
                            false
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.isActive !==
                          false
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </td>

                      <td className="py-3">

                        <button
                          onClick={() =>
                            setSelectedUser(
                              user
                            )
                          }
                          className="text-xs text-blue-600 border border-blue-200 rounded px-3 py-1 hover:bg-blue-50"
                        >
                          View
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </SectionCard>

      {/* User details modal */}

      {selectedUser && (

        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() =>
            setSelectedUser(null)
          }
        >

          <div
            className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-lg p-6 shadow-xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="flex justify-between items-start mb-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedUser.name}
                </h2>

                <p className="text-sm text-slate-500">
                  {selectedUser.email}
                </p>

              </div>

              <button
                onClick={() =>
                  setSelectedUser(null)
                }
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ×
              </button>

            </div>

            <div className="space-y-3">

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="text-xs text-slate-400">
                  Role
                </div>
                <div className="font-medium text-slate-700 dark:text-slate-200">
                  {selectedUser.role}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="text-xs text-slate-400">
                  Phone
                </div>
                <div className="font-medium text-slate-700 dark:text-slate-200">
                  {selectedUser.phone ||
                    "Not provided"}
                </div>
              </div>

              {kind === "OFFICER" && (
                <>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">
                      Department
                    </div>
                    <div className="font-medium text-slate-700 dark:text-slate-200">
                      {selectedUser.department?.name ||
                        "Unassigned"}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">
                      Designation
                    </div>
                    <div className="font-medium text-slate-700 dark:text-slate-200">
                      {selectedUser.designation ||
                        "Not provided"}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    <div className="text-xs text-slate-400">
                      Official ID
                    </div>
                    <div className="font-medium text-slate-700 dark:text-slate-200">
                      {selectedUser.officialId ||
                        "Not provided"}
                    </div>
                  </div>
                </>
              )}

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <div className="text-xs text-slate-400">
                  Account Status
                </div>
                <div className="font-medium text-slate-700 dark:text-slate-200">
                  {selectedUser.isActive !==
                  false
                    ? "Active"
                    : "Inactive"}
                </div>
              </div>

            </div>

            <div className="flex justify-end mt-5">

              <button
                onClick={() =>
                  setSelectedUser(null)
                }
                className="px-4 py-2 bg-[#0f2b4e] text-white rounded-lg text-sm"
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}