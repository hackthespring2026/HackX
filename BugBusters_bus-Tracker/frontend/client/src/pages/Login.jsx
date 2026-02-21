import React, { useState } from "react";
import { Link } from "react-router-dom";

function LoginPage() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const inputStyle = `
    w-full px-5 py-4
    bg-[#181C14] border-2 border-[#697565]
    rounded-2xl outline-none transition-all duration-200
    placeholder:text-[#697565]/60 text-[#ECDFCC]
    focus:border-[#ECDFCC]
    focus:ring-4 focus:ring-[#ECDFCC]/5
  `;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181C14] px-6 py-12">
      <div className="w-full max-w-md bg-[#3C3D37] p-10 rounded-3xl shadow-2xl border border-[#697565]">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-[#ECDFCC] tracking-tight">
            Welcome Back
          </h1>
          <p className="text-[#697565] font-medium mt-2">
            Login to Bus Monitoring Dashboard
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-[#697565] mb-2 ml-1 uppercase tracking-[0.2em]">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#697565] mb-2 ml-1 uppercase tracking-[0.2em]">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputStyle}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#697565] hover:text-[#ECDFCC] transition-colors"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>
        </div>

        {/* Button */}
        <button
          className="
            w-full mt-10 py-4
            bg-[#ECDFCC] hover:bg-[#697565]
            text-[#181C14] hover:text-[#ECDFCC]
            font-bold text-lg uppercase tracking-widest
            rounded-2xl transition-all active:scale-[0.98]
            shadow-lg
          "
        >
          Sign In
        </button>

        <div className="mt-8 text-center border-t border-[#697565]/30 pt-6">
          <p className="text-sm text-[#697565]">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-[#ECDFCC] hover:underline underline-offset-4"
            >
              Register here
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-bold text-[#697565] hover:text-[#ECDFCC] transition-colors uppercase tracking-widest"
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;