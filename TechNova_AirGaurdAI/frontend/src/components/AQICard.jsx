import React from "react";
import { getAQIColor, getAQILabel, getAQIClass } from "../utils/api";

// Reusable AQI display card
function AQICard({ aqi, city, pm25, pm10, co, no2, so2, className = "" }) {
  const color = getAQIColor(aqi || 0);
  const label = getAQILabel(aqi || 0);
  const badgeClass = getAQIClass(aqi || 0);

  return (
    <div className={`glass-card p-5 ${className}`}>
      {/* City name & badge */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white font-display font-semibold text-lg">{city || "Unknown City"}</h3>
          <p className="text-gray-400 text-sm">Real-time Air Quality</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
          {label}
        </span>
      </div>

      {/* Big AQI number */}
      <div className="flex items-end gap-3 mb-5">
        <span
          className="font-display font-bold"
          style={{ fontSize: "4rem", lineHeight: 1, color }}
        >
          {aqi || "--"}
        </span>
        <div className="mb-2">
          <p className="text-gray-400 text-sm">AQI</p>
          <p className="text-gray-500 text-xs">Air Quality Index</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-5">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.min((aqi / 300) * 100, 100)}%`,
            background: `linear-gradient(90deg, #22c55e, ${color})`,
          }}
        />
      </div>

      {/* Pollutant grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "PM2.5", value: pm25 },
          { label: "PM10", value: pm10 },
          { label: "CO", value: co },
          { label: "NO₂", value: no2 },
          { label: "SO₂", value: so2 },
        ].map(({ label: l, value: v }) => (
          <div key={l} className="bg-white/5 rounded-xl p-3 text-center">
            <p className="text-gray-400 text-xs mb-1">{l}</p>
            <p className="text-white font-mono font-semibold text-sm">
              {v !== undefined && v !== null ? Number(v).toFixed(1) : "--"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AQICard;
