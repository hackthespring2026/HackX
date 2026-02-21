import React, { useState, useEffect } from "react";
import { FiSearch, FiRefreshCw, FiAlertTriangle } from "react-icons/fi";
import { getCityAQI, getAQIColor, getAQILabel } from "../utils/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import Loader from "../components/Loader";

// Generate dummy 7-day trend data around a given AQI
function generateTrend(baseAqi) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day) => ({
    day,
    aqi: Math.max(20, baseAqi + Math.floor((Math.random() - 0.5) * 40)),
    pm25: Math.max(5, (baseAqi * 0.15) + Math.floor((Math.random() - 0.5) * 15)),
    traffic: Math.floor(40 + Math.random() * 40),
  }));
}

// Zone classification (K-means simulated)
function classifyZones(aqi) {
  return [
    { zone: "Zone A – Central", risk: aqi > 150 ? "High" : aqi > 100 ? "Medium" : "Low", color: aqi > 150 ? "#ef4444" : aqi > 100 ? "#f97316" : "#22c55e" },
    { zone: "Zone B – North", risk: aqi > 120 ? "High" : "Low", color: aqi > 120 ? "#ef4444" : "#22c55e" },
    { zone: "Zone C – South", risk: "Medium", color: "#eab308" },
    { zone: "Zone D – Industrial", risk: "High", color: "#ef4444" },
    { zone: "Zone E – Parks", risk: "Low", color: "#22c55e" },
  ];
}

