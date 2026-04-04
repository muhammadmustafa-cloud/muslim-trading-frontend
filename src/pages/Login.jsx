import { useState } from "react";
import { apiPost } from "../config/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { FaLock, FaUser, FaIndustry, FaBuilding } from "react-icons/fa";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [clientId, setClientId] = useState(
    import.meta.env.VITE_CLIENT_ID || ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedClientId = clientId.trim();
    if (!trimmedClientId) {
      setError("Client ID is required to connect to your database.");
      return;
    }

    setLoading(true);
    try {
      // Temporarily write client id to localStorage so apiPost picks it up
      localStorage.setItem("mill_client_id", trimmedClientId);

      const res = await apiPost("/auth/login", { username, password });
      login(res.data, trimmedClientId);
      window.location.href = "/";
    } catch (err) {
      // Clear client id if login failed
      localStorage.removeItem("mill_client_id");
      setError(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center border-b border-white/10">
            <div className="w-16 h-16 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <FaIndustry className="w-7 h-7 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Mill Management</h1>
            <p className="text-slate-400 mt-1 text-sm">Sign in to your account</p>
          </div>

          {/* Form */}
          <div className="p-8 space-y-5">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium animate-pulse">
                ⚠ {error}
              </div>
            )}

            {/* Client ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Client / Mill ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <FaBuilding className="w-4 h-4" />
                </div>
                <input
                  id="client-id-input"
                  type="text"
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white/10 transition-all outline-none text-sm"
                  placeholder="e.g. clientA, newGodamMill"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                This determines which database your data loads from.
              </p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <FaUser className="w-4 h-4" />
                </div>
                <input
                  id="username-input"
                  type="text"
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white/10 transition-all outline-none text-sm"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <FaLock className="w-4 h-4" />
                </div>
                <input
                  id="password-input"
                  type="password"
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white/10 transition-all outline-none text-sm"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/50 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          © 2026 Mill Management System v2.0
        </p>
      </div>
    </div>
  );
}
