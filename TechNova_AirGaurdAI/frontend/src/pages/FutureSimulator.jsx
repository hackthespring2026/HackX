import React, { useState } from "react";
import { FiTrendingUp, FiTrendingDown, FiZap, FiInfo } from "react-icons/fi";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { getCityAQI } from "../utils/api";

// Simulation parameters with their AQI impact
const simulationOptions = [
  { id: "traffic_up", label: "Increase Traffic 20%", icon: "🚗", aqiChange: +15, co2Change: +18 },
  { id: "factory", label: "Add Industrial Factory", icon: "🏭", aqiChange: +25, co2Change: +30 },
  { id: "vehicles_down", label: "Reduce Vehicles 10%", icon: "🚌", aqiChange: -8, co2Change: -10 },
  { id: "trees_500", label: "Plant 500 Trees", icon: "🌳", aqiChange: -5, co2Change: -12 },
  { id: "ev_adoption", label: "30% EV Adoption", icon: "⚡", aqiChange: -12, co2Change: -20 },
  { id: "solar", label: "Switch to Solar Power", icon: "☀️", aqiChange: -18, co2Change: -35 },
  { id: "industry_close", label: "Close Old Factory", icon: "🏗️", aqiChange: -20, co2Change: -25 },
  { id: "population", label: "Population +15%", icon: "👥", aqiChange: +10, co2Change: +12 },
];

// Generate 5-year forecast based on base AQI and changes
function generateForecast(baseAqi, totalChange) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => {
    const year = currentYear + i;
    // Apply change gradually over 5 years
    const progress = i / 5;
    const change = totalChange * progress;
    const baseline = baseAqi + (Math.random() - 0.5) * 5;
    const simulated = baseAqi + change + (Math.random() - 0.5) * 3;
    return {
      year: year.toString(),
      baseline: Math.max(5, Math.round(baseline)),
      simulated: Math.max(5, Math.round(simulated)),
    };
  });
}

