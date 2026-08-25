import { useState ,useEffect} from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  KpiCard, SectionCard, AiInsightCard, PageHeader, PrimaryBtn, SecondaryBtn, GhostBtn,
  StatusBadge, PriorityBadge, Timeline, ChartLegend, FilterChip, SlaIndicator, ScoreBar, AiBadge,
} from "../components/Shared";
import MapSvg from "../components/MapSvg";
import { getCurrentUser } from "./services/authService";
import {
  getMyGrievances,
  getGrievanceById,
  getGrievanceMessages,
  sendGrievanceMessage,
} from "../services/grievanceService";



// ─── Officer Dashboard ────────────────────────────────────────────────────────
export function OfficerDashboard({
  navigate,
}: {
  navigate: (screen: string) => void;
}) {
  const [currentUser, setCurrentUser] = useState<{
    name: string;
  } | null>(null);

  const [grievances, setGrievances] = useState<any[]>([]);
  const [loadingGrievances, setLoadingGrievances] = useState(true);
  const [grievanceError, setGrievanceError] = useState("");

  useEffect(() => {
    getCurrentUser()
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadGrievances = async () => {
      try {
        setLoadingGrievances(true);
        setGrievanceError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await getMyGrievances(token);

        const data = response?.grievances || [];

        if (mounted) {
          setGrievances(data);
        }
      } catch (err) {
        if (mounted) {
          setGrievanceError(
            err instanceof Error
              ? err.message
              : "Failed to load grievances."
          );
        }
      } finally {
        if (mounted) {
          setLoadingGrievances(false);
        }
      }
    };

    loadGrievances();

    return () => {
      mounted = false;
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Dynamic monthly grievance trend
  // ─────────────────────────────────────────────────────────────

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const trendData = monthNames.map((month, monthIndex) => {
    const submitted = grievances.filter((grievance) => {
      if (!grievance.createdAt) return false;

      const date = new Date(grievance.createdAt);

      return date.getMonth() === monthIndex;
    }).length;

    const resolved = grievances.filter((grievance) => {
      if (grievance.status !== "RESOLVED") {
        return false;
      }

      const resolvedDate =
        grievance?.resolution?.resolvedAt ||
        grievance?.updatedAt;

      if (!resolvedDate) return false;

      const date = new Date(resolvedDate);

      return date.getMonth() === monthIndex;
    }).length;

    return {
      month,
      submitted,
      resolved,
    };
  });

  return (
    <div className="p-6 space-y-5">

      {/* ─────────────────────────────────────────────────────────
          Header
      ───────────────────────────────────────────────────────── */}

      <PageHeader
        title={`Welcome back, ${
          currentUser?.name || "Officer"
        }`}
        subtitle="Officer Workspace • Real-time Civic SLA Monitoring"
      >
        <SecondaryBtn
          onClick={() => navigate("my-assignments")}
        >
          My Assignments
        </SecondaryBtn>

        <PrimaryBtn
          onClick={() => navigate("priority-queue")}
        >
          <span>+</span> View Priority Queue
        </PrimaryBtn>
      </PageHeader>

      {/* ─────────────────────────────────────────────────────────
          KPI Cards
      ───────────────────────────────────────────────────────── */}

      <div className="flex gap-3 overflow-x-auto pb-1">

        <KpiCard
          label="Total Grievances"
          value={String(grievances.length)}
        />

        <KpiCard
          label="High Priority"
          value={String(
            grievances.filter(
              (g) =>
                g.priority === "HIGH" ||
                g.priority === "CRITICAL"
            ).length
          )}
        />

        <KpiCard
          label="Due / Active"
          value={String(
            grievances.filter(
              (g) =>
                g.status !== "RESOLVED" &&
                g.status !== "CLOSED"
            ).length
          )}
        />

        <KpiCard
          label="Resolved"
          value={String(
            grievances.filter(
              (g) =>
                g.status === "RESOLVED" ||
                g.status === "CLOSED"
            ).length
          )}
        />

        <KpiCard
          label="SLA Breached"
          value={String(
            grievances.filter(
              (g) => g.sla?.breached === true
            ).length
          )}
        />

        <KpiCard
          label="Assigned"
          value={String(
            grievances.filter(
              (g) => g.assignedOfficer
            ).length
          )}
        />

      </div>

      {/* ─────────────────────────────────────────────────────────
          Main content
      ───────────────────────────────────────────────────────── */}

      <div className="grid grid-cols-3 gap-5">

        {/* LEFT */}
        <div className="col-span-2 space-y-5">

          {/* ─────────────────────────────────────────────────────
              Real grievance list
          ───────────────────────────────────────────────────── */}

          <SectionCard
            title="Recent Grievances"
            subtitle="Latest grievances from the platform"
            extra={
              <GhostBtn
                onClick={() =>
                  navigate("priority-queue")
                }
              >
                View all →
              </GhostBtn>
            }
          >

            {loadingGrievances ? (

              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">
                  Loading grievances...
                </p>
              </div>

            ) : grievanceError ? (

              <div className="py-12 text-center">
                <p className="text-sm text-red-600">
                  Unable to load grievances
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {grievanceError}
                </p>
              </div>

            ) : grievances.length === 0 ? (

              <div className="py-12 text-center">
                <p className="text-sm text-slate-500">
                  No grievances found.
                </p>
              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">

                      {[
                        "ID",
                        "Category",
                        "Priority",
                        "Status",
                        "Assigned",
                        "Created",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left font-medium pb-2 pr-3"
                        >
                          {h}
                        </th>
                      ))}

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">

                    {grievances
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(
                            b.createdAt
                          ).getTime() -
                          new Date(
                            a.createdAt
                          ).getTime()
                      )
                      .slice(0, 6)
                      .map((g) => {

                        const createdDate = g.createdAt
                          ? new Date(
                              g.createdAt
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                              }
                            )
                          : "—";

                        const assignedName =
                          typeof g.assignedOfficer ===
                          "object"
                            ? g.assignedOfficer?.name
                            : g.assignedOfficer
                              ? "Assigned"
                              : "Unassigned";

                        return (
                          <tr
                            key={
                              g._id ||
                              g.grievanceId
                            }
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                            onClick={() =>
                              navigate(
                                `grievance-detail:${g._id || g.grievanceId}`
                              )
                            }
                          >

                            <td className="py-2.5 pr-3 font-mono text-xs text-blue-600 font-semibold">
                              {g.grievanceId ||
                                g._id}
                            </td>

                            <td className="py-2.5 pr-3 text-slate-700 dark:text-slate-300 text-xs">
                              {g.category ||
                                "Uncategorized"}
                            </td>

                            <td className="py-2.5 pr-3">
                              <PriorityBadge
                                priority={
                                  g.priority ||
                                  "MEDIUM"
                                }
                              />
                            </td>

                            <td className="py-2.5 pr-3">
                              <StatusBadge
                                status={
                                  g.status ||
                                  "SUBMITTED"
                                }
                              />
                            </td>

                            <td className="py-2.5 pr-3 text-xs text-slate-500">
                              {assignedName}
                            </td>

                            <td className="py-2.5 text-xs text-slate-500">
                              {createdDate}
                            </td>

                          </tr>
                        );
                      })}

                  </tbody>

                </table>

              </div>

            )}

          </SectionCard>

          {/* ─────────────────────────────────────────────────────
              Dynamic Grievance Trends
          ───────────────────────────────────────────────────── */}

          <SectionCard
            title="Grievance Trends"
            subtitle="Monthly submitted vs resolved volume"
          >

            <ChartLegend
              items={[
                {
                  color: "#2563eb",
                  label: "Submitted",
                },
                {
                  color: "#16a34a",
                  label: "Resolved",
                },
              ]}
            />

            <ResponsiveContainer
              width="100%"
              height={200}
            >

              <LineChart
                data={trendData}
                margin={{
                  top: 4,
                  right: 4,
                  left: -20,
                  bottom: 0,
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                />

                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                    fill: "#94a3b8",
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border:
                      "1px solid #e2e8f0",
                    fontSize: 12,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="submitted"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  name="Submitted"
                />

                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                  name="Resolved"
                />

              </LineChart>

            </ResponsiveContainer>

          </SectionCard>

        </div>

        {/* RIGHT */}
        <div className="space-y-4">

          {/* ─────────────────────────────────────────────────────
              SLA
          ───────────────────────────────────────────────────── */}

          <SectionCard title="SLA Compliance Status">
  {(() => {
    const now = Date.now();

    const assignedCount = grievances.filter(
      (g) => Boolean(g.assignedOfficer)
    ).length;

    const breachedCount = grievances.filter(
      (g) => g?.sla?.breached === true
    ).length;

    const nearSlaCount = grievances.filter((g) => {
      if (!g?.sla?.dueAt) return false;
      if (g?.sla?.breached === true) return false;

      const dueAt = new Date(g.sla.dueAt).getTime();
      const remaining = dueAt - now;

      return remaining > 0 && remaining <= 24 * 60 * 60 * 1000;
    }).length;

    const withinSlaCount = grievances.filter((g) => {
      if (!g?.sla?.dueAt) return false;
      if (g?.sla?.breached === true) return false;

      const dueAt = new Date(g.sla.dueAt).getTime();

      return (
        dueAt - now > 24 * 60 * 60 * 1000
      );
    }).length;

    const slaChartData = [
      {
        name: "Within SLA",
        value: withinSlaCount,
        color: "#16a34a",
      },
      {
        name: "Near SLA",
        value: nearSlaCount,
        color: "#d97706",
      },
      {
        name: "Breached",
        value: breachedCount,
        color: "#dc2626",
      },
    ];

    return (
      <>
        <div className="relative flex justify-center mb-4">
          <PieChart width={160} height={160}>
            <Pie
              data={slaChartData}
              innerRadius={45}
              outerRadius={72}
              dataKey="value"
              stroke="none"
            >
              {slaChartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                />
              ))}
            </Pie>
          </PieChart>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {assignedCount}
            </span>

            <span className="text-xs text-slate-500">
              Assigned
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {slaChartData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: item.color,
                  }}
                />

                <span className="text-slate-600 dark:text-slate-400">
                  {item.name}
                </span>
              </div>

              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </>
    );
  })()}
</SectionCard>

          {/* ─────────────────────────────────────────────────────
              AI Insight
              Keep this static for now because you asked not to
              make AI-related changes yet.
          ───────────────────────────────────────────────────── */}

          <AiInsightCard
            title="AI-Assisted Dispatch Insight"
            text={
              <>
                AI analysis is available when
                grievance analysis is enabled.
              </>
            }
            disclaimer="AI insight • Verify field conditions before action"
            actions={
              <>
                <button className="text-xs bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-800">
                  Accept
                </button>

                <button className="text-xs border border-blue-300 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                  Override
                </button>
              </>
            }
          />

          {/* ─────────────────────────────────────────────────────
              Recent activity
          ───────────────────────────────────────────────────── */}

          <SectionCard title="Recent Activity Timeline">
  {(() => {
    const activities = grievances
      .flatMap((grievance: any) => {
        const timeline = Array.isArray(grievance.timeline)
          ? grievance.timeline
          : [];

        return timeline.map((event: any) => ({
          grievance,
          event,
        }));
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(
          a.event?.timestamp || a.grievance?.updatedAt || a.grievance?.createdAt
        ).getTime();

        const dateB = new Date(
          b.event?.timestamp || b.grievance?.updatedAt || b.grievance?.createdAt
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);

    if (activities.length === 0) {
      return (
        <div className="py-6 text-center">
          <p className="text-sm text-slate-500">
            No recent activity available.
          </p>
        </div>
      );
    }

    return (
      <Timeline
        steps={activities.map(
          ({ grievance, event }: any) => {
            const timestamp = new Date(
              event?.timestamp ||
                grievance?.updatedAt ||
                grievance?.createdAt
            );

            const time = timestamp.toLocaleString(
              "en-IN",
              {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            const status =
              event?.status ||
              grievance?.status ||
              "SUBMITTED";

            let label = "Grievance Update";

            if (status === "SUBMITTED") {
              label = "Grievance Submitted";
            } else if (status === "ASSIGNED") {
              label = "Grievance Assigned";
            } else if (status === "UNDER_REVIEW") {
              label = "Under Review";
            } else if (status === "IN_PROGRESS") {
              label = "Work In Progress";
            } else if (status === "RESOLVED") {
              label = "Grievance Resolved";
            } else if (status === "REOPENED") {
              label = "Grievance Reopened";
            } else if (status === "REJECTED") {
              label = "Grievance Rejected";
            } else if (status === "CLOSED") {
              label = "Grievance Closed";
            }

            return {
              label,
              desc:
                event?.message ||
                `${grievance?.grievanceId || "Grievance"} — ${
                  grievance?.title || "Civic complaint"
                }`,
              time,
              done:
                status === "RESOLVED" ||
                status === "CLOSED",
            };
          }
        )}
      />
    );
  })()}
</SectionCard>

        </div>

      </div>

    </div>
  );
}

// ─── My Assignments ────────────────────────────────────────────────────────────
export function OfficerMyAssignments({
  navigate,
}: {
  navigate: (screen: string) => void;
}) {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadAssignments = async () => {
      try {
        setLoading(true);
        setError("");

        const user = await getCurrentUser();

        if (!user) {
          throw new Error("Unable to identify the logged-in officer.");
        }

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await getMyGrievances(token);

        const allGrievances = response?.grievances || [];

        const officerId = String(user._id || user.id);

        const assigned = allGrievances.filter((grievance: any) => {
          const assignedOfficer = grievance.assignedOfficer;

          if (!assignedOfficer) {
            return false;
          }

          const assignedOfficerId = String(
            typeof assignedOfficer === "object"
              ? assignedOfficer._id
              : assignedOfficer
          );

          return assignedOfficerId === officerId;
        });

        if (mounted) {
          setCurrentUser(user);
          setGrievances(assigned);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load assignments."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAssignments();

    return () => {
      mounted = false;
    };
  }, []);

  const formatDate = (date: string) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title="My Assignments"
          subtitle="Grievances currently assigned to you"
        />

        <SectionCard>
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-slate-500">
              Loading your assignments...
            </p>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-5">
        <PageHeader
          title="My Assignments"
          subtitle="Grievances currently assigned to you"
        />

        <SectionCard>
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-red-600">
              Unable to load assignments
            </p>

            <p className="text-xs text-slate-500 mt-2">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-xs bg-[#0f2b4e] text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="My Assignments"
        subtitle={
          currentUser?.name
            ? `Grievances currently assigned to ${currentUser.name}`
            : "Grievances currently assigned to you"
        }
      >
        <SecondaryBtn onClick={() => navigate("officer-dashboard")}>
          ← Dashboard
        </SecondaryBtn>

        <PrimaryBtn onClick={() => window.location.reload()}>
          Refresh
        </PrimaryBtn>
      </PageHeader>

      {/* Summary */}
      <div className="flex gap-3">
        <KpiCard
          label="Assigned to Me"
          value={String(grievances.length)}
        />

        <KpiCard
          label="Critical"
          value={String(
            grievances.filter(
              (g) => g.priority === "CRITICAL"
            ).length
          )}
        />

        <KpiCard
          label="High Priority"
          value={String(
            grievances.filter(
              (g) => g.priority === "HIGH"
            ).length
          )}
        />

        <KpiCard
          label="In Progress"
          value={String(
            grievances.filter(
              (g) =>
                g.status === "IN_PROGRESS" ||
                g.status === "UNDER_REVIEW" ||
                g.status === "ASSIGNED"
            ).length
          )}
        />
      </div>

      <SectionCard
        title="Assigned Grievances"
        subtitle="Only grievances assigned directly to you are shown here"
      >
        {grievances.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">✓</div>

            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              No grievances assigned to you
            </p>

            <p className="text-xs text-slate-500 mt-1">
              New assignments will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left font-medium pb-3 pr-4">
                    Grievance ID
                  </th>

                  <th className="text-left font-medium pb-3 pr-4">
                    Complaint
                  </th>

                  <th className="text-left font-medium pb-3 pr-4">
                    Category
                  </th>

                  <th className="text-left font-medium pb-3 pr-4">
                    Priority
                  </th>

                  <th className="text-left font-medium pb-3 pr-4">
                    Status
                  </th>

                  <th className="text-left font-medium pb-3 pr-4">
                    Submitted
                  </th>

                  <th className="text-left font-medium pb-3">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {grievances.map((grievance: any) => (
                  <tr
                    key={grievance._id || grievance.grievanceId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-3 pr-4">
                      <span className="font-mono text-xs text-blue-600 font-semibold">
                        {grievance.grievanceId}
                      </span>
                    </td>

                    <td className="py-3 pr-4 max-w-xs">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {grievance.title || "Untitled grievance"}
                      </p>

                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        {grievance.description || "No description"}
                      </p>
                    </td>

                    <td className="py-3 pr-4">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {grievance.category || "Uncategorized"}
                      </span>
                    </td>

                    <td className="py-3 pr-4">
                      <PriorityBadge
                        priority={
                          grievance.priority || "MEDIUM"
                        }
                      />
                    </td>

                    <td className="py-3 pr-4">
                      <StatusBadge
                        status={grievance.status || "SUBMITTED"}
                      />
                    </td>

                    <td className="py-3 pr-4">
                      <span className="text-xs text-slate-500">
                        {formatDate(grievance.createdAt)}
                      </span>
                    </td>

                    <td className="py-3">
                      <button
                        onClick={() =>
                          navigate(`grievance-detail:${grievance._id || grievance.grievanceId}`)
                        }
                        className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Priority Queue ───────────────────────────────────────────────────────────
export function PriorityQueue({
  navigate,
}: {
  navigate: (screen: string) => void;
}) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [grievances, setGrievances] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filters = ["All", "Critical", "High", "Medium", "Low"];

  useEffect(() => {
    let mounted = true;

    const loadPriorityQueue = async () => {
      try {
        setLoading(true);
        setError("");

        const user = await getCurrentUser();

        if (!user) {
          throw new Error("Unable to identify the logged-in officer.");
        }

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await getMyGrievances(token);
        const allGrievances = response?.grievances || [];

        /*
         * The backend already restricts officer grievance access
         * according to the logged-in officer's department.
         *
         * We therefore use the returned grievances and sort them
         * locally for the priority queue.
         */
        const priorityOrder: Record<string, number> = {
          CRITICAL: 4,
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1,
        };

        const sorted = [...allGrievances].sort((a, b) => {
          const priorityA =
            priorityOrder[String(a.priority || "MEDIUM").toUpperCase()] || 0;

          const priorityB =
            priorityOrder[String(b.priority || "MEDIUM").toUpperCase()] || 0;

          if (priorityA !== priorityB) {
            return priorityB - priorityA;
          }

          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        });

        if (mounted) {
          setCurrentUser(user);
          setGrievances(sorted);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load priority queue."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadPriorityQueue();

    return () => {
      mounted = false;
    };
  }, []);

  const getPriority = (grievance: any) => {
    return String(grievance.priority || "MEDIUM").toUpperCase();
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "Critical";
      case "HIGH":
        return "High";
      case "LOW":
        return "Low";
      default:
        return "Medium";
    }
  };

  const getAiScore = (grievance: any) => {
    const score = grievance?.aiAnalysis?.priorityScore;

    return typeof score === "number" ? score : null;
  };

  const getAssignedOfficer = (grievance: any) => {
    const officer = grievance?.assignedOfficer;

    if (!officer) {
      return "Unassigned";
    }

    if (typeof officer === "object") {
      return officer.name || officer.email || "Assigned";
    }

    return "Assigned";
  };

  const getSlaInfo = (grievance: any) => {
    const dueAt = grievance?.sla?.dueAt;

    if (!dueAt) {
      return {
        status: "ok" as const,
        remaining: "Not set",
      };
    }

    const due = new Date(dueAt).getTime();
    const now = Date.now();
    const difference = due - now;

    if (grievance?.sla?.breached || difference <= 0) {
      return {
        status: "breach" as const,
        remaining: "Breached",
      };
    }

    const totalHours = Math.floor(difference / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days > 0) {
      return {
        status: "ok" as const,
        remaining: `${days}d ${hours}h left`,
      };
    }

    if (hours <= 6) {
      return {
        status: "warn" as const,
        remaining: `${hours}h left`,
      };
    }

    return {
      status: "ok" as const,
      remaining: `${hours}h left`,
    };
  };

  const formatDate = (date: string) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredGrievances = grievances.filter((grievance) => {
    if (activeFilter === "All") {
      return true;
    }

    return getPriorityLabel(getPriority(grievance)) === activeFilter;
  });

  if (loading) {
    return (
      <div className="p-6 space-y-5">
        <PageHeader
          title="Priority Queue"
          subtitle="Highest-priority grievances in your department"
        />

        <SectionCard>
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-slate-500">
              Loading priority queue...
            </p>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-5">
        <PageHeader
          title="Priority Queue"
          subtitle="Highest-priority grievances in your department"
        />

        <SectionCard>
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-red-600">
              Unable to load priority queue
            </p>

            <p className="text-xs text-slate-500 mt-2">
              {error}
            </p>

            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-xs bg-[#0f2b4e] text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Priority Queue"
        subtitle={
          currentUser?.name
            ? `Highest-priority grievances for ${currentUser.name}'s department`
            : "Highest-priority grievances in your department"
        }
      >
        <SecondaryBtn onClick={() => navigate("officer-dashboard")}>
          ← Dashboard
        </SecondaryBtn>

        <PrimaryBtn onClick={() => window.location.reload()}>
          Refresh
        </PrimaryBtn>

        <PrimaryBtn onClick={() => navigate("geo-intelligence")}>
          🗺 View on Map
        </PrimaryBtn>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 font-medium">
          Filter by priority:
        </span>

        {filters.map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            active={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
          />
        ))}
      </div>

      {/* Queue */}
      <SectionCard
        title="Department Priority Queue"
        subtitle={`${filteredGrievances.length} grievance${
          filteredGrievances.length === 1 ? "" : "s"
        } shown`}
      >
        {filteredGrievances.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">✓</div>

            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              No grievances in this queue
            </p>

            <p className="text-xs text-slate-500 mt-1">
              There are currently no grievances matching this priority filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  {[
                    "Grievance ID",
                    "Complaint",
                    "Category",
                    "Priority",
                    "AI Score",
                    "SLA",
                    "Status",
                    "Assigned",
                    "Submitted",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="text-left font-medium pb-3 pr-3"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {filteredGrievances.map((grievance) => {
                  const priority = getPriority(grievance);
                  const aiScore = getAiScore(grievance);
                  const sla = getSlaInfo(grievance);

                  return (
                    <tr
                      key={grievance._id || grievance.grievanceId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      {/* ID */}
                      <td className="py-3 pr-3">
                        <span className="font-mono text-xs text-blue-600 font-semibold">
                          {grievance.grievanceId || "—"}
                        </span>
                      </td>

                      {/* Complaint */}
                      <td className="py-3 pr-3 max-w-xs">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {grievance.title || "Untitled grievance"}
                        </p>

                        <p className="text-[11px] text-slate-400 mt-1 truncate">
                          {grievance.description || "No description"}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="py-3 pr-3">
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {grievance.category || "Uncategorized"}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 pr-3">
                        <PriorityBadge
                          priority={getPriorityLabel(priority)}
                        />
                      </td>

                      {/* AI Score */}
                      <td className="py-3 pr-3">
                        {aiScore !== null ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${aiScore}%`,
                                  background:
                                    aiScore > 85
                                      ? "#ef4444"
                                      : aiScore > 70
                                      ? "#f59e0b"
                                      : "#3b82f6",
                                }}
                              />
                            </div>

                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {aiScore}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            —
                          </span>
                        )}
                      </td>

                      {/* SLA */}
                      <td className="py-3 pr-3">
                        <SlaIndicator
                          status={sla.status}
                          remaining={sla.remaining}
                        />
                      </td>

                      {/* Status */}
                      <td className="py-3 pr-3">
                        <StatusBadge
                          status={grievance.status || "SUBMITTED"}
                        />
                      </td>

                      {/* Assigned */}
                      <td className="py-3 pr-3">
                        <span className="text-xs text-slate-500">
                          {getAssignedOfficer(grievance)}
                        </span>
                      </td>

                      {/* Submitted */}
                      <td className="py-3 pr-3">
                        <span className="text-xs text-slate-500">
                          {formatDate(grievance.createdAt)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3">
                        <button
                          onClick={() =>
                            navigate(`grievance-detail:${grievance._id || grievance.grievanceId}`)
                          }
                          className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Grievance Detail (Officer) ───────────────────────────────────────────────
export function OfficerGrievanceDetail({
  navigate,
  grievanceId,
}: {
  navigate: (screen: string) => void;
  grievanceId?: string;
}) {
  const [currentUser, setCurrentUser] = useState<{ name: string } | null>(null);
  const [grievance, setGrievance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"overview" | "ai" | "communication" | "resolution">("overview");
  const [humanPriority, setHumanPriority] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
const [messageText, setMessageText] = useState("");
const [messagesLoading, setMessagesLoading] = useState(false);
const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((user) => setCurrentUser(user))
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadGrievance = async () => {
      try {
        if (!grievanceId) throw new Error("No grievance ID was provided.");

        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token not found.");

        const response = await getGrievanceById(token, grievanceId);
        const data = response?.grievance || response;

        if (mounted) {
          setGrievance(data);
          setHumanPriority(data?.priority || "MEDIUM");
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load grievance.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadGrievance();
    return () => { mounted = false; };
  }, [grievanceId]);

  useEffect(() => {
  const loadMessages = async () => {
    if (!grievanceId) return;

    try {
      setMessagesLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const response = await getGrievanceMessages(
        token,
        grievanceId
      );

      setMessages(response?.messages || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  loadMessages();
}, [grievanceId]);

const handleSendMessage = async () => {
  console.log("SEND BUTTON CLICKED");
  console.log("grievanceId:", grievanceId);
  console.log("messageText:", messageText);

  if (!messageText.trim() || !grievanceId) {
    console.log("RETURNED: missing message or grievanceId");
    return;
  }

  try {
    setSendingMessage(true);

    const token = localStorage.getItem("token");

    console.log("Token exists:", !!token);
    console.log("Sending request...");

    if (!token) {
      throw new Error("Authentication token not found.");
    }

    const response = await sendGrievanceMessage(
      token,
      grievanceId,
      messageText.trim()
    );

    console.log("BACKEND RESPONSE:", response);

    if (response?.sentMessage) {
      setMessages((prev) => [
        ...prev,
        response.sentMessage,
      ]);
    }

    setMessageText("");
  } catch (err) {
    console.error("FAILED TO SEND MESSAGE:", err);

    alert(
      err instanceof Error
        ? err.message
        : "Failed to send message"
    );
  } finally {
    setSendingMessage(false);
  }
};
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-slate-500">Loading grievance...</p>
      </div>
    );
  }

  if (error || !grievance) {
    return (
      <div className="p-6">
        <SectionCard>
          <div className="py-8 text-center">
            <h2 className="font-semibold text-slate-900 dark:text-white">Unable to load grievance</h2>
            <p className="text-sm text-red-600 mt-2">{error || "Grievance not found."}</p>
            <button
              onClick={() => navigate("priority-queue")}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              ← Back to Priority Queue
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  const priorityScore = grievance?.aiAnalysis?.priorityScore;
  const department = typeof grievance.department === "object"
    ? grievance.department?.name || grievance.department?.code
    : grievance.department;
  const officer = typeof grievance.assignedOfficer === "object"
    ? grievance.assignedOfficer?.name
    : grievance.assignedOfficer;

  const slaDue = grievance?.sla?.dueAt ? new Date(grievance.sla.dueAt) : null;
  const slaBreached = grievance?.sla?.breached === true || (slaDue && slaDue.getTime() <= Date.now());
  const slaRemaining = slaDue
    ? slaBreached
      ? "Breached"
      : (() => {
          const minutes = Math.floor((slaDue.getTime() - Date.now()) / 60000);
          const days = Math.floor(minutes / 1440);
          const hours = Math.floor((minutes % 1440) / 60);
          const mins = minutes % 60;
          return days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        })()
    : "Not set";

  const timelineSteps = Array.isArray(grievance.timeline) && grievance.timeline.length > 0
    ? grievance.timeline.map((event: any) => ({
        label: event.status || "Update",
        desc: event.message || "Grievance updated",
        time: event.timestamp ? new Date(event.timestamp).toLocaleString("en-IN") : "—",
        done: ["RESOLVED", "CLOSED"].includes(event.status),
      }))
    : [{
        label: grievance.status || "SUBMITTED",
        desc: "Grievance submitted",
        time: grievance.createdAt ? new Date(grievance.createdAt).toLocaleString("en-IN") : "—",
        done: false,
      }];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate("priority-queue")} className="mt-1 text-slate-400 hover:text-slate-700 text-sm">← Back</button>
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {grievance.grievanceId || grievance._id} — {grievance.title || "Untitled grievance"}
              </h1>
              <StatusBadge status={grievance.status || "SUBMITTED"} />
              <PriorityBadge priority={grievance.priority || "MEDIUM"} />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-slate-500">
                {grievance.category || "General"} • {grievance.location?.city || "Location unavailable"} • Reported {grievance.createdAt ? new Date(grievance.createdAt).toLocaleString("en-IN") : "Unknown"}
              </span>
              {typeof priorityScore === "number" && (
                <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                  <span className="text-xs font-bold text-blue-700">AI Score: {priorityScore}/100</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-0 bg-slate-100 rounded-lg p-1 w-fit">
        {(["overview", "ai", "communication", "resolution"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "ai" ? "AI Intelligence" : t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            {grievance.aiAnalysis?.summary && (
              <AiInsightCard
                title="AI-Generated Complaint Summary"
                text={grievance.aiAnalysis.summary}
                disclaimer="AI-generated summary • Verify before taking official action"
              />
            )}

            <SectionCard
              title="Complaint Information"
              subtitle={grievance.description || "No description available."}
            >
              <div className="grid grid-cols-2 gap-5 text-sm">
                <div><p className="text-xs text-slate-400">Department</p><p className="font-semibold mt-1">{department || "Unassigned"}</p></div>
                <div><p className="text-xs text-slate-400">Assigned Officer</p><p className="font-semibold mt-1">{officer || "Unassigned"}</p></div>
                <div><p className="text-xs text-slate-400">Subcategory</p><p className="font-semibold mt-1">{grievance.subcategory || "Not specified"}</p></div>
                <div><p className="text-xs text-slate-400">Citizen</p><p className="font-semibold mt-1">{typeof grievance.citizen === "object" ? grievance.citizen?.name || grievance.citizen?.email : grievance.citizen || "—"}</p></div>
              </div>
            </SectionCard>

            <SectionCard title="Complaint Location">
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><p className="text-xs text-slate-400">Address</p><p className="font-medium mt-1">{grievance.location?.address || "Not provided"}</p></div>
                <div><p className="text-xs text-slate-400">City / State</p><p className="font-medium mt-1">{[grievance.location?.city, grievance.location?.state].filter(Boolean).join(", ") || "Not provided"}</p></div>
              </div>
              <MapSvg mode="markers" height={240} showLocationPicker={false} />
            </SectionCard>

            <SectionCard title="Case Timeline">
              <Timeline steps={timelineSteps} />
            </SectionCard>
          </div>

          <div className="space-y-4">
            <SectionCard title="SLA Status">
              <div className="space-y-3 text-sm">
                <div><p className="text-xs text-slate-400">Deadline</p><p className="font-semibold mt-1">{slaDue ? slaDue.toLocaleString("en-IN") : "No SLA deadline"}</p></div>
                <div><p className="text-xs text-slate-400">Remaining</p><p className={`font-bold text-lg ${slaBreached ? "text-red-600" : "text-green-600"}`}>{slaRemaining}</p></div>
                <SlaIndicator status={slaBreached ? "breach" : "ok"} remaining={slaRemaining} />
              </div>
            </SectionCard>

            <SectionCard title="Assignment">
              <div className="space-y-3 text-sm">
                <div><p className="text-xs text-slate-400">Department</p><p className="font-semibold mt-1">{department || "Unassigned"}</p></div>
                <div><p className="text-xs text-slate-400">Officer</p><p className="font-semibold mt-1">{officer || "Unassigned"}</p></div>
                <div><p className="text-xs text-slate-400">Status</p><p className="font-semibold mt-1">{grievance.status || "SUBMITTED"}</p></div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "ai" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 space-y-4">
            <SectionCard title="AI Analysis">
              {grievance.aiAnalysis ? (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-slate-400">Category</p><p className="font-semibold mt-1">{grievance.aiAnalysis.category || "—"}</p></div>
                    <div><p className="text-xs text-slate-400">Subcategory</p><p className="font-semibold mt-1">{grievance.aiAnalysis.subcategory || "—"}</p></div>
                    <div><p className="text-xs text-slate-400">Department</p><p className="font-semibold mt-1">{grievance.aiAnalysis.department || "—"}</p></div>
                    <div><p className="text-xs text-slate-400">Confidence</p><p className="font-semibold mt-1">{typeof grievance.aiAnalysis.confidence === "number" ? `${Math.round(grievance.aiAnalysis.confidence * 100)}%` : "—"}</p></div>
                  </div>
                  <div><p className="text-xs text-slate-400">Priority Reason</p><p className="mt-1">{grievance.aiAnalysis.priorityReason || "Not available"}</p></div>
                  <div><p className="text-xs text-slate-400">Summary</p><p className="mt-1">{grievance.aiAnalysis.summary || "Not available"}</p></div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">AI analysis is not available for this grievance.</p>
              )}
            </SectionCard>

            <SectionCard title="Officer Decision">
              <div className="space-y-3">
                <select value={humanPriority} onChange={(e) => setHumanPriority(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
                </select>
                <textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} rows={3} placeholder="Explain your decision..." className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none" />
              </div>
            </SectionCard>
          </div>
        </div>
      )}

        {tab === "communication" && (
  <div className="grid grid-cols-3 gap-5">
    <div className="col-span-2">
      <div className="bg-red-600 text-white p-4 text-xl font-bold">
  THIS IS THE OFFICER FILE
</div>
      <SectionCard title="Communication">
        <div className="space-y-4">
          {messagesLoading ? (
            <p className="text-sm text-slate-500">
              Loading messages...
            </p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-500">
              No messages yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((msg: any, index: number) => (
                <div
                  key={msg._id || index}
                  className="border border-slate-200 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {msg.sender?.name ||
                        msg.senderRole ||
                        "User"}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      {msg.timestamp
                        ? new Date(
                            msg.timestamp
                          ).toLocaleString("en-IN")
                        : ""}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <input
              value={messageText}
              onChange={(e) =>
                setMessageText(e.target.value)
              }
              placeholder="Type a message..."
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            />

                        <button
  type="button"
  onClick={() => alert("CLICK WORKS")}
  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
>
  TEST SEND
</button>
                      
          </div>
        </div>
      </SectionCard>
    </div>

    <SectionCard title="Internal Notes">
      <p className="text-sm text-slate-500">
        Internal notes are not implemented yet.
      </p>
    </SectionCard>
  </div>
)}

      {tab === "resolution" && (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2">
            <SectionCard title="Resolution">
              <div className="space-y-4 text-sm">
                <div><p className="text-xs text-slate-400">Resolution message</p><p className="mt-1">{grievance.resolution?.message || "No resolution submitted yet."}</p></div>
                <div><p className="text-xs text-slate-400">Resolved at</p><p className="mt-1">{grievance.resolution?.resolvedAt ? new Date(grievance.resolution.resolvedAt).toLocaleString("en-IN") : "Not resolved"}</p></div>
                <div><p className="text-xs text-slate-400">Feedback</p><p className="mt-1">{grievance.feedback?.comment || "No citizen feedback yet."}</p></div>
              </div>
            </SectionCard>
          </div>
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
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGrievances = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const data = await getMyGrievances(token);

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.grievances)
          ? data.grievances
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setGrievances(items);
      } catch (err: any) {
        console.error("Failed to load SLA grievances:", err);
        setError(err.message || "Failed to load grievances");
      } finally {
        setLoading(false);
      }
    };

    loadGrievances();
  }, []);

  const getDepartmentName = (grievance: any) => {
    if (!grievance.department) return "Unassigned";

    if (typeof grievance.department === "string") {
      return grievance.department;
    }

    return (
      grievance.department.name ||
      grievance.department.code ||
      "Unassigned"
    );
  };

  const getOfficerName = (grievance: any) => {
    if (!grievance.assignedOfficer) return "Unassigned";

    if (typeof grievance.assignedOfficer === "string") {
      return grievance.assignedOfficer;
    }

    return grievance.assignedOfficer.name || "Unassigned";
  };

  const getSlaInfo = (grievance: any) => {
    const dueAt = grievance?.sla?.dueAt;

    if (grievance?.sla?.breached) {
      return {
        status: "breach" as const,
        label: "Breached",
        remaining: "Breached",
      };
    }

    if (!dueAt) {
      return {
        status: "ok" as const,
        label: "No SLA",
        remaining: "Not set",
      };
    }

    const now = Date.now();
    const deadline = new Date(dueAt).getTime();
    const difference = deadline - now;

    if (difference <= 0) {
      return {
        status: "breach" as const,
        label: "Breached",
        remaining: "Breached",
      };
    }

    const totalHours = difference / (1000 * 60 * 60);

    const days = Math.floor(totalHours / 24);
    const hours = Math.floor(totalHours % 24);
    const minutes = Math.floor(
      (difference / (1000 * 60)) % 60
    );

    let remaining = "";

    if (days > 0) {
      remaining = `${days}d ${hours}h`;
    } else {
      remaining = `${hours}h ${minutes}m`;
    }

    if (totalHours <= 24) {
      return {
        status: "warn" as const,
        label: "Nearing",
        remaining,
      };
    }

    return {
      status: "ok" as const,
      label: "Within SLA",
      remaining,
    };
  };

  const formatDeadline = (date: string | undefined) => {
    if (!date) return "Not set";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Not set";
    }

    return parsed.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const resolvedGrievances = grievances.filter(
    (g) =>
      g.status === "RESOLVED" &&
      g.resolution?.resolvedAt
  );

  const averageResolutionTime = (() => {
    if (resolvedGrievances.length === 0) {
      return "—";
    }

    const totalHours = resolvedGrievances.reduce(
      (total, grievance) => {
        const start = new Date(grievance.createdAt).getTime();
        const end = new Date(
          grievance.resolution.resolvedAt
        ).getTime();

        if (Number.isNaN(start) || Number.isNaN(end)) {
          return total;
        }

        return total + (end - start) / (1000 * 60 * 60);
      },
      0
    );

    const averageHours =
      totalHours / resolvedGrievances.length;

    if (averageHours >= 24) {
      return `${(averageHours / 24).toFixed(1)} days`;
    }

    return `${averageHours.toFixed(1)} hrs`;
  })();

  const slaStats = grievances.reduce(
    (stats, grievance) => {
      const sla = getSlaInfo(grievance);

      if (sla.status === "breach") {
        stats.breached++;
      } else if (sla.status === "warn") {
        stats.nearDeadline++;
      } else {
        stats.withinSla++;
      }

      return stats;
    },
    {
      withinSla: 0,
      nearDeadline: 0,
      breached: 0,
    }
  );

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="SLA Monitoring"
        subtitle="Track service level agreement compliance across all assignments"
      />

      <div className="flex gap-3 overflow-x-auto">
        <KpiCard
          label="Within SLA"
          value={String(slaStats.withinSla)}
          trend="Live"
          trendUp={true}
        />

        <KpiCard
          label="Near Deadline"
          value={String(slaStats.nearDeadline)}
          trend="Live"
          trendUp={false}
        />

        <KpiCard
          label="Breached"
          value={String(slaStats.breached)}
          trend="Live"
          trendUp={false}
        />

        <KpiCard
          label="Avg Resolution Time"
          value={averageResolutionTime}
          trend="Live"
          trendUp={true}
        />
      </div>

      <SectionCard title="SLA Status Board">
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Loading SLA information...
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-600">
            {error}
          </div>
        ) : grievances.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            No grievances available for SLA monitoring.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  {[
                    "Complaint ID",
                    "Priority",
                    "Department",
                    "Officer",
                    "SLA Deadline",
                    "Remaining",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left font-medium pb-3 pr-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {grievances.map((grievance) => {
                  const sla = getSlaInfo(grievance);

                  return (
                    <tr
                      key={grievance._id || grievance.grievanceId}
                      className={`hover:bg-slate-50 ${
                        sla.status === "breach"
                          ? "bg-red-50/40"
                          : sla.status === "warn"
                          ? "bg-amber-50/30"
                          : ""
                      }`}
                    >
                      <td className="py-3 pr-3 font-mono text-xs text-blue-600 font-semibold">
                        {grievance.grievanceId ||
                          grievance._id ||
                          "—"}
                      </td>

                      <td className="py-3 pr-3">
                        <PriorityBadge
                          priority={
                            grievance.priority || "MEDIUM"
                          }
                        />
                      </td>

                      <td className="py-3 pr-3 text-slate-700 text-xs">
                        {getDepartmentName(grievance)}
                      </td>

                      <td className="py-3 pr-3 text-slate-600 text-xs">
                        {getOfficerName(grievance)}
                      </td>

                      <td className="py-3 pr-3 text-slate-600 text-xs">
                        {formatDeadline(
                          grievance?.sla?.dueAt
                        )}
                      </td>

                      <td className="py-3 pr-3">
                        <SlaIndicator
                          status={sla.status}
                          remaining={sla.remaining}
                        />
                      </td>

                      <td className="py-3 pr-3">
                        <span
                          className={`text-xs font-medium ${
                            sla.status === "breach"
                              ? "text-red-600"
                              : sla.status === "warn"
                              ? "text-amber-600"
                              : "text-green-600"
                          }`}
                        >
                          {sla.status === "breach"
                            ? "🔴 Breached"
                            : sla.status === "warn"
                            ? "🟠 Nearing"
                            : "🟢 Within SLA"}
                        </span>
                      </td>

                      <td className="py-3">
                        <button
                          className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-0.5 hover:bg-blue-50"
                          onClick={() => {
                            console.log(
                              "View grievance:",
                              grievance.grievanceId ||
                                grievance._id
                            );
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── Escalations ─────────────────────────────────────────────────────────────
export function Escalations() {
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEscalations = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication token not found");
        }

        const data = await getMyGrievances(token);

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.grievances)
          ? data.grievances
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setGrievances(items);
      } catch (err: any) {
        console.error("Failed to load escalations:", err);
        setError(err.message || "Failed to load escalations");
      } finally {
        setLoading(false);
      }
    };

    loadEscalations();
  }, []);

  const escalatedGrievances = grievances.filter(
    (grievance) => grievance?.sla?.escalated === true
  );

  const getPriority = (grievance: any) =>
    grievance.priority || "MEDIUM";

  const getEscalationReason = (grievance: any) => {
    if (grievance?.sla?.breached) {
      return "SLA Exceeded";
    }

    if (grievance.priority === "CRITICAL") {
      return "Critical grievance";
    }

    return "Escalated grievance";
  };

  const getOfficerName = (grievance: any) => {
    if (!grievance.assignedOfficer) {
      return "System";
    }

    if (typeof grievance.assignedOfficer === "string") {
      return grievance.assignedOfficer;
    }

    return grievance.assignedOfficer.name || "Officer";
  };

  const getEscalatedTo = (grievance: any) => {
    const timeline = Array.isArray(grievance.timeline)
      ? grievance.timeline
      : [];

    const escalationEvent = [...timeline]
      .reverse()
      .find((event: any) =>
        String(event.message || "")
          .toLowerCase()
          .includes("escalat")
      );

    if (escalationEvent?.message) {
      return escalationEvent.message;
    }

    return "Higher Authority";
  };

  const getEscalationTime = (grievance: any) => {
    const timeline = Array.isArray(grievance.timeline)
      ? grievance.timeline
      : [];

    const escalationEvent = [...timeline]
      .reverse()
      .find((event: any) =>
        String(event.message || "")
          .toLowerCase()
          .includes("escalat")
      );

    const timestamp =
      escalationEvent?.timestamp ||
      grievance.updatedAt ||
      grievance.createdAt;

    if (!timestamp) return "";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) return "";

    const hoursAgo = Math.floor(
      (Date.now() - date.getTime()) /
        (1000 * 60 * 60)
    );

    if (hoursAgo < 1) {
      return "Just now";
    }

    if (hoursAgo < 24) {
      return `${hoursAgo}h ago`;
    }

    const daysAgo = Math.floor(hoursAgo / 24);

    return `${daysAgo}d ago`;
  };

  return (
    <div className="p-6 space-y-5">
      <PageHeader
        title="Escalation Management"
        subtitle="Track and manage escalated grievances through authority hierarchy"
      >
        <PrimaryBtn>
          + New Escalation
        </PrimaryBtn>
      </PageHeader>

      {/* Hierarchy */}
      <SectionCard title="Escalation Hierarchy">
        <div className="flex items-center gap-3 text-sm">
          {[
            "Officer",
            "Department Head",
            "District Officer",
            "Higher Authority",
          ].map((lvl, i) => (
            <div
              key={lvl}
              className="flex items-center gap-3"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                    i === 0
                      ? "bg-blue-600 text-white"
                      : i === 1
                      ? "bg-amber-100 text-amber-700"
                      : i === 2
                      ? "bg-red-100 text-red-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {lvl
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>

                <span className="text-[10px] text-slate-600 mt-1 text-center w-20 leading-tight">
                  {lvl}
                </span>
              </div>

              {i < 3 && (
                <span className="text-slate-300 text-lg mb-4">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Active Escalations">
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Loading escalations...
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-600">
            {error}
          </div>
        ) : escalatedGrievances.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            No active escalations.
          </div>
        ) : (
          <div className="space-y-3">
            {escalatedGrievances.map((grievance) => (
              <div
                key={
                  grievance._id ||
                  grievance.grievanceId
                }
                className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-blue-600 font-semibold">
                        {grievance.grievanceId ||
                          grievance._id}
                      </span>

                      <PriorityBadge
                        priority={getPriority(grievance)}
                      />

                      <StatusBadge
                        status={
                          grievance.status ||
                          "ESCALATED"
                        }
                      />
                    </div>

                    <p className="text-sm font-semibold text-slate-800 mt-0.5">
                      {grievance.title ||
                        "Untitled grievance"}
                    </p>
                  </div>

                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {getEscalationTime(grievance)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs text-slate-600 mb-3">
                  <div>
                    <p className="text-slate-400 dark:text-slate-500">
                      From
                    </p>
                    <p className="font-medium">
                      {getOfficerName(grievance)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 dark:text-slate-500">
                      Escalated To
                    </p>
                    <p className="font-medium">
                      {getEscalatedTo(grievance)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 dark:text-slate-500">
                      Reason
                    </p>
                    <p className="font-medium text-amber-700">
                      {getEscalationReason(grievance)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1 hover:bg-blue-50"
                    onClick={() => {
                      console.log(
                        "View escalated grievance:",
                        grievance.grievanceId ||
                          grievance._id
                      );
                    }}
                  >
                    View Details
                  </button>

                  <button
                    className="text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-1 hover:bg-slate-50 dark:bg-slate-900"
                    onClick={() => {
                      console.log(
                        "View escalation history:",
                        grievance.timeline
                      );
                    }}
                  >
                    View History
                  </button>

                  <button
                    className="text-xs text-red-600 border border-red-200 rounded-lg px-3 py-1 hover:bg-red-50"
                    onClick={() => {
                      console.log(
                        "Escalate further:",
                        grievance.grievanceId ||
                          grievance._id
                      );
                    }}
                  >
                    Escalate Further
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}