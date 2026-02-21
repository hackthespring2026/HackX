import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiMap, FiHeart, FiNavigation, FiTrendingUp, FiBook, FiWind,
  FiAlertTriangle, FiCheckCircle, FiUsers, FiSun, FiAward,
} from "react-icons/fi";
import { getCityAQI, getAQIColor, getAQILabel } from "../utils/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";

// Quick links for dashboard
const quickLinks = [
  { to: "/app/map", label: "Global Map", icon: FiMap, color: "#22c55e", desc: "Live AQI worldwide" },
  { to: "/app/health", label: "Health AI", icon: FiHeart, color: "#ef4444", desc: "Personal risk check" },
  { to: "/app/routes", label: "Safe Routes", icon: FiNavigation, color: "#3b82f6", desc: "Clean air paths" },
  { to: "/app/simulator", label: "AI Forecast", icon: FiTrendingUp, color: "#a855f7", desc: "5-year prediction" },
  { to: "/app/trees", label: "Tree Advisor", icon: FiSun, color: "#22c55e", desc: "Plantation guide" },
  { to: "/app/schools", label: "School Safety", icon: FiBook, color: "#f97316", desc: "Children protection" },
];

// Sample weekly AQI data (would come from API)
const weeklyData = [
  { day: "Mon", aqi: 72, pm25: 18 },
  { day: "Tue", aqi: 85, pm25: 24 },
  { day: "Wed", aqi: 91, pm25: 28 },
  { day: "Thu", aqi: 68, pm25: 16 },
  { day: "Fri", aqi: 110, pm25: 34 },
  { day: "Sat", aqi: 95, pm25: 29 },
  { day: "Sun", aqi: 78, pm25: 21 },
];

function Dashboard() {
  const [cityData, setCityData] = useState(null);
  const [city, setCity] = useState("Delhi"); // default city
  const user = JSON.parse(localStorage.getItem("user") || '{"name":"User"}');

  useEffect(() => {
    // Fetch AQI for a default city
    getCityAQI(city).then((data) => {
      if (data && data.status === "ok") {
        setCityData(data.data);
      }
    });
  }, [city]);

  const aqi = cityData?.aqi || 85;
  const aqiColor = getAQIColor(aqi);
  const aqiLabel = getAQILabel(aqi);
  const time = new Date().toLocaleString("en-IN", {
    weekday: "long", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 text-xs">
          <p className="text-gray-300 font-semibold mb-1">{label}</p>
          <p style={{ color: aqiColor }}>AQI: {payload[0]?.value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">
            Good {new Date().getHours() < 12 ? "Morning" : "Evening"}, {user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-400 mt-1">{time}</p>
        </div>
        {/* Alert badge */}
        <div className="glass-card px-4 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-sm font-medium">System Active</span>
        </div>
      </div>

      {/* ── Main AQI + Stats Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current AQI card */}
        <div className="glass-card p-6 lg:col-span-1" style={{ border: `1px solid ${aqiColor}30` }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Current AQI</p>
            <select
              className="text-xs bg-transparent border border-blue-900/40 text-gray-300 rounded-lg px-2 py-1"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              {["Delhi", "Mumbai", "Ahmedabad", "Kolkata", "Chennai", "Beijing", "London", "New York"].map(c => (
                <option key={c} value={c} style={{ background: "#0a1628" }}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-3 my-4">
            <span className="font-display font-black text-7xl" style={{ color: aqiColor, lineHeight: 1 }}>
              {aqi}
            </span>
            <div className="mb-2">
              <p className="text-white font-semibold">{aqiLabel}</p>
              <p className="text-gray-500 text-xs">{cityData?.city?.name || city}</p>
            </div>
          </div>
          {/* AQI bar */}
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((aqi / 300) * 100, 100)}%`, background: `linear-gradient(90deg, #22c55e, ${aqiColor})` }} />
          </div>
          {/* Pollutants */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "PM2.5", v: cityData?.iaqi?.pm25?.v },
              { l: "PM10", v: cityData?.iaqi?.pm10?.v },
              { l: "NO₂", v: cityData?.iaqi?.no2?.v },
            ].map(({ l, v }) => (
              <div key={l} className="bg-white/5 rounded-xl p-2 text-center">
                <p className="text-gray-500 text-xs">{l}</p>
                <p className="text-white font-mono text-sm font-semibold">{v?.toFixed(1) ?? "--"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly trend chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-display font-semibold">7-Day AQI Trend</h3>
            <span className="text-xs text-gray-500">{city}</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={aqiColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={aqiColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" stroke="#4b5563" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis stroke="#4b5563" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="aqi" stroke={aqiColor} strokeWidth={2}
                fill="url(#aqiGrad)" dot={{ fill: aqiColor, r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Alert Strip ── */}
      {aqi > 100 && (
        <div className="glass-card px-5 py-4 flex items-center gap-4"
          style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
          <FiAlertTriangle className="text-red-400 text-xl flex-shrink-0" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Health Alert Active</p>
            <p className="text-gray-400 text-xs">
              AQI is {aqi} in {cityData?.city?.name || city}. Sensitive groups should limit outdoor activities. Consider wearing N95 mask.
            </p>
          </div>
          <Link to="/app/health" className="ml-auto btn-primary text-xs px-4 py-2 flex-shrink-0">
            Check My Risk
          </Link>
        </div>
      )}

      {/* ── Quick Links ── */}
      <div>
        <h2 className="text-white font-display font-semibold text-lg mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickLinks.map(({ to, label, icon: Icon, color, desc }) => (
            <Link
              key={to}
              to={to}
              className="glass-card p-4 flex flex-col items-center text-center hover:scale-105 transition-transform duration-200 group"
              style={{ border: `1px solid ${color}20` }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon style={{ color }} className="text-xl" />
              </div>
              <p className="text-white text-sm font-semibold mb-1">{label}</p>
              <p className="text-gray-500 text-xs">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bottom stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <FiUsers className="text-blue-400" />
            <p className="text-gray-400 text-sm">Pollution Source Breakdown</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Vehicle Traffic", pct: 42, color: "#ef4444" },
              { label: "Industry", pct: 28, color: "#f97316" },
              { label: "Construction", pct: 18, color: "#eab308" },
              { label: "Weather/Dust", pct: 12, color: "#3b82f6" },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{label}</span><span>{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <FiCheckCircle className="text-green-400" />
            <p className="text-gray-400 text-sm">Health Recommendations</p>
          </div>
          <div className="space-y-2">
            {[
              aqi <= 100 ? "✅ Safe to exercise outdoors" : "⚠️ Limit outdoor exercise",
              aqi <= 150 ? "😊 No mask needed" : "😷 Wear N95 mask outside",
              aqi <= 100 ? "🪟 Open windows freely" : "🚪 Keep windows closed",
              "🌿 Check safe route before travel",
            ].map((tip, i) => (
              <p key={i} className="text-sm text-gray-300 py-2 border-b border-white/5 last:border-0">{tip}</p>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <FiWind className="text-purple-400" />
            <p className="text-gray-400 text-sm">Today's Summary</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Cities Monitored", value: "12,547" },
              { label: "Alerts Sent Today", value: "3,284" },
              { label: "Trees Planted", value: "8,920" },
              { label: "Safe Routes Found", value: "52,100" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">{label}</span>
                <span className="text-white font-mono font-semibold text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