function FutureSimulator() {
  const [city, setCity] = useState("Delhi");
  const [baseAqi, setBaseAqi] = useState(150);
  const [selected, setSelected] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Toggle simulation option
  const toggleOption = (opt) => {
    setSelected((prev) =>
      prev.find((s) => s.id === opt.id)
        ? prev.filter((s) => s.id !== opt.id)
        : [...prev, opt]
    );
  };

  // Fetch city AQI and run simulation
  const handleSimulate = async () => {
    setLoading(true);
    const data = await getCityAQI(city);
    const aq = data?.data?.aqi || baseAqi;
    setBaseAqi(aq);

    const totalAqiChange = selected.reduce((sum, s) => sum + s.aqiChange, 0);
    const forecast = generateForecast(aq, totalAqiChange);
    setForecastData({ forecast, totalAqiChange, totalCo2Change: selected.reduce((s, o) => s + o.co2Change, 0) });
    setLoading(false);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-xs">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((p) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value} AQI</p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Trees impact calculator
  const treesPlanted = 500;
  const co2PerTree = 22; // kg per year average
  const aqiReductionPerTree = 0.01; // estimated %
  const totalCo2Absorbed = treesPlanted * co2PerTree;
  const aqiReduction = (treesPlanted * aqiReductionPerTree).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Future Pollution Simulator</h1>
        <p className="text-gray-400 text-sm">5-Year AI forecast based on your city's interventions</p>
      </div>

      {/* City input */}
      <div className="glass-card p-5">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-gray-300 text-sm mb-2 block">City to Simulate</label>
            <input className="air-input" placeholder="e.g. Delhi, Beijing..."
              value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <button onClick={handleSimulate} disabled={loading || selected.length === 0}
            className="btn-primary px-6 py-2.5 flex items-center gap-2 flex-shrink-0"
            style={{ opacity: selected.length === 0 ? 0.5 : 1 }}>
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Simulating...</>
            ) : (
              <><FiZap /> Run Simulation</>
            )}
          </button>
        </div>
        {selected.length === 0 && (
          <p className="text-yellow-400 text-xs mt-2">⚠️ Select at least one scenario below</p>
        )}
      </div>

      {/* Simulation options grid */}
      <div>
        <h3 className="text-white font-semibold mb-3">Select Scenarios</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {simulationOptions.map((opt) => {
            const isSelected = selected.find((s) => s.id === opt.id);
            const isPositive = opt.aqiChange < 0;
            return (
              <button key={opt.id} onClick={() => toggleOption(opt)}
                className="glass-card p-4 text-left transition-all duration-200 hover:scale-105"
                style={{
                  borderColor: isSelected ? (isPositive ? "#22c55e" : "#ef4444") : "rgba(59,130,246,0.15)",
                  background: isSelected ? (isPositive ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)") : undefined,
                }}>
                <span className="text-2xl mb-2 block">{opt.icon}</span>
                <p className="text-white text-sm font-semibold mb-1">{opt.label}</p>
                <p className={`text-xs font-bold flex items-center gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                  {isPositive ? <FiTrendingDown /> : <FiTrendingUp />}
                  AQI {isPositive ? "" : "+"}{opt.aqiChange} over 5yr
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Forecast results */}
      {forecastData && (
        <div className="space-y-5 fade-in-up">
          {/* Impact summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "AQI Change",
                value: `${forecastData.totalAqiChange > 0 ? "+" : ""}${forecastData.totalAqiChange}`,
                color: forecastData.totalAqiChange < 0 ? "#22c55e" : "#ef4444",
                icon: forecastData.totalAqiChange < 0 ? "📉" : "📈",
              },
              {
                label: "CO₂ Change",
                value: `${forecastData.totalCo2Change > 0 ? "+" : ""}${forecastData.totalCo2Change}%`,
                color: forecastData.totalCo2Change < 0 ? "#22c55e" : "#ef4444",
                icon: "🌍",
              },
              {
                label: "Health Impact",
                value: forecastData.totalAqiChange < -20 ? "Major Improvement" : forecastData.totalAqiChange < 0 ? "Slight Improvement" : "Worsening",
                color: forecastData.totalAqiChange < 0 ? "#22c55e" : "#ef4444",
                icon: forecastData.totalAqiChange < 0 ? "✅" : "⚠️",
              },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="glass-card p-5 text-center" style={{ borderColor: `${color}30` }}>
                <p className="text-2xl mb-2">{icon}</p>
                <p className="font-display font-bold text-2xl" style={{ color }}>{value}</p>
                <p className="text-gray-400 text-sm">{label}</p>
              </div>
            ))}
          </div>

          {/* 5-year chart */}
          <div className="glass-card p-6">
            <h3 className="text-white font-display font-semibold mb-4">5-Year AQI Forecast</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={forecastData.forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" stroke="#4b5563" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis stroke="#4b5563" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(val) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{val}</span>} />
                <ReferenceLine y={100} stroke="#eab308" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="baseline" stroke="#4b5563" strokeWidth={2}
                  strokeDasharray="6 3" dot={false} name="Without Changes" />
                <Line type="monotone" dataKey="simulated" stroke="#22c55e" strokeWidth={2.5}
                  dot={{ fill: "#22c55e", r: 5 }} activeDot={{ r: 8 }} name="With Scenarios" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Environmental summary */}
          <div className="glass-card p-5"
            style={{ background: "rgba(34,197,94,0.05)", borderColor: "rgba(34,197,94,0.2)" }}>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <FiInfo className="text-green-400" /> Environmental Impact Summary
            </h3>
            <div className="space-y-2 text-sm text-gray-300">
              {selected.map((s) => (
                <p key={s.id}>
                  {s.icon} <strong className="text-white">{s.label}</strong> will{" "}
                  <span className={s.aqiChange < 0 ? "text-green-400" : "text-red-400"}>
                    {s.aqiChange < 0 ? "reduce" : "increase"} AQI by {Math.abs(s.aqiChange)} points
                  </span>{" "}
                  over 5 years.
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tree Calculator */}
      <div className="glass-card p-6" style={{ borderColor: "rgba(34,197,94,0.3)" }}>
        <h3 className="text-white font-display font-semibold mb-4">🌳 Tree Impact Calculator</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl text-center" style={{ background: "rgba(34,197,94,0.08)" }}>
            <p className="text-green-400 font-black text-3xl font-display mb-1">{treesPlanted}</p>
            <p className="text-gray-400 text-sm">Trees Planted</p>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: "rgba(59,130,246,0.08)" }}>
            <p className="text-blue-400 font-black text-3xl font-display mb-1">{totalCo2Absorbed.toLocaleString()}kg</p>
            <p className="text-gray-400 text-sm">CO₂ Absorbed/Year</p>
          </div>
          <div className="p-4 rounded-xl text-center" style={{ background: "rgba(168,85,247,0.08)" }}>
            <p className="text-purple-400 font-black text-3xl font-display mb-1">{aqiReduction}%</p>
            <p className="text-gray-400 text-sm">Estimated AQI Reduction</p>
          </div>
        </div>
        <p className="text-green-400 text-sm mt-4 font-semibold text-center">
          🌿 Planting {treesPlanted} trees can reduce local AQI by {aqiReduction}% and absorb {totalCo2Absorbed.toLocaleString()}kg of CO₂ annually
        </p>
      </div>
    </div>
  );
}

export default FutureSimulator;
