import { useState } from "react";
import { login, register } from "./services/authService";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthScreensProps = {
  onAuthenticated: (user: AuthUser) => void;
};

export default function AuthScreens({
  onAuthenticated,
}: AuthScreensProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setError("");
  setLoading(true);

  try {
    const data = isRegister
      ? await register(name, email, phone, password)
      : await login(email, password);

    localStorage.setItem("token", data.token);

    onAuthenticated(data.user);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Something went wrong"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-8">

          {/* Brand */}
          <div className="text-center mb-8">
            <div className="w-10 h-10 mx-auto rounded-lg bg-[#0f2b4e] flex items-center justify-center text-white font-bold mb-3">
              N
            </div>

            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Nivara
            </h1>

            <p className="text-xs text-slate-500 mt-1">
              AI Civic Platform
            </p>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
            {isRegister ? "Create your Nivara account" : "Sign in to Nivara"}
          </h2>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
  <>
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Name
      </label>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-400"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Phone
      </label>

      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-400"
      />
    </div>
  </>
)}
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-400"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f2b4e] hover:bg-[#163b66] text-white rounded-lg py-2.5 font-medium disabled:opacity-60"
            >
              {loading
  ? "Please wait..."
  : isRegister
    ? "Create Account"
    : "Sign In"}
            </button>

          </form>
          <div className="text-center mt-6">
  <button
    type="button"
    onClick={() => {
      setIsRegister(!isRegister);
      setError("");
    }}
    className="text-sm text-blue-600 hover:text-blue-700"
  >
    {isRegister
      ? "Already have an account? Sign in"
      : "Don't have an account? Register"}
  </button>
</div>

        </div>
      </div>
    </div>
  );
}
