import React, { useMemo } from "react";

const STATUS_COLOR = {
    excellent: "#15c8a4",
    good: "#4b7cf3",
    stable: "#f5a623",
    poor: "#f05252",
    critical: "#c0392b",
};

const STATUS_FILL = {
    excellent: "#15c8a4",
    good: "#4b7cf3",
    stable: "#f5a623",
    poor: "#f05252",
    critical: "#c0392b",
};

const CIRCUMFERENCE = 2 * Math.PI * 52; // r=52

function HealthScoreCard({ healthData, loading, error }) {
    const { score, status, insights } = healthData || {};

    const offset = useMemo(() => {
        if (score === undefined) return CIRCUMFERENCE;
        return CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
    }, [score]);

    const color = STATUS_COLOR[status] || "#4b7cf3";

    // ── Skeleton ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="card lift-card">
                <div className="health-score-card">
                    <div className="skeleton" style={{ width: 150, height: 150, borderRadius: "50%" }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                        <div className="skeleton" style={{ height: 14, width: "40%" }} />
                        <div className="skeleton" style={{ height: 28, width: "60%" }} />
                        <div className="skeleton" style={{ height: 14, width: "90%" }} />
                        <div className="skeleton" style={{ height: 14, width: "75%" }} />
                    </div>
                </div>
            </div>
        );
    }

    // ── Empty / Error ──────────────────────────────────────────────────────────
    if (error || !healthData) {
        return (
            <div className="card lift-card">
                <div className="empty-state">
                    <svg viewBox="0 0 40 40" className="empty-state-icon" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="20" cy="20" r="16" />
                        <path d="M14 26c1.5-2 3.3-3 6-3s4.5 1 6 3" strokeLinecap="round" />
                        <circle cx="15" cy="17" r="1.5" fill="currentColor" />
                        <circle cx="25" cy="17" r="1.5" fill="currentColor" />
                    </svg>
                    <p className="empty-state-text">
                        {error || "Upload data to see your Business Health Score."}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card lift-card anim-up">
            <div className="health-score-card">
                {/* SVG Gauge */}
                <div className="gauge-wrap">
                    <svg className="gauge-svg" viewBox="0 0 120 120" width="150" height="150">
                        <defs>
                            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity="0.7" />
                                <stop offset="100%" stopColor={color} />
                            </linearGradient>
                        </defs>
                        <circle className="gauge-bg" cx="60" cy="60" r="52" strokeWidth="8" />
                        <circle
                            className="gauge-fill"
                            cx="60" cy="60" r="52"
                            strokeWidth="8"
                            stroke="url(#gaugeGrad)"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={offset}
                            style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
                        />
                    </svg>
                    <div className="gauge-center">
                        <span className="gauge-score" style={{ color }}>{score}</span>
                        <span className="gauge-label">/ 100</span>
                    </div>
                </div>

                {/* Score details */}
                <div className="health-info">
                    <div className="health-status">
                        <span className="badge" style={{
                            background: `${color}18`, color: color,
                            border: `1px solid ${color}30`,
                            textTransform: "capitalize",
                        }}>
                            {status}
                        </span>
                        <span className="health-status-text" style={{ color }}>
                            Business Health
                        </span>
                    </div>

                    <div className="health-insights">
                        {(insights || []).slice(0, 3).map((insight, i) => (
                            <div key={i} className="insight-item" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="insight-dot" style={{ background: color }} />
                                <span>{insight}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HealthScoreCard;
