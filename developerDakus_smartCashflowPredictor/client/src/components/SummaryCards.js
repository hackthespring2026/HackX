import React from "react";
import MetricCard from "./dashboard/MetricCard";

// Simple SVG path constants for icons
const ICONS = {
  fire: "M8 2c0 3-3 4-3 7a3 3 0 0 0 6 0c0-3-3-4-3-7z",
  loss: "M2 12l4-4 3 3 5-7",
  road: "M2 12h12M10 8l4 4-4 4",
  scale: "M3 8h10M5 8V4M11 8V4M2 12h12",
};

function SummaryCards({ burnMonths, averageLoss, runway, breakEvenMonth }) {
  const runwayDisplay =
    typeof runway === "number" ? `${runway.toFixed(1)} mo` : runway ?? "—";

  const runwaySub =
    typeof runway === "number" && runway < 6
      ? "Low runway — monitor closely"
      : typeof runway === "number" && runway >= 12
        ? "Healthy reserve"
        : "Monitor monthly";

  const lossSub =
    averageLoss > 0
      ? `₹${averageLoss.toFixed(0)} average per loss month`
      : "No net losses recorded";

  return (
    <section className="cards-grid">
      <MetricCard
        label="Burn Months"
        value={burnMonths}
        sub={burnMonths === 0 ? "No loss months" : `${burnMonths} months below zero`}
        colorHex="#f05252"
        svgPath={ICONS.fire}
      />
      <MetricCard
        label="Avg Monthly Loss"
        value={`₹${averageLoss.toFixed(0)}`}
        sub={lossSub}
        colorHex="#f5a623"
        svgPath={ICONS.loss}
      />
      <MetricCard
        label="Cash Runway"
        value={runwayDisplay}
        sub={runwaySub}
        colorHex="#4b7cf3"
        svgPath={ICONS.road}
      />
      <MetricCard
        label="Break-even Month"
        value={breakEvenMonth || "—"}
        sub={breakEvenMonth ? "First profitable month reached" : "Not reached in data range"}
        colorHex="#15c8a4"
        svgPath={ICONS.scale}
      />
    </section>
  );
}

export default SummaryCards;
