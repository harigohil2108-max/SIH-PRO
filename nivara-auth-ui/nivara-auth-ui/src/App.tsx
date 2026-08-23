import { useState } from "react";

type Screen = "login" | "register" | "forgot";
type Role = "citizen" | "officer" | "admin";

const DEPARTMENTS = [
  "Water Supply",
  "Roads & Infrastructure",
  "Electricity",
  "Sanitation",
  "Public Health",
  "Municipal Services",
];

// ── Icons ────────────────────────────────────────────────────────────────────

function IconUser({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function IconMail({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function IconPhone({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3" />
    </svg>
  );
}

function IconLock({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function IconEye({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function IconEyeOff({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function IconId({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
    </svg>
  );
}

function IconBriefcase({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function IconBuilding({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  );
}

function IconChevronDown({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

// ── Components ───────────────────────────────────────────────────────────────

function NivaraLogo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>
      <div>
        <div className={`text-lg font-bold leading-none ${dark ? "text-gray-900" : "text-gray-900"}`}>Nivara</div>
        <div className="text-[10px] font-semibold tracking-widest text-blue-600 uppercase">Smart Grievance Management</div>
      </div>
    </div>
  );
}

function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  required,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`w-full h-11 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${icon ? "pl-10 pr-4" : "px-4"}`}
        />
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <IconLock />
        </div>
        <input
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full h-11 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-10 pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder,
  icon,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">{icon}</div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`w-full h-11 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer pr-10 ${icon ? "pl-10" : "pl-4"} ${value === "" ? "text-gray-400" : "text-gray-900"}`}
        >
          <option value="" disabled hidden>
            {placeholder ?? "Select an option"}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt} className="text-gray-900">
              {opt}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <IconChevronDown />
        </div>
      </div>
    </div>
  );
}

function AlertBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <p className="text-xs text-amber-800 leading-relaxed">{children}</p>
    </div>
  );
}

// ── Left Panel ────────────────────────────────────────────────────────────────

function LeftPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-[#eef4ff] p-10 min-h-screen w-[45%] shrink-0">
      <NivaraLogo />

      <div className="space-y-6">
        <div>
          <span className="inline-block text-xs font-bold tracking-widest uppercase text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full mb-6">
            Smart Grievance Management
          </span>
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            Every grievance deserves a{" "}
            <span className="text-blue-600">clear resolution.</span>
          </h1>
          <p className="mt-4 text-gray-600 text-base leading-relaxed">
            Nivara connects citizens directly with government departments to resolve issues efficiently using secure, transparent workflows.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              icon: (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253" />
                </svg>
              ),
              title: "Multilingual access",
              desc: "Available in multiple regional Indian languages",
            },
            {
              icon: (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
              ),
              title: "AI-assisted grievance management",
              desc: "Automated routing to responsible departments",
            },
            {
              icon: (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              ),
              title: "Transparent tracking",
              desc: "Real-time status updates on every grievance",
            },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                {f.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{f.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Illustration */}
      <div className="bg-white/60 rounded-2xl p-6 mt-6">
        <svg viewBox="0 0 320 140" className="w-full" fill="none">
          {/* City skyline simplified */}
          <rect x="20" y="80" width="30" height="50" rx="2" fill="#bfdbfe" />
          <rect x="28" y="65" width="14" height="20" rx="1" fill="#93c5fd" />
          <rect x="60" y="60" width="40" height="70" rx="2" fill="#93c5fd" />
          <rect x="68" y="45" width="24" height="20" rx="1" fill="#60a5fa" />
          <rect x="108" y="75" width="28" height="55" rx="2" fill="#bfdbfe" />
          <rect x="144" y="50" width="36" height="80" rx="2" fill="#60a5fa" />
          <rect x="152" y="36" width="20" height="18" rx="1" fill="#3b82f6" />
          <rect x="188" y="68" width="28" height="62" rx="2" fill="#93c5fd" />
          <rect x="224" y="55" width="34" height="75" rx="2" fill="#bfdbfe" />
          <rect x="232" y="42" width="18" height="16" rx="1" fill="#60a5fa" />
          <rect x="266" y="78" width="30" height="52" rx="2" fill="#93c5fd" />
          {/* Ground */}
          <rect x="0" y="128" width="320" height="12" rx="2" fill="#dbeafe" />
          {/* Windows */}
          <rect x="64" y="66" width="6" height="6" rx="1" fill="white" opacity="0.7" />
          <rect x="76" y="66" width="6" height="6" rx="1" fill="white" opacity="0.7" />
          <rect x="64" y="80" width="6" height="6" rx="1" fill="white" opacity="0.7" />
          <rect x="76" y="80" width="6" height="6" rx="1" fill="white" opacity="0.7" />
          <rect x="148" y="56" width="7" height="7" rx="1" fill="white" opacity="0.7" />
          <rect x="162" y="56" width="7" height="7" rx="1" fill="white" opacity="0.7" />
          <rect x="148" y="70" width="7" height="7" rx="1" fill="white" opacity="0.7" />
          <rect x="162" y="70" width="7" height="7" rx="1" fill="white" opacity="0.7" />
          {/* Check badge */}
          <circle cx="160" cy="25" r="14" fill="#2563eb" />
          <path d="M153 25l5 5 9-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-center text-xs text-blue-600 font-medium mt-2">Trusted by municipal corporations across India</p>
      </div>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onNavigate, onSubmit }: {
  onNavigate: (s: Screen) => void;
  onSubmit: (data: { email: string; password: string; remember: boolean }) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
      <p className="text-gray-500 text-sm mt-1 mb-8">Sign in to manage and track your Nivara account</p>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ email, password, remember });
        }}
      >
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={setEmail}
          icon={<IconMail />}
          required
        />
        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          required
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => onNavigate("forgot")}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
          Sign in
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        New citizen?{" "}
        <button
          onClick={() => onNavigate("register")}
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Create an account
        </button>
      </p>
      <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
        <IconLock className="w-3 h-3" />
        Your information is securely protected
      </p>
    </div>
  );
}

