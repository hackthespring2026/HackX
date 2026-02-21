import React, { useState } from "react";
import { Link } from "react-router-dom";

function RegisterPage() {
  const [nameUser, setNameUser] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRePassword] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  const inputStyle = `
    w-full px-4 py-3
    bg-[#181C14] border-2 border-[#697565]
    rounded-xl outline-none transition-all duration-200
    placeholder:text-[#697565]/50 text-[#ECDFCC]
    focus:border-[#ECDFCC]
    focus:ring-4 focus:ring-[#ECDFCC]/5
  `;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#181C14] px-6 py-8">
      <div className="w-full max-w-md bg-[#3C3D37] p-8 rounded-3xl shadow-2xl border border-[#697565]">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[#ECDFCC] tracking-tight uppercase">
            Create Account
          </h1>
          <p className="text-[#697565] text-sm mt-2 font-medium">
            Join the Bus Monitoring Network
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">

          <div>
            <label className="block text-[10px] font-bold text-[#697565] mb-1 ml-1 uppercase tracking-[0.15em]">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Your Name"
              value={nameUser}
              onChange={(e) => setNameUser(e.target.value)}
              className={inputStyle}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#697565] mb-1 ml-1 uppercase tracking-[0.15em]">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputStyle}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] font-bold text-[#697565] mb-1 ml-1 uppercase tracking-[0.15em]">
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#697565] hover:text-[#ECDFCC]"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[10px] font-bold text-[#697565] mb-1 ml-1 uppercase tracking-[0.15em]">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showRePassword ? "text" : "password"}
                placeholder="••••••••"
                value={repassword}
                onChange={(e) => setRePassword(e.target.value)}
                className={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowRePassword(!showRePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#697565] hover:text-[#ECDFCC]"
              >
                {showRePassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>
        </div>

        {/* Policy Checkbox */}
        <div className="mt-6 flex items-start gap-3 px-1">
          <div className="relative flex items-center">
            <input
              id="policy"
              type="checkbox"
              checked={acceptedPolicy}
              onChange={(e) => setAcceptedPolicy(e.target.checked)}
              className="w-4 h-4 rounded border-[#697565] bg-[#181C14] text-[#697565] focus:ring-0 focus:ring-offset-0 accent-[#697565]"
            />
          </div>
          <label htmlFor="policy" className="text-xs text-[#697565] leading-snug">
            I agree to the <span className="text-[#ECDFCC] cursor-pointer hover:underline">Privacy Policy</span> and Terms of Service
          </label>
        </div>

        {/* Register Button */}
        <button
          disabled={!acceptedPolicy}
          className={`
            w-full mt-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-sm transition-all active:scale-[0.98]
            ${
              acceptedPolicy
                ? "bg-[#ECDFCC] text-[#181C14] shadow-lg hover:bg-[#697565] hover:text-[#ECDFCC]"
                : "bg-[#181C14] text-[#697565] cursor-not-allowed border border-[#697565]/30"
            }
          `}
        >
          Create Account
        </button>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-[#697565]/20 pt-6">
          <p className="text-sm text-[#697565]">
            Already have an account?{" "}
            <Link to="/login" className="text-[#ECDFCC] font-bold hover:underline underline-offset-4">
              Sign In
            </Link>
          </p>

          <Link
            to="/"
            className="inline-block mt-4 text-[10px] font-bold text-[#697565] hover:text-[#ECDFCC] uppercase tracking-[0.2em] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}

export default RegisterPage;