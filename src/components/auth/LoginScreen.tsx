"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Eye, EyeOff, LogIn, Globe } from "lucide-react";

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error || "Authentication failed");
    }
    setIsSubmitting(false);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, #062A74 0%, #034BE4 50%, #428BF9 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-4">
            <Globe size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Horizon Impact Fund
          </h1>
          <p className="text-sm text-white/50 mt-1">
            Portfolio Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium text-white/70 mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-transparent transition-all"
                placeholder="Enter username"
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-white/70 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-transparent transition-all"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="text-xs text-red-300 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!username || !password || isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
              style={{ background: "#FF9705" }}
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-white/30 mt-6">
          Investing in sustainable livelihoods across emerging markets
        </p>
      </div>
    </div>
  );
}
