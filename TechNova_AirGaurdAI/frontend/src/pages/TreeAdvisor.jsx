import React, { useState } from "react";
import { FiSun, FiMapPin, FiCheckCircle } from "react-icons/fi";
import { getCityAQI } from "../utils/api";

// Best tree species for air purification
const treeSpecies = [
  { name: "Neem (Azadirachta indica)", co2: 28, aqiImpact: "High", zones: "Urban, Industrial", icon: "🌳" },
  { name: "Peepal (Ficus religiosa)", co2: 22, aqiImpact: "High", zones: "Residential, Roadside", icon: "🌲" },
  { name: "Bamboo", co2: 35, aqiImpact: "Very High", zones: "Parks, Boundaries", icon: "🎋" },
  { name: "Ashoka (Saraca asoca)", co2: 18, aqiImpact: "Medium", zones: "Roadsides, Gardens", icon: "🌿" },
  { name: "Arjun (Terminalia arjuna)", co2: 25, aqiImpact: "High", zones: "River banks, Parks", icon: "🌴" },
  { name: "Gulmohar (Flamboyant)", co2: 20, aqiImpact: "Medium", zones: "Avenues, Schools", icon: "🌺" },
];

// Zone recommendations based on AQI level
function getZoneRecommendations(aqi) {
  if (aqi > 200) return [
    { zone: "Industrial Belt", trees: 2000, reduction: 8, priority: "Critical" },
    { zone: "Traffic Corridors", trees: 1500, reduction: 6, priority: "Critical" },
    { zone: "Residential Zones", trees: 800, reduction: 3, priority: "High" },
    { zone: "School Proximity", trees: 500, reduction: 2, priority: "High" },
  ];
  if (aqi > 100) return [
    { zone: "Main Roads", trees: 800, reduction: 4, priority: "High" },
    { zone: "Commercial Areas", trees: 600, reduction: 3, priority: "Medium" },
    { zone: "Parks Expansion", trees: 400, reduction: 2, priority: "Medium" },
    { zone: "School & Hospitals", trees: 300, reduction: 1.5, priority: "High" },
  ];
  return [
    { zone: "Suburban Areas", trees: 300, reduction: 1.5, priority: "Low" },
    { zone: "Green Corridors", trees: 200, reduction: 1, priority: "Low" },
  ];
}

function TreeAdvisor() {
  const [city, setCity] = useState("Delhi");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = await getCityAQI(city);
    const aqi = data?.data?.aqi || 150;
    const zones = getZoneRecommendations(aqi);
    const totalTrees = zones.reduce((s, z) => s + z.trees, 0);
    const totalReduction = zones.reduce((s, z) => s + z.reduction, 0);
    setResult({ aqi, zones, totalTrees, totalReduction, city: data?.data?.city?.name || city });
    setLoading(false);
  };

  const priorityColor = { Critical: "#ef4444", High: "#f97316", Medium: "#eab308", Low: "#22c55e" };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Smart Tree Plantation Advisor</h1>
        <p className="text-gray-400 text-sm">AI-powered tree planting recommendations to reduce AQI</p>
      </div>

      <div className="glass-card p-5">
        <form onSubmit={handleAnalyze} className="flex gap-3">
          <div className="relative flex-1">
            <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className="air-input pl-10" placeholder="Enter city..."
              value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary btn-green px-6 py-2.5 flex items-center gap-2 flex-shrink-0">
            {loading ? "Analyzing..." : <><FiSun /> Get Plan</>}
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-5 fade-in-up">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Current AQI", value: result.aqi, color: "#ef4444", suffix: "" },
              { label: "Trees Needed", value: result.totalTrees.toLocaleString(), color: "#22c55e", suffix: "" },
              { label: "AQI Reduction", value: result.totalReduction.toFixed(1), color: "#3b82f6", suffix: "%" },
            ].map(({ label, value, color, suffix }) => (
              <div key={label} className="glass-card p-5 text-center" style={{ borderColor: `${color}30` }}>
                <p className="font-display font-black text-3xl mb-1" style={{ color }}>{value}{suffix}</p>
                <p className="text-gray-400 text-sm">{label}</p>
              </div>
            ))}
          </div>

          {/* Zone recommendations */}
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FiMapPin className="text-green-400" /> Plantation Zones for {result.city}
            </h3>
            <div className="space-y-3">
              {result.zones.map((zone, i) => (
                <div key={i} className="p-4 rounded-xl border"
                  style={{ background: `${priorityColor[zone.priority]}08`, borderColor: `${priorityColor[zone.priority]}25` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🌳</span>
                      <p className="text-white font-semibold">{zone.zone}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: `${priorityColor[zone.priority]}20`, color: priorityColor[zone.priority] }}>
                      {zone.priority} Priority
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-gray-500 text-xs">Trees to Plant</p>
                      <p className="text-white font-bold font-mono">{zone.trees.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Expected AQI Drop</p>
                      <p className="text-green-400 font-bold">-{zone.reduction}%</p>
                    </div>
                  </div>
                  <p className="text-blue-400 text-sm mt-2 font-medium">
                    💡 "Plant {zone.trees.toLocaleString()} trees in {zone.zone} to reduce AQI by {zone.reduction}%"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Best tree species */}
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4">🌿 Recommended Tree Species</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {treeSpecies.map((tree) => (
                <div key={tree.name} className="p-4 rounded-xl bg-white/5 border border-white/8">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{tree.icon}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{tree.name}</p>
                      <p className="text-gray-500 text-xs mb-2">Best for: {tree.zones}</p>
                      <div className="flex gap-3">
                        <span className="text-xs text-blue-400">CO₂: {tree.co2}kg/yr</span>
                        <span className={`text-xs ${tree.aqiImpact === "Very High" ? "text-green-400" : tree.aqiImpact === "High" ? "text-green-300" : "text-yellow-400"}`}>
                          Impact: {tree.aqiImpact}
                        </span>
                      </div>
                    </div>
                    <FiCheckCircle className="text-green-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="glass-card p-16 text-center">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
            🌳
          </div>
          <h3 className="text-white font-display font-bold text-xl mb-2">Tree Plantation Advisor</h3>
          <p className="text-gray-400 text-sm">Enter your city to get a personalized tree planting plan that can significantly reduce AQI</p>
        </div>
      )}
    </div>
  );
}

export default TreeAdvisor;
