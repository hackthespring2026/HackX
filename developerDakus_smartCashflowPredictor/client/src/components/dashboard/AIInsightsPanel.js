import React from "react";

/* Inline SVG icon — circuit/AI representing the insights engine */
const AIIcon = () => (
    <svg viewBox="0 0 16 16" className="panel-icon-svg" aria-hidden="true">
        <path d="M8 2v2M8 12v2M2 8h2M12 8h2" strokeLinecap="round" />
        <circle cx="8" cy="8" r="3" />
        <path d="M5.17 5.17l-1.41-1.41M12.24 12.24l-1.41-1.41M5.17 10.83l-1.41 1.41M12.24 3.76l-1.41 1.41" />
    </svg>
);

const RISK_META = {
    low: { cls: "risk-low", label: "Low Risk", text: "Business fundamentals are healthy and stable." },
    medium: { cls: "risk-medium", label: "Medium Risk", text: "Some areas need attention. Review recommendations." },
    high: { cls: "risk-high", label: "High Risk", text: "Critical issues detected. Immediate action required." },
};

/**
 * InsightsPanel — displays AI-generated recommendations + risk level.
 */
function InsightsPanel({ insightsData, loading, error }) {
    if (loading) {
        return (
            <div className="card">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div className="skeleton" style={{ height: 18, width: "50%" }} />
                    <div className="skeleton" style={{ height: 44, borderRadius: 10 }} />
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !insightsData) {
        return (
            <div className="card">
                <div className="empty-state">
                    <svg viewBox="0 0 40 40" className="empty-state-icon" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="20" cy="20" r="18" />
                        <path d="M20 12v8M20 24h.01" strokeLinecap="round" />
                    </svg>
                    <p className="empty-state-text">
                        {error || "Upload financial data to generate AI insights."}
                    </p>
                </div>
            </div>
        );
    }

    const { recommendations = [], riskLevel = "low" } = insightsData;
    const risk = RISK_META[riskLevel] || RISK_META.low;

    return (
        <div className="card">
            {/* Header */}
            <div className="panel-header">
                <div className="panel-icon-wrap">
                    <AIIcon />
                </div>
                <div>
                    <p className="panel-title">AI Advisor</p>
                    <p className="panel-sub">Insights engine — deterministic analysis</p>
                </div>
                <span className="badge badge-violet" style={{ marginLeft: "auto" }}>
                    {recommendations.length} actions
                </span>
            </div>

            <div className="insights-panel">
                {/* Risk Level indicator */}
                <div className={`risk-indicator ${risk.cls}`}>
                    <span className="risk-label">{risk.label}</span>
                    <span className="risk-text">{risk.text}</span>
                </div>

                {/* Recommendations */}
                <div className="reco-list">
                    {recommendations.map((rec, i) => (
                        <div
                            key={i}
                            className="reco-item"
                            style={{ animationDelay: `${i * 0.07}s` }}
                        >
                            <div className="reco-num">{i + 1}</div>
                            <p className="reco-text">{rec}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default InsightsPanel;