// ── Register Screen ───────────────────────────────────────────────────────────

function RoleCard({
  role,
  label,
  desc,
  icon,
  selected,
  onSelect,
}: {
  role: Role;
  label: string;
  desc: string;
  icon: React.ReactNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center cursor-pointer ${
        selected
          ? "border-blue-600 bg-blue-50 shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className={selected ? "text-blue-600" : "text-gray-400"}>{icon}</div>
      <div className={`text-sm font-semibold leading-none ${selected ? "text-blue-700" : "text-gray-700"}`}>{label}</div>
      <div className={`text-[11px] leading-snug ${selected ? "text-blue-500" : "text-gray-400"}`}>{desc}</div>
    </button>
  );
}

type RegisterData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: Role;
  officialId: string;
  department: string;
  designation: string;
};

function RegisterScreen({ onNavigate, onSubmit }: {
  onNavigate: (s: Screen) => void;
  onSubmit: (data: RegisterData) => void;
}) {
  const [role, setRole] = useState<Role>("citizen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [officialId, setOfficialId] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const isOfficer = role === "officer";
  const isAdmin = role === "admin";
  const isGov = isOfficer || isAdmin;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900">Create your Nivara account</h2>
      <p className="text-gray-500 text-sm mt-1 mb-6">Create an account to submit and track grievances.</p>

      {/* Role selector */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">I am registering as</p>
        <div className="flex gap-2">
          <RoleCard
            role="citizen"
            label="Citizen"
            desc="Submit and track grievances"
            selected={role === "citizen"}
            onSelect={() => setRole("citizen")}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            }
          />
          <RoleCard
            role="officer"
            label="Officer"
            desc="Government department staff"
            selected={role === "officer"}
            onSelect={() => setRole("officer")}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            }
          />
          <RoleCard
            role="admin"
            label="Admin"
            desc="System administrator"
            selected={role === "admin"}
            onSelect={() => setRole("admin")}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            }
          />
        </div>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ name, email, phone, password, confirmPassword, role, officialId, department, designation });
        }}
      >
        {isGov && (
          <AlertBanner>
            {isOfficer
              ? "Officer accounts require a valid Government ID and will be verified with your department before officer-level access is granted."
              : "Administrator accounts require a valid Government ID and are subject to authorization before access is granted."}
          </AlertBanner>
        )}

        <Input label="Full Name" placeholder="Enter your full name" value={name} onChange={setName} icon={<IconUser />} required />
        <Input label="Email Address" type="email" placeholder="name@example.com" value={email} onChange={setEmail} icon={<IconMail />} required />
        <Input label="Mobile Number" type="tel" placeholder="10-digit mobile number" value={phone} onChange={setPhone} icon={<IconPhone />} required />

        {isGov && (
          <Input
            label={isOfficer ? "Government Employee ID" : "Government / Admin ID"}
            placeholder={isOfficer ? "Enter your employee ID" : "Enter your government or admin ID"}
            value={officialId}
            onChange={setOfficialId}
            icon={<IconId />}
            required
          />
        )}

        {isOfficer && (
          <>
            <SelectInput
              label="Department"
              value={department}
              onChange={setDepartment}
              options={DEPARTMENTS}
              placeholder="Select your department"
              icon={<IconBuilding />}
              required
            />
            <Input
              label="Designation"
              placeholder="e.g. Junior Engineer, Inspector"
              value={designation}
              onChange={setDesignation}
              icon={<IconBriefcase />}
              required
            />
          </>
        )}

        <PasswordInput label="Password" placeholder="Create a strong password" value={password} onChange={setPassword} required />
        <PasswordInput label="Confirm Password" placeholder="Repeat your password" value={confirmPassword} onChange={setConfirmPassword} required />

        {role === "citizen" && (
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
            />
            <span className="text-sm text-gray-600">
              I agree to the{" "}
              <span className="text-blue-600 font-medium cursor-pointer hover:underline">Terms of Service</span>{" "}
              and{" "}
              <span className="text-blue-600 font-medium cursor-pointer hover:underline">Privacy Policy</span>
            </span>
          </label>
        )}

        <button
          type="submit"
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {role === "citizen" ? "Create Account" : role === "officer" ? "Create Officer Account" : "Create Admin Account"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <button onClick={() => onNavigate("login")} className="font-semibold text-blue-600 hover:text-blue-700">
          Sign in
        </button>
      </p>
    </div>
  );
}

