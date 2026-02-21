import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiWind, FiArrowRight, FiActivity, FiMap, FiShield, FiZap, FiNavigation } from "react-icons/fi";

// Animated number counter
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
}

// Feature card on landing
function FeatureCard({ icon: Icon, title, desc, color }) {
  return (
    <div
      className="glass-card p-6 hover:scale-105 transition-transform duration-300 cursor-default"
      style={{ border: `1px solid ${color}30` }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}
      >
        <Icon style={{ color }} className="text-2xl" />
      </div>
      <h3 className="text-white font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function Landing() {
  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "#020817" }}
    >
      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-blue-900/20">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #22c55e, #3b82f6)" }}
          >
            <FiWind className="text-white" />
          </div>
          <span className="font-display font-bold text-white text-xl">AirGuard</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
            Login
          </Link>
          <Link to="/register" className="btn-primary text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative px-8 pt-20 pb-24 text-center overflow-hidden">
        {/* Background glow blobs */}
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #22c55e, transparent)" }}
        />
        <div
          className="absolute top-20 right-1/4 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }}
        />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-semibold"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          AI-Powered Real-Time Monitoring
        </div>

        {/* Headline */}
        <h1 className="font-display font-bold text-5xl md:text-7xl text-white mb-6 leading-tight">
          Breathe Smarter,{" "}
          <span className="gradient-text">Live Safer</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Real-time global air pollution monitoring with AI-powered health alerts,
          safe route navigation, and 5-year climate predictions.
        </p>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/register"
            className="btn-primary flex items-center gap-2 text-base px-8 py-3"
          >
            Start Monitoring <FiArrowRight />
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 text-base px-8 py-3 rounded-xl text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            View Demo
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-16">
          {[
            { label: "Cities Monitored", value: 12500, suffix: "+" },
            { label: "Real-time Sensors", value: 85000, suffix: "+" },
            { label: "Users Protected", value: 250000, suffix: "+" },
            { label: "Health Alerts Sent", value: 1200000, suffix: "+" },
          ].map(({ label, value, suffix }) => (
            <div key={label} className="glass-card p-4">
              <p className="font-display font-bold text-2xl gradient-text mb-1">
                <Counter target={value} suffix={suffix} />
              </p>
              <p className="text-gray-400 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="px-8 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-white mb-3">
            Everything You Need to Stay Safe
          </h2>
          <p className="text-gray-400">
            Powered by AI, real-time data, and WAQI global network
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={FiMap}
            title="Global AQI Map"
            desc="Live interactive world map showing air quality across 12,500+ cities with color-coded pollution levels."
            color="#22c55e"
          />
          <FeatureCard
            icon={FiShield}
            title="Personal Health AI"
            desc="Enter your health profile and get personalized risk assessment, mask recommendations, and safe outdoor hours."
            color="#3b82f6"
          />
          <FeatureCard
            icon={FiNavigation}
            title="Safe Route Planner"
            desc="Compare routes by pollution levels. Find the cleanest air path to your destination."
            color="#0ea5e9"
          />
          <FeatureCard
            icon={FiActivity}
            title="City Deep Analysis"
            desc="7-day pollution trends, traffic correlation, hospital risk estimation, and zone classification."
            color="#f97316"
          />
          <FeatureCard
            icon={FiZap}
            title="5-Year AI Forecast"
            desc="Simulate environmental changes. Add factories, plant trees, reduce traffic – see AI predictions."
            color="#a855f7"
          />
          <FeatureCard
            icon={FiWind}
            title="Tree Plantation Advisor"
            desc="AI-suggested planting locations, tree species, and expected AQI reduction percentages by zone."
            color="#22c55e"
          />
        </div>
      </section>

      {/* ── AQI Scale Section ── */}
      <section className="px-8 py-16" style={{ background: "rgba(10,22,40,0.5)" }}>
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="font-display font-bold text-3xl text-white mb-3">
            Understanding Air Quality Index
          </h2>
          <p className="text-gray-400">Know what the numbers mean for your health</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {[
            { range: "0–50", label: "Good", color: "#22c55e", desc: "Air quality is satisfactory" },
            { range: "51–100", label: "Moderate", color: "#eab308", desc: "Acceptable for most" },
            { range: "101–150", label: "Unhealthy*", color: "#f97316", desc: "Sensitive groups affected" },
            { range: "151–200", label: "Unhealthy", color: "#ef4444", desc: "Everyone may be affected" },
            { range: "201–300", label: "Very Unhealthy", color: "#a855f7", desc: "Health alert for all" },
            { range: "300+", label: "Hazardous", color: "#7f1d1d", desc: "Emergency conditions" },
          ].map(({ range, label, color, desc }) => (
            <div
              key={range}
              className="glass-card p-4 flex items-center gap-4 min-w-[200px]"
              style={{ borderColor: `${color}30` }}
            >
              <div className="w-3 h-12 rounded-full flex-shrink-0" style={{ background: color }} />
              <div>
                <p className="font-mono text-white font-semibold text-sm">{range}</p>
                <p className="font-semibold text-sm" style={{ color }}>{label}</p>
                <p className="text-gray-500 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section className="px-8 py-20 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #22c55e, #3b82f6)" }}
          >
            <FiWind className="text-white text-2xl" />
          </div>
          <h2 className="font-display font-bold text-4xl text-white mb-4">
            Your air guardian starts here
          </h2>
          <p className="text-gray-400 mb-8">
            Join thousands of citizens monitoring air quality and protecting their health.
          </p>
          <Link to="/register" className="btn-primary text-base px-10 py-3">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Landing;
