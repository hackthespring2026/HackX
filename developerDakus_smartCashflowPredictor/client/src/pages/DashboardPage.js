import React, { useState, useCallback } from "react";
import { NavLink } from "react-router-dom";
import FileUpload from "../components/FileUpload";
import SummaryCards from "../components/SummaryCards";
import Charts from "../components/Charts";
import HealthScoreCard from "../components/dashboard/HealthScoreCard";
import AIInsightsPanel from "../components/dashboard/AIInsightsPanel";
import FinancialSummary from "../components/dashboard/FinancialSummary";
import FinancialTable from "../components/dashboard/FinancialTable";
import useHealthScore from "../hooks/useHealthScore";
import useInsights from "../hooks/useInsights";
import { exportReportPDF } from "../services/api";

// ── SVG download icon ─────────────────────────────────────────────────────────
const DownloadIcon = () => (
  <svg viewBox="0 0 16 16" style={{ width: 15, height: 15, stroke: "currentColor", fill: "none", strokeWidth: 2, strokeLinecap: "round" }}>
    <path d="M8 2v8M5 7l3 3 3-3" />
    <path d="M2 12v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1" />
  </svg>
);

// ── Export button component ───────────────────────────────────────────────────
function ExportButton({ hasData }) {
  const [state, setState] = useState("idle"); // idle | loading | error
  const [errMsg, setErrMsg] = useState("");

  const handleExport = useCallback(async () => {
    setState("loading");
    setErrMsg("");
    try {
      await exportReportPDF();
      setState("idle");
    } catch (err) {
      setErrMsg(err.message || "Export failed");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }, []);

  if (state === "error") {
    return (
      <button className="export-btn-err" onClick={() => setState("idle")} type="button">
        Failed: {errMsg} — click to dismiss
      </button>
    );
  }

  return (
    <button
      className="export-btn"
      onClick={handleExport}
      disabled={state === "loading" || !hasData}
      type="button"
      title={hasData ? "Download financial report as PDF" : "Upload data to export a report"}
    >
      {state === "loading" ? (
        <>
          <svg viewBox="0 0 16 16" style={{ width: 15, height: 15, stroke: "currentColor", fill: "none", strokeWidth: 2, strokeLinecap: "round", animation: "spin 0.8s linear infinite" }}>
            <circle cx="8" cy="8" r="6" strokeOpacity="0.3" />
            <path d="M14 8a6 6 0 0 1-6 6" />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <DownloadIcon />
          Export Report
        </>
      )}
    </button>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────
function DashboardPage() {
  const [result, setResult] = useState(null);
  const [uploadKey, setUploadKey] = useState(0);

  const { healthData, loading: healthLoading, error: healthError } = useHealthScore(uploadKey);
  const { insightsData, loading: insightsLoading, error: insightsError } = useInsights(uploadKey);

  const handleSuccess = useCallback((data) => {
    setResult(data);
    setUploadKey((k) => k + 1);
  }, []);

  const hasData = !!result;

  return (
    <div className="dashboard-layout">
      {/* CSS for spin animation */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="dash-sidebar">
        <p className="sidebar-section-label">Navigation</p>
        <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Home
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          Dashboard
        </NavLink>

        <hr className="divider" />

        <p className="sidebar-section-label">Data Input</p>
        <FileUpload onSuccess={handleSuccess} />

        {result && (
          <div style={{
            marginTop: 8,
            padding: "8px 12px",
            background: "rgba(21,200,164,0.07)",
            border: "1px solid rgba(21,200,164,0.18)",
            borderRadius: 8,
            fontSize: "0.82rem",
            color: "var(--teal)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <svg viewBox="0 0 10 10" style={{ width: 8, height: 8, fill: "var(--teal)", flexShrink: 0 }}>
              <circle cx="5" cy="5" r="5" />
            </svg>
            {result.monthlyData?.length || 0} months loaded
          </div>
        )}
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <main className="dash-main">

        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="dash-head anim-up">
          <div>
            <h1>Financial Dashboard</h1>
            <p>
              {hasData
                ? `Showing ${result.monthlyData?.length || 0} months of financial data`
                : "Upload a CSV to begin analysis"}
            </p>
          </div>
          <div className="dash-actions">
            {hasData && (
              <span className="badge badge-blue">
                {result.monthlyData?.length} months
              </span>
            )}
            <ExportButton hasData={hasData} />
          </div>
        </div>

        {/* ── Empty State ────────────────────────────────────────────── */}
        {!hasData && (
          <div className="card anim-up anim-d1" style={{
            textAlign: "center",
            padding: "64px 40px",
            background: "linear-gradient(135deg, rgba(75,124,243,0.04), rgba(21,200,164,0.02))",
          }}>
            <svg viewBox="0 0 56 56" style={{ width: 56, height: 56, margin: "0 auto 20px", opacity: 0.25 }} fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="6" y="6" width="44" height="44" rx="6" />
              <path d="M6 18h44M18 6v12M38 6v12" />
              <path d="M14 30h6M14 38h14M14 24h28" strokeLinecap="round" />
            </svg>
            <h2 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, marginBottom: 10 }}>No data loaded</h2>
            <p style={{ color: "var(--text-2)", fontSize: "var(--text-md)", maxWidth: "42ch", margin: "0 auto 28px" }}>
              Upload a CSV with monthly financial data to see your full analysis.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {["Month", "Opening_Cash", "Revenue", "Fixed_Cost", "Variable_Cost", "Inventory_Cost", "Loan_EMI"].map((col) => (
                <span key={col} style={{
                  padding: "4px 11px", borderRadius: 999,
                  background: "rgba(75,124,243,0.08)",
                  border: "1px solid rgba(75,124,243,0.18)",
                  fontSize: "0.74rem", fontWeight: 600,
                  color: "var(--text-2)", fontFamily: "monospace",
                }}>
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Loaded State ───────────────────────────────────────────── */}
        {hasData && (
          <>
            {/* ① Financial Summary (Revenue / Expenses / Net Cash + sparklines) */}
            <section>
              <p className="section-label">Financial Overview</p>
              <FinancialSummary monthlyData={result.monthlyData} />
            </section>

            {/* ② Key Metrics row */}
            <section>
              <p className="section-label">Key Metrics</p>
              <SummaryCards
                burnMonths={result.burnMonths}
                averageLoss={result.averageLoss}
                runway={result.runway}
                breakEvenMonth={result.breakEvenMonth}
              />
            </section>

            {/* ③ Health Score + AI Insights side-by-side */}
            <section>
              <p className="section-label">Intelligence</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-5)" }}>
                <HealthScoreCard
                  healthData={healthData}
                  loading={healthLoading}
                  error={healthError}
                />
                <AIInsightsPanel
                  insightsData={insightsData}
                  loading={insightsLoading}
                  error={insightsError}
                />
              </div>
            </section>

            {/* ④ Charts */}
            <section>
              <p className="section-label">Charts</p>
              <Charts monthlyData={result.monthlyData} />
            </section>

            {/* ⑤ Financial Data Table (with previous month bar) */}
            <section>
              <p className="section-label">Data Table</p>
              <FinancialTable monthlyData={result.monthlyData} />
            </section>

            {/* ⑥ Risk Alerts */}
            <section>
              <div className="card anim-up">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <svg viewBox="0 0 16 16" style={{ width: 16, height: 16, stroke: "var(--amber)", fill: "none", strokeWidth: 1.75, flexShrink: 0, strokeLinecap: "round" }}>
                    <path d="M8 2L1.5 13.5h13L8 2z" />
                    <path d="M8 7v3M8 11.5h.01" />
                  </svg>
                  <p style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Risk Alerts</p>
                  {result.risks.length > 0 && (
                    <span className="badge badge-amber" style={{ marginLeft: "auto" }}>
                      {result.risks.length}
                    </span>
                  )}
                </div>

                {result.risks.length === 0 ? (
                  <div className="risk-item" style={{
                    background: "rgba(21,200,164,0.07)",
                    borderColor: "rgba(21,200,164,0.18)",
                    color: "var(--teal)",
                  }}>
                    <div className="risk-dot" style={{ background: "var(--teal)" }} />
                    No significant financial risks detected. Business metrics look healthy.
                  </div>
                ) : (
                  <ul className="risk-list">
                    {result.risks.map((risk, idx) => (
                      <li
                        key={`${risk}-${idx}`}
                        className={`risk-item ${risk.includes("CRITICAL") ? "risk-critical" :
                            risk.includes("HIGH RISK") ? "risk-high" : "risk-warn"
                          }`}
                      >
                        <div
                          className="risk-dot"
                          style={{ background: risk.includes("CRITICAL") ? "var(--red)" : "var(--amber)" }}
                        />
                        {risk}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
