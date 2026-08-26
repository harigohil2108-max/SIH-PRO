import { useEffect, useState } from "react";
import { login, register } from "./services/authService";

type Role = "CITIZEN" | "OFFICER" | "ADMIN";

type Department = {
  _id: string;
  name: string;
  code: string;
  description?: string;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  designation?: string | null;
};

type AuthScreensProps = {
  onAuthenticated: (user: AuthUser) => void;
};

const API_URL = "http://localhost:5000/api";

export default function AuthScreens({
  onAuthenticated,
}: AuthScreensProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<Role>("CITIZEN");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [officialId, setOfficialId] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isRegister || role !== "OFFICER") {
      return;
    }

    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        setError("");

        const response = await fetch(`${API_URL}/departments`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load departments"
          );
        }

        setDepartments(data.departments || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load departments"
        );
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [isRegister, role]);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setError("");

    if (newRole === "CITIZEN") {
      setOfficialId("");
      setDepartment("");
      setDesignation("");
    }

    if (newRole === "ADMIN") {
      setDepartment("");
      setDesignation("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = isRegister
        ? await register(
            name,
            email,
            phone,
            password,
            role,
            role === "OFFICER" || role === "ADMIN"
              ? officialId
              : undefined,
            role === "OFFICER"
              ? department
              : undefined,
            role === "OFFICER"
              ? designation
              : undefined
          )
        : await login(identifier, password);

      localStorage.setItem("token", data.token);

      onAuthenticated(data.user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError("");

    setRole("CITIZEN");

    setName("");
    setPhone("");
    setEmail("");
    setIdentifier("");
    setPassword("");
    setConfirmPassword("");

    setOfficialId("");
    setDepartment("");
    setDesignation("");
  };

  return (
    <div className="min-h-screen bg-white flex">

      {/* ================= LEFT PANEL ================= */}
      <div className="hidden lg:flex lg:w-[44%] bg-[#edf5ff] px-12 py-10 flex-col relative overflow-hidden">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-sm">
            ✓
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Nivara
            </h1>

            <p className="text-xs font-bold tracking-widest text-blue-600">
              SMART GRIEVANCE MANAGEMENT
            </p>
          </div>
        </div>

        {/* Main heading */}
        <div className="mt-16">
          <div className="inline-flex bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold tracking-wide">
            SMART GRIEVANCE MANAGEMENT
          </div>

          <h2 className="mt-8 text-5xl font-bold leading-[1.12] text-slate-900">
            Every grievance
            <br />
            deserves a{" "}
            <span className="text-blue-600">
              clear
            </span>
            <br />
            <span className="text-blue-600">
              resolution.
            </span>
          </h2>

          <p className="mt-7 text-slate-500 text-lg leading-7 max-w-lg">
            Nivara connects citizens directly with department
            heads to resolve issues efficiently using secure,
            transparent workflows.
          </p>
        </div>

        {/* Features */}
        <div className="mt-12 space-y-7">

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
              ◎
            </div>

            <div>
              <p className="font-semibold text-slate-800">
                Multilingual access
              </p>
              <p className="text-sm text-slate-500">
                Available in multiple regional Indian languages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
              ✦
            </div>

            <div>
              <p className="font-semibold text-slate-800">
                AI-assisted grievance management
              </p>
              <p className="text-sm text-slate-500">
                Automated routing to responsible departments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl">
              〽
            </div>

            <div>
              <p className="font-semibold text-slate-800">
                Transparent tracking
              </p>
              <p className="text-sm text-slate-500">
                Real-time status updates and SMS notifications
              </p>
            </div>
          </div>

        </div>

        {/* Decorative illustration */}
        <div className="absolute bottom-0 left-12 right-12 h-32 bg-blue-100 rounded-t-3xl opacity-70">
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
            <div className="w-24 h-8 bg-blue-500 rounded-t-full" />
            <div className="w-4 h-12 bg-blue-500 mx-auto" />
          </div>
        </div>
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className="flex-1 flex flex-col bg-white">

        {/* Language */}
        <div className="flex justify-end px-8 py-7">
          <button
            type="button"
            className="border border-slate-200 rounded-full px-5 py-2 text-sm text-slate-600 flex items-center gap-2"
          >
            ◎ English
            <span>⌄</span>
          </button>
        </div>

        {/* Authentication content */}
        <div className="flex-1 flex items-start justify-center px-8 pb-12">
          <div className="w-full max-w-xl">

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 text-2xl mb-6">
              {isRegister ? "♙" : "↪"}
            </div>

            {/* Heading */}
            <h2 className="text-3xl font-bold text-slate-900">
              {isRegister
                ? "Create your Nivara account"
                : "Welcome back"}
            </h2>

            <p className="mt-2 text-slate-500">
              {isRegister
                ? "Create an account to submit and track grievances."
                : "Sign in to manage and track your Nivara account"}
            </p>

            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              {/* ================= REGISTER ================= */}

              {isRegister && (
                <>
                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      I am registering as
                    </label>

                    <div className="grid grid-cols-3 gap-3">

                      <RoleButton
                        active={role === "CITIZEN"}
                        onClick={() =>
                          handleRoleChange("CITIZEN")
                        }
                        title="Citizen"
                        description="Submit and track grievances"
                      />

                      <RoleButton
                        active={role === "OFFICER"}
                        onClick={() =>
                          handleRoleChange("OFFICER")
                        }
                        title="Officer"
                        description="Government department staff"
                      />

                      <RoleButton
                        active={role === "ADMIN"}
                        onClick={() =>
                          handleRoleChange("ADMIN")
                        }
                        title="Admin"
                        description="System administrator"
                      />

                    </div>
                  </div>

                  {/* Full name */}
                  <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={setName}
                    required
                  />

                  {/* Government ID */}
                  {(role === "OFFICER" ||
                    role === "ADMIN") && (
                    <div>
                      <Input
                        label="Government ID"
                        placeholder="Enter your Government ID"
                        value={officialId}
                        onChange={(value) =>
                          setOfficialId(value.toUpperCase())
                        }
                        required
                      />

                      <p className="text-xs text-slate-400 mt-1">
                        Your Government ID must be authorized by
                        Nivara.
                      </p>
                    </div>
                  )}

                  {/* Officer department */}
                  {role === "OFFICER" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Department
                        </label>

                        <select
                          value={department}
                          onChange={(e) =>
                            setDepartment(e.target.value)
                          }
                          required
                          disabled={loadingDepartments}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-700 outline-none focus:border-blue-500"
                        >
                          <option value="">
                            {loadingDepartments
                              ? "Loading departments..."
                              : "Select your department"}
                          </option>

                          {departments.map((dept) => (
                            <option
                              key={dept._id}
                              value={dept._id}
                            >
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label="Designation"
                        placeholder="e.g. Junior Engineer"
                        value={designation}
                        onChange={setDesignation}
                        required
                      />
                    </>
                  )}

                  {/* Email */}
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={setEmail}
                    required
                  />

                  {/* Phone */}
                  <Input
                    label="Mobile Number"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={setPhone}
                    required
                  />
                </>
              )}

              {/* ================= LOGIN ================= */}

              {!isRegister && (
                <Input
                  label="Mobile number or email"
                  placeholder="Enter mobile number or email"
                  value={identifier}
                  onChange={setIdentifier}
                  required
                />
              )}

              {/* Password */}
              <Input
                label="Password"
                type="password"
                placeholder={
                  isRegister
                    ? "Create a strong password"
                    : "Enter your password"
                }
                value={password}
                onChange={setPassword}
                required
              />

              {/* Confirm password */}
              {isRegister && (
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  required
                />
              )}

              {/* Forgot password */}
              {!isRegister && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700"
                    onClick={() => {
                      setError(
                        "Password recovery will be connected next."
                      );
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  loading ||
                  (isRegister &&
                    role === "OFFICER" &&
                    loadingDepartments)
                }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3.5 font-semibold transition disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : isRegister
                    ? "Create Account"
                    : "Sign In"}
              </button>

            </form>

            {/* Switch */}
            <div className="text-center mt-7">
              {isRegister ? (
                <p className="text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-blue-600 font-semibold hover:text-blue-700"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="text-slate-500">
                  New citizen?{" "}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="text-blue-600 font-semibold hover:text-blue-700"
                  >
                    Create an account
                  </button>
                </p>
              )}
            </div>

            {/* Security note */}
            <div className="flex justify-center items-center gap-2 mt-5 text-xs text-slate-400">
              <span>♙</span>
              Your information is securely protected
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   REUSABLE INPUT
============================================================ */

type InputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
};

function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
}: InputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
}

/* ============================================================
   ROLE BUTTON
============================================================ */

type RoleButtonProps = {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
};

function RoleButton({
  active,
  onClick,
  title,
  description,
}: RoleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border px-4 py-4 transition ${
        active
          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div
        className={`font-semibold text-sm ${
          active
            ? "text-blue-600"
            : "text-slate-700"
        }`}
      >
        {title}
      </div>

      <div className="text-[11px] leading-4 text-slate-400 mt-1">
        {description}
      </div>
    </button>
  );
}