import { useState, useEffect } from "react";
import type { Role } from "./components/Shared";
import AuthScreens from "./screens/AuthScreens";
import { getCurrentUser } from "./screens/services/authService";
import { getUnreadNotificationCount } from "./screens/services/notificationService";
import Profile from "./screens/Profile";

// Citizen screens
import {
  CitizenDashboard,
  MyGrievances,
  SubmitGrievance,
  GrievanceDetail,
  CitizenNotifications,
} from "./screens/CitizenScreens";

// Officer screens
import {
  OfficerDashboard,
  OfficerMyAssignments,
  PriorityQueue,
  OfficerGrievanceDetail,
  GeoIntelligence,
  SLAMonitoring,
  Escalations,
} from "./screens/OfficerScreens";

// Admin screens
import {
  AdminDashboard,
  AllGrievances,
  Departments,
  AdminGeoIntelligence,
  ComplaintClusters,
  AIAnalytics,
  AuditLogs,
  Reports,
} from "./screens/AdminScreens";

// ─── Sidebar config ───────────────────────────────────────────────────────────

const SIDEBARS: Record<
  Role,
  {
    section: string;
    items: {
      icon: string;
      label: string;
      screen: string;
      badge?: number;
    }[];
  }[]
> = {
  citizen: [
    {
      section: "OVERVIEW",
      items: [
        {
          icon: "⊞",
          label: "Dashboard",
          screen: "dashboard",
        },
        {
          icon: "☰",
          label: "My Grievances",
          screen: "my-grievances",
        },
        {
          icon: "✦",
          label: "Submit Grievance",
          screen: "submit-grievance",
        },
        {
          icon: "🔔",
          label: "Notifications",
          screen: "notifications",
        },
      ],
    },
    {
      section: "SUPPORT",
      items: [
        {
          icon: "◎",
          label: "Help & Support",
          screen: "help",
        },
      ],
    },
    {
      section: "ACCOUNT",
      items: [
        {
          icon: "◯",
          label: "Profile",
          screen: "profile",
        },
        {
          icon: "◯",
          label: "Settings",
          screen: "settings",
        },
      ],
    },
  ],

  officer: [
    {
      section: "OVERVIEW",
      items: [
        {
          icon: "⊞",
          label: "Dashboard",
          screen: "dashboard",
        },
        {
          icon: "◎",
          label: "Priority Queue",
          screen: "priority-queue",
        },
        {
          icon: "◯",
          label: "My Assignments",
          screen: "my-assignments",
        },
        {
          icon: "☰",
          label: "All Grievances",
          screen: "all-grievances",
        },
      ],
    },
    {
      section: "OPERATIONS",
      items: [
        {
          icon: "◎",
          label: "SLA Monitoring",
          screen: "sla-monitoring",
        },
        {
          icon: "↗",
          label: "Escalations",
          screen: "escalations",
        },
        {
          icon: "🗺",
          label: "Geographic Intel.",
          screen: "geo-intelligence",
        },
        {
          icon: "▦",
          label: "Analytics",
          screen: "analytics",
        },
      ],
    },
    {
      section: "ACCOUNT",
      items: [
        {
          icon: "◯",
          label: "Profile",
          screen: "profile",
        },
        {
          icon: "◯",
          label: "Settings",
          screen: "settings",
        },
      ],
    },
  ],

  admin: [
    {
      section: "OVERVIEW",
      items: [
        {
          icon: "⊞",
          label: "Dashboard",
          screen: "dashboard",
        },
        {
          icon: "☰",
          label: "All Grievances",
          screen: "all-grievances",
        },
        {
          icon: "▦",
          label: "Analytics",
          screen: "analytics",
        },
      ],
    },
    {
      section: "MANAGEMENT",
      items: [
        {
          icon: "◎",
          label: "Departments",
          screen: "departments",
        },
        {
          icon: "◯",
          label: "Officers",
          screen: "officers",
        },
        {
          icon: "◯",
          label: "Citizens",
          screen: "citizens",
        },
        {
          icon: "🗺",
          label: "Geographic Intel.",
          screen: "geo-intelligence",
        },
        {
          icon: "◎",
          label: "Complaint Clusters",
          screen: "complaint-clusters",
        },
        {
          icon: "✦",
          label: "AI Insights",
          screen: "ai-analytics",
        },
        {
          icon: "◎",
          label: "SLA Management",
          screen: "sla-management",
        },
        {
          icon: "↗",
          label: "Escalations",
          screen: "escalations",
        },
        {
          icon: "▦",
          label: "Reports",
          screen: "reports",
        },
        {
          icon: "📋",
          label: "Audit Logs",
          screen: "audit-logs",
        },
      ],
    },
    {
      section: "ACCOUNT",
      items: [
        {
          icon: "◯",
          label: "Profile",
          screen: "profile",
        },
        {
          icon: "◯",
          label: "Settings",
          screen: "settings",
        },
      ],
    },
  ],
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  role,
  open,
  activeScreen,
  navigate,
}: {
  role: Role;
  open: boolean;
  activeScreen: string;
  navigate: (s: string) => void;
}) {
  const sections = SIDEBARS[role];

  return (
    <aside
      className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-200 flex-shrink-0"
      style={{
        width: open ? 236 : 0,
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#0f2b4e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          N
        </div>

        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight whitespace-nowrap">
            Nivara
          </div>

          <div className="text-[10px] text-slate-400 tracking-widest uppercase whitespace-nowrap">
            AI Civic Platform
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {sections.map((sec) => (
          <div key={sec.section}>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-widest px-2 mb-1 whitespace-nowrap">
              {sec.section}
            </p>

            {sec.items.map((item) => {
              const active = activeScreen === item.screen;

              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.screen)}
                  className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors text-left whitespace-nowrap ${
                    active
                      ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <span className="text-sm w-4 text-center flex-shrink-0">
                    {item.icon}
                  </span>

                  <span className="flex-1 truncate">
                    {item.label}
                  </span>

                  {item.badge && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
        <p className="text-[10px] text-slate-400 whitespace-nowrap">
          Official Gov Portal
        </p>

        <p className="text-[10px] text-slate-400 whitespace-nowrap">
          v1.2.4 • Secure SSL
        </p>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  designation?: string | null;
};

function Topbar({
  role,
  user,
  onToggle,
  activeScreen,
  isDark,
  onToggleDark,
  onLogout,
  unreadNotificationCount,
  onOpenNotifications,
}: {
  role: Role;
  user: AuthUser;
  onToggle: () => void;
  activeScreen: string;
  isDark: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
  unreadNotificationCount: number;
  onOpenNotifications: () => void;
}) {
  const roleNames: Record<Role, string> = {
    citizen: "Citizen",
    officer: "Grievance Officer",
    admin: "Administrator",
  };

  const roleBreadcrumbs: Record<Role, string> = {
    citizen: "Citizen View",
    officer: "Officer View",
    admin: "Admin View",
  };

  const roleSearch: Record<Role, string> = {
    citizen: "Search grievances, tracking IDs...",
    officer: "Search grievances, departments, IDs...",
    admin: "Search departments, audit logs, IDs...",
  };

  const screenLabel = activeScreen
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const userInitials =
    user.name
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4 flex-shrink-0">
      {/* Sidebar toggle */}
      <button
        onClick={onToggle}
        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex-shrink-0"
      >
        <svg
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Breadcrumb */}
      <div className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
        Dashboard{" "}
        <span className="text-slate-300 dark:text-slate-600 mx-1">
          /
        </span>

        <span className="text-slate-900 dark:text-slate-100 font-medium">
          {roleBreadcrumbs[role]}
        </span>

        {activeScreen !== "dashboard" && (
          <>
            <span className="text-slate-300 dark:text-slate-600 mx-1">
              /
            </span>

            <span className="text-slate-600 dark:text-slate-400">
              {screenLabel}
            </span>
          </>
        )}
      </div>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line
              x1="21"
              y1="21"
              x2="16.65"
              y2="16.65"
            />
          </svg>

          <input
            type="text"
            placeholder={roleSearch[role]}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Dark mode */}
        <button
          onClick={onToggleDark}
          title={
            isDark
              ? "Switch to Light Mode"
              : "Switch to Dark Mode"
          }
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? (
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line
                x1="4.22"
                y1="4.22"
                x2="5.64"
                y2="5.64"
              />
              <line
                x1="18.36"
                y1="18.36"
                x2="19.78"
                y2="19.78"
              />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line
                x1="4.22"
                y1="19.78"
                x2="5.64"
                y2="18.36"
              />
              <line
                x1="18.36"
                y1="5.64"
                x2="19.78"
                y2="4.22"
              />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Notifications */}
        <button
          type="button"
          onClick={onOpenNotifications}
          title="Notifications"
          className="relative text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>

          {unreadNotificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadNotificationCount > 99
                ? "99+"
                : unreadNotificationCount}
            </span>
          )}
        </button>

        {/* Profile + Logout */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.currentTarget.parentElement
                ?.querySelector("[data-logout-menu]")
                ?.classList.toggle("hidden");
            }}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg px-2 py-1 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-xs text-slate-600 dark:text-slate-300 font-semibold">
              {userInitials}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight whitespace-nowrap">
                {user.name}
              </p>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {roleNames[role]}
              </p>
            </div>

            <svg
              className="w-3 h-3 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Logout dropdown */}
          <div
            data-logout-menu
            className="hidden absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-1 z-50"
          >
            <button
              type="button"
              onClick={onLogout}
              className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Placeholder ──────────────────────────────────────────────────────────────

function PlaceholderScreen({
  title,
}: {
  title: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="text-5xl mb-4">🚧</div>

      <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
        {title}
      </h2>

      <p className="text-sm text-slate-400 dark:text-slate-500">
        This screen is part of the Nivara platform.
      </p>
    </div>
  );
}

// ─── Screen Router ────────────────────────────────────────────────────────────

function renderScreen(
  role: Role,
  screen: string,
  navigate: (s: string) => void
) {
  const [currentScreen, grievanceId] = screen.split(":");

  if (role === "citizen") {
    switch (currentScreen) {
      case "dashboard":
        return <CitizenDashboard navigate={navigate} />;

      case "my-grievances":
        return <MyGrievances navigate={navigate} />;

      case "submit-grievance":
        return <SubmitGrievance navigate={navigate} />;

      case "grievance-detail":
        return (
          <GrievanceDetail
            navigate={navigate}
            grievanceId={grievanceId}
          />
        );

      case "notifications":
        return <CitizenNotifications />;

      case "profile":
        return <Profile />;

      default:
        return (
          <PlaceholderScreen
            title={screen
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          />
        );
    }
  }

  if (role === "officer") {
    switch (currentScreen) {
      case "dashboard":
        return <OfficerDashboard navigate={navigate} />;

      case "priority-queue":
        return <PriorityQueue navigate={navigate} />;

      case "my-assignments":
  return <OfficerMyAssignments navigate={navigate} />;

      case "all-grievances":
        return <AllGrievances navigate={navigate} />;

      case "grievance-detail":
        return (
          <OfficerGrievanceDetail
            navigate={navigate}
            grievanceId={grievanceId}
          />
        );

      case "geo-intelligence":
        return <GeoIntelligence />;

      case "sla-monitoring":
        return <SLAMonitoring />;

      case "escalations":
        return <Escalations />;

      case "profile":
        return <Profile />;

      default:
        return (
          <PlaceholderScreen
            title={screen
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          />
        );
    }
  }

  // Admin
  switch (currentScreen) {
    case "dashboard":
      return <AdminDashboard navigate={navigate} />;

    case "all-grievances":
      return <AllGrievances navigate={navigate} />;

    case "departments":
      return <Departments />;

    case "geo-intelligence":
      return <AdminGeoIntelligence />;

    case "complaint-clusters":
      return <ComplaintClusters navigate={navigate} />;

    case "ai-analytics":
      return <AIAnalytics />;

    case "audit-logs":
      return <AuditLogs />;

    case "reports":
      return <Reports />;

    case "escalations":
      return <Escalations />;

    case "sla-management":
      return <SLAMonitoring />;

    case "profile":
      return <Profile />;

    default:
      return (
        <PlaceholderScreen
          title={screen
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())}
        />
      );
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [role, setRole] = useState<Role>("citizen");

  const [user, setUser] = useState<AuthUser | null>(null);

  const [authLoading, setAuthLoading] = useState(true);

  const [screen, setScreen] = useState("dashboard");

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [isDark, setIsDark] = useState(false);

  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);

  // Set dashboard role from authenticated user
  useEffect(() => {
    if (!user) {
      return;
    }

    if (user.role === "ADMIN") {
      setRole("admin");
    } else if (user.role === "OFFICER") {
      setRole("officer");
    } else {
      setRole("citizen");
    }

    setScreen("dashboard");
  }, [user]);

  // Restore authentication on page refresh
  useEffect(() => {
    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  // Apply/remove dark mode
  useEffect(() => {
    const html = document.documentElement;

    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [isDark]);

  // Load the real unread notification count for the authenticated user.
  useEffect(() => {
    if (!user) {
      setUnreadNotificationCount(0);
      return;
    }

    let cancelled = false;

    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationCount();

        if (!cancelled) {
          setUnreadNotificationCount(count);
        }
      } catch (error) {
        console.error(
          "Failed to load unread notification count:",
          error
        );

        if (!cancelled) {
          setUnreadNotificationCount(0);
        }
      }
    };

    loadUnreadCount();

    const intervalId = window.setInterval(
      loadUnreadCount,
      30000
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user]);

  const navigate = (s: string) => {
    setScreen(s);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");

    setUser(null);
    setUnreadNotificationCount(0);
    setRole("citizen");
    setScreen("dashboard");
  };

  // Authentication loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-sm text-slate-500">
          Loading Nivara...
        </div>
      </div>
    );
  }

  // No authenticated user
  if (!user) {
    return (
      <AuthScreens
        onAuthenticated={(authenticatedUser) => {
          setUser(authenticatedUser);
        }}
      />
    );
  }

  // Authenticated application
  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          role={role}
          open={sidebarOpen}
          activeScreen={screen}
          navigate={navigate}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <Topbar
            role={role}
            user={user}
            onToggle={() =>
              setSidebarOpen((open) => !open)
            }
            activeScreen={screen}
            isDark={isDark}
            onToggleDark={() =>
              setIsDark((dark) => !dark)
            }
            onLogout={handleLogout}
            unreadNotificationCount={unreadNotificationCount}
            onOpenNotifications={() =>
              navigate("notifications")
            }
          />

          <main className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950">
            {renderScreen(
              role,
              screen,
              navigate
            )}
          </main>
        </div>
      </div>
    </div>
  );
}