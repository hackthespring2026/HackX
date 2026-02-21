import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiWind, FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { loginUser } from "../utils/api";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await loginUser(form.email, form.password);
      // Save token and user info
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/app");
    } catch (err) {
      // For demo: allow demo login
      if (form.email === "demo@airguard.ai" && form.password === "demo123") {
        localStorage.setItem("token", "demo-token-12345");
        localStorage.setItem("user", JSON.stringify({ name: "Demo User", email: "demo@airguard.ai" }));
        navigate("/app");
      } else {
        setError("Invalid credentials. Try demo@airguard.ai / demo123");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#020817" }}
    >
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #22c55e, transparent)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />

      <div className="w-full max-w-md fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #22c55e, #3b82f6)" }}>
            <FiWind className="text-white text-2xl" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white">Welcome Back</h1>
          <p className="text-gray-400 mt-2">Monitor. Protect. Breathe Better.</p>
        </div>

        {/* Form card */}
        <div className="glass-card p-8">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              {error}
            </div>
          )}

          {/* Demo hint */}
          <div className="mb-5 px-4 py-3 rounded-xl text-xs text-blue-400"
            style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)" }}>
            💡 Demo: demo@airguard.ai / demo123
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  className="air-input pl-10"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-gray-300 text-sm mb-2 block">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPass ? "text" : "password"}
                  className="air-input pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