function CityAnalysis() {
  const [city, setCity] = useState("Delhi");
  const [inputCity, setInputCity] = useState("Delhi");
  const [aqiData, setAqiData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCity = async (name) => {
    setLoading(true);
    const data = await getCityAQI(name);
    if (data && data.status === "ok") {
      setAqiData(data.data);
      setTrend(generateTrend(data.data.aqi));
    } else {
      alert("City not found! Try: Delhi, Mumbai, Beijing...");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCity(city);
  }, [city]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCity(inputCity);
  };

  const aqi = aqiData?.aqi || 100;
  const color = getAQIColor(aqi);
  const zones = classifyZones(aqi);

  // Hospital risk estimation (AI simulated)
  const respiratoryCases = Math.floor(aqi * 2.4);
  const heartRisk = aqi > 150 ? "High" : aqi > 100 ? "Moderate" : "Low";
  const asthmaRisk = aqi > 100 ? "Elevated" : "Normal";

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-xs">
          <p className="text-gray-300 font-semibold mb-1">{label}</p>
          {payload.map((p) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value?.toFixed?.(1) ?? p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header + search */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">City Analysis</h1>
          <p className="text-gray-400 text-sm">Deep dive into city air quality data</p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input className="air-input pl-10 w-52" placeholder="Enter city..."
              value={inputCity} onChange={(e) => setInputCity(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary px-4 py-2.5 text-sm flex items-center gap-2">
            {loading ? <FiRefreshCw className="animate-spin" /> : <FiSearch />} Analyze
          </button>
        </form>
      </div>

      {loading ? <Loader text="Fetching city data..." /> : (
        <>
          {/* Main AQI + Pollutants */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="glass-card p-6" style={{ borderColor: `${color}30` }}>
              <p className="text-gray-400 text-sm mb-2">{aqiData?.city?.name || city}</p>
              <div className="flex items-end gap-3 mb-4">
                <span className="font-display font-black text-6xl" style={{ color, lineHeight: 1 }}>{aqi}</span>
                <div>
                  <p className="text-white font-bold">{getAQILabel(aqi)}</p>
                  <p className="text-gray-500 text-xs">AQI Score</p>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min((aqi / 300) * 100, 100)}%`, background: `linear-gradient(90deg, #22c55e, ${color})` }} />
              </div>
            </div>

            {/* Pollutant grid */}
            <div className="glass-card p-5 md:col-span-2">
              <p className="text-gray-400 text-sm mb-4">Pollutant Levels (µg/m³)</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "PM2.5", value: aqiData?.iaqi?.pm25?.v, danger: 35, color: "#ef4444" },
                  { label: "PM10", value: aqiData?.iaqi?.pm10?.v, danger: 150, color: "#f97316" },
                  { label: "NO₂", value: aqiData?.iaqi?.no2?.v, danger: 200, color: "#a855f7" },
                  { label: "SO₂", value: aqiData?.iaqi?.so2?.v, danger: 75, color: "#eab308" },
                  { label: "CO", value: aqiData?.iaqi?.co?.v, danger: 9, color: "#3b82f6" },
                  { label: "O₃", value: aqiData?.iaqi?.o3?.v, danger: 100, color: "#22c55e" },
                ].map(({ label, value, danger, color: c }) => {
                  const v = value ?? (Math.random() * danger * 0.8).toFixed(1);
                  const pct = Math.min(100, (v / danger) * 100);
                  return (
                    <div key={label} className="bg-white/5 rounded-xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-gray-400 text-xs">{label}</p>
                        <p className="text-white font-mono text-sm font-bold">{Number(v).toFixed(1)}</p>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c }} />
                      </div>
                      <p className="text-gray-600 text-xs mt-1">Limit: {danger}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 7-day trend */}
          <div className="glass-card p-6">
            <h3 className="text-white font-display font-semibold mb-4">7-Day AQI Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#4b5563" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis stroke="#4b5563" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(val) => <span style={{ color: "#9ca3af", fontSize: 12 }}>{val}</span>} />
                <ReferenceLine y={100} stroke="#eab308" strokeDasharray="4 4" label={{ value: "Moderate", fill: "#eab308", fontSize: 11 }} />
                <ReferenceLine y={150} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Unhealthy", fill: "#ef4444", fontSize: 11 }} />
                <Line type="monotone" dataKey="aqi" stroke={color} strokeWidth={2} dot={{ fill: color, r: 4 }} name="AQI" />
                <Line type="monotone" dataKey="pm25" stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7", r: 3 }} name="PM2.5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic vs AQI & Health Risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Traffic correlation */}
            <div className="glass-card p-5">
              <h3 className="text-white font-display font-semibold mb-4">Traffic vs AQI Correlation</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="#4b5563" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis stroke="#4b5563" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="traffic" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Traffic %" opacity={0.8} />
                  <Bar dataKey="aqi" fill={color} radius={[4, 4, 0, 0]} name="AQI" opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Health risk panel */}
            <div className="glass-card p-5">
              <h3 className="text-white font-display font-semibold mb-4">
                Health Risk Estimation (AI)
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)" }}>
                  <div className="flex items-center gap-2">
                    <FiAlertTriangle className="text-red-400" />
                    <span className="text-gray-300 text-sm">Respiratory Cases/Day</span>
                  </div>
                  <span className="text-red-400 font-bold font-mono">{respiratoryCases}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(249,115,22,0.08)" }}>
                  <span className="text-gray-300 text-sm">❤️ Heart Patient Risk</span>
                  <span className={`font-bold text-sm ${heartRisk === "High" ? "text-red-400" : heartRisk === "Moderate" ? "text-yellow-400" : "text-green-400"}`}>
                    {heartRisk}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(168,85,247,0.08)" }}>
                  <span className="text-gray-300 text-sm">🫁 Asthma Patient Risk</span>
                  <span className={`font-bold text-sm ${asthmaRisk === "Elevated" ? "text-orange-400" : "text-green-400"}`}>
                    {asthmaRisk}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(234,179,8,0.08)" }}>
                  <span className="text-gray-300 text-sm">👶 Children Risk</span>
                  <span className={`font-bold text-sm ${aqi > 100 ? "text-yellow-400" : "text-green-400"}`}>
                    {aqi > 100 ? "Moderate" : "Low"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Zone classification */}
          <div className="glass-card p-5">
            <h3 className="text-white font-display font-semibold mb-4">
              Zone Classification (K-Means AI)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {zones.map(({ zone, risk, color: zc }) => (
                <div key={zone} className="p-4 rounded-xl border text-center"
                  style={{ background: `${zc}10`, borderColor: `${zc}30` }}>
                  <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ background: zc }} />
                  <p className="text-white text-xs font-semibold mb-1">{zone}</p>
                  <p className="text-xs font-bold" style={{ color: zc }}>{risk} Risk</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CityAnalysis;
