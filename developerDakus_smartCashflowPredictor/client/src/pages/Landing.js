import React from "react";
import { Link } from "react-router-dom";

/* === SVG Icons === */
const AnalyticsIcon = () => (
  <svg viewBox="0 0 16 16" className="feat-icon-svg" aria-hidden="true">
    <path d="M2 12l4-4 3 3 5-7" />
  </svg>
);

const BrainIcon = () => (
  <svg viewBox="0 0 16 16" className="feat-icon-svg" aria-hidden="true">
    <path d="M8 2v2M8 12v2M2 8h2M12 8h2" />
    <circle cx="8" cy="8" r="3" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 16 16" className="feat-icon-svg" aria-hidden="true">
    <path d="M8 2l6 2.5v4c0 3-3 5.5-6 6-3-.5-6-3-6-6V4.5L8 2z" />
    <path d="M5.5 8l2 2 3-3" />
  </svg>
);

const FEATURES = [
  {
    Icon: AnalyticsIcon,
    title: "Instant Financial Analytics",
    desc: "Upload a CSV and get real-time burn rate, runway, and cash trend analysis in under one second.",
  },
  {
    Icon: BrainIcon,
    title: "AI Health Score",
    desc: "A weighted 0–100 business health index with fully explainable scoring across five key dimensions.",
  },
  {
    Icon: ShieldIcon,
    title: "Risk Detection",
    desc: "Automatically surfaces consecutive losses, declining revenue, and critical cash positions before they escalate.",
  },
];

/* Animated SVG chart (hero preview line) */
function HeroChartLine({ d, color, delay = "0s" }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        strokeDasharray: 300,
        strokeDashoffset: 300,
        animation: `dash-draw 1.8s cubic-bezier(0.16,1,0.3,1) ${delay} forwards`,
      }}
    />
  );
}

function Landing() {
  return (
    <div className="landing-page">
      {/* CSS for hero chart animation */}
      <style>{`
        @keyframes dash-draw { to { stroke-dashoffset: 0; } }
        @keyframes num-count { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-inner">
          {/* Copy */}
          <div className="hero-copy anim-up">
            <div className="hero-label">
              <span className="label-tag">Financial Intelligence Platform</span>
            </div>

            <h1 className="hero-title">
              Smart Cash Flow{" "}
              <span className="gradient-text">Predictor</span>
            </h1>

            <p className="hero-desc">
              Upload your monthly financial data. Get a weighted health score,
              AI-driven recommendations, and risk alerts — instantly, with no
              manual analysis required.
            </p>

            <div className="hero-cta">
              <Link to="/dashboard">
                <button className="btn btn-primary">
                  Open Dashboard
                </button>
              </Link>
              <a href="#features" className="hero-link">
                See how it works
              </a>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="anim-up anim-d2">
            <div
              className="hero-preview"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
                const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
                e.currentTarget.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 4}deg)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)";
              }}
            >
              {/* Window chrome */}
              <div className="preview-header">
                <div className="preview-dot" style={{ background: "#ef4444" }} />
                <div className="preview-dot" style={{ background: "#f59e0b" }} />
                <div className="preview-dot" style={{ background: "#22c55e" }} />
                <span className="preview-title">cashflow-ai · dashboard</span>
              </div>

              {/* Score row */}
              <div className="preview-score-row">
                {/* Animated ring */}
                <div className="preview-ring-wrap">
                  <svg className="preview-ring-svg" viewBox="0 0 80 80" width="80" height="80">
                    <defs>
                      <linearGradient id="previewGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#15c8a4" />
                        <stop offset="100%" stopColor="#4b7cf3" />
                      </linearGradient>
                    </defs>
                    <circle className="preview-ring-track" cx="40" cy="40" r="30" strokeWidth="6" />
                    <circle className="preview-ring-fill" cx="40" cy="40" r="30" strokeWidth="6" />
                  </svg>
                  <div className="preview-ring-num">
                    <span className="preview-ring-val">72</span>
                    <span className="preview-ring-lbl">Score</span>
                  </div>
                </div>

                {/* Meta stats */}
                <div className="preview-meta">
                  {[
                    { label: "Runway", val: "8.4 mo", color: "#4b7cf3" },
                    { label: "Growth", val: "+12%", color: "#15c8a4" },
                    { label: "Burn", val: "2 mo", color: "#f05252" },
                  ].map((m) => (
                    <div className="preview-meta-row" key={m.label}>
                      <span className="preview-m-label">{m.label}</span>
                      <span className="preview-m-val" style={{ color: m.color }}>{m.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Animated chart */}
              <p className="preview-chart-label">Revenue vs Expenses</p>
              <div className="preview-bars">
                {[
                  { rev: "55%", cost: "38%" },
                  { rev: "65%", cost: "45%" },
                  { rev: "50%", cost: "42%" },
                  { rev: "80%", cost: "55%" },
                  { rev: "70%", cost: "48%" },
                  { rev: "90%", cost: "60%" },
                  { rev: "75%", cost: "50%" },
                ].map((b, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", gap: 2, alignItems: "flex-end", height: "100%" }}>
                    <div
                      className="preview-bar"
                      style={{
                        height: b.rev,
                        background: "rgba(75,124,243,0.75)",
                        animationDelay: `${0.4 + i * 0.08}s`,
                      }}
                    />
                    <div
                      className="preview-bar"
                      style={{
                        height: b.cost,
                        background: "rgba(240,82,82,0.60)",
                        animationDelay: `${0.5 + i * 0.08}s`,
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Animated line overlay */}
              <svg viewBox="0 0 260 50" style={{ width: "100%", height: 40, marginTop: 4 }}>
                <HeroChartLine
                  d="M0,35 C20,30 40,20 60,18 C80,15 100,25 120,20 C140,15 160,8 180,12 C200,16 220,5 260,8"
                  color="#15c8a4"
                  delay="0.6s"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES (max 3) ───────────────────────────────────── */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="features-inner">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="feat-card anim-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="feat-icon">
                  <f.Icon />
                </div>
                <p className="feat-title">{f.title}</p>
                <p className="feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-inner">
            <div className="cta-copy">
              <h2 className="cta-title">
                Start analyzing your{" "}
                <span className="gradient-text">cash flow</span> now.
              </h2>
              <p className="cta-sub">
                No account required. Upload your CSV and get results in under a second.
              </p>
            </div>
            <div className="cta-action">
              <Link to="/dashboard">
                <button className="btn btn-primary">
                  Open Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <span className="footer-brand">CashFlow AI</span>
            <p className="footer-copy">© 2026 Smart Cashflow Predictor. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/" className="footer-link">Home</Link>
              <Link to="/dashboard" className="footer-link">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
