import React from "react";

/**
 * MetricCard — small analytics tile.
 * Accepts: label, value, sub, colorHex
 * Optional: svgPath (for custom SVG icon)
 */
function MetricCard({ label, value, sub, colorHex = "#4b7cf3", svgPath }) {
    return (
        <div
            className="metric-card lift-card anim-up"
            style={{ borderTop: `2px solid ${colorHex}40` }}
        >
            {svgPath && (
                <div
                    className="metric-icon"
                    style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `${colorHex}18`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: 12,
                    }}
                >
                    <svg viewBox="0 0 16 16" style={{ width: 14, height: 14, stroke: colorHex, fill: "none", strokeWidth: 1.75, strokeLinecap: "round" }}>
                        <path d={svgPath} />
                    </svg>
                </div>
            )}
            <p className="metric-label">{label}</p>
            <p className="metric-value" style={{ color: colorHex }}>{value}</p>
            {sub && <p className="metric-sub">{sub}</p>}
        </div>
    );
}

export default MetricCard;