// ── Forgot Password Screen ────────────────────────────────────────────────────

function ForgotPasswordScreen({ onNavigate, onSubmit }: {
  onNavigate: (s: Screen) => void;
  onSubmit: (email: string) => void;
}) {
  const [email, setEmail] = useState("");

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke="currentColor" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
      <p className="text-gray-500 text-sm mt-1 mb-8">
        Enter your registered email address and we'll help you recover your account.
      </p>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(email);
        }}
      >
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={setEmail}
          icon={<IconMail />}
          required
        />

        <button
          type="submit"
          className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center transition-colors mt-2"
        >
          Send Reset Link
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Remembered your password?{" "}
        <button onClick={() => onNavigate("login")} className="font-semibold text-blue-600 hover:text-blue-700">
          Sign in
        </button>
      </p>
    </div>
  );
}

// ── Nav tabs (mobile) ─────────────────────────────────────────────────────────

function NavTabs({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const tabs: { id: Screen; label: string }[] = [
    { id: "login", label: "Sign In" },
    { id: "register", label: "Register" },
    { id: "forgot", label: "Forgot PW" },
  ];
  return (
    <div className="flex lg:hidden border-b border-gray-100 mb-6">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onNavigate(t.id)}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            screen === t.id
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");

  return (
    <div className="min-h-screen flex bg-gray-50">
      <LeftPanel />

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto min-h-screen">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <NivaraLogo />
        </div>

        <NavTabs screen={screen} onNavigate={setScreen} />


        {screen === "login" && (
          <LoginScreen
            onNavigate={setScreen}
            onSubmit={(data) => console.log("login", data)}
          />
        )}
        {screen === "register" && (
          <RegisterScreen
            onNavigate={setScreen}
            onSubmit={(data) => console.log("register", data)}
          />
        )}
        {screen === "forgot" && (
          <ForgotPasswordScreen
            onNavigate={setScreen}
            onSubmit={(email) => console.log("forgot", email)}
          />
        )}

      </div>
    </div>
  );
}
