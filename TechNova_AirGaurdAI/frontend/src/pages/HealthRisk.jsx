import React, { useState } from "react";
import { FiHeart, FiAlertTriangle, FiCheckCircle, FiClock, FiWind } from "react-icons/fi";
import { getCityAQI, getAQIColor, getAQILabel } from "../utils/api";

// ── AI Health Risk Logic ──
// This calculates a personalized risk score based on user health profile + AQI
function calculateHealthRisk(profile, aqi) {
  let score = 0;

  // Base score from AQI
  if (aqi <= 50) score += 10;
  else if (aqi <= 100) score += 30;
  else if (aqi <= 150) score += 50;
  else if (aqi <= 200) score += 70;
  else score += 90;

  // Age factor
  if (profile.age < 5 || profile.age > 65) score += 20;
  else if (profile.age < 12 || profile.age > 50) score += 10;

  // Medical conditions
  if (profile.asthma) score += 20;
  if (profile.heartProblem) score += 25;
  if (profile.diabetes) score += 10;
  if (profile.pregnant) score += 15;

  // Outdoor exposure
  score += profile.outdoorHours * 5;

  // Exercise intensity boost
  const exerciseBoost = { none: 0, light: 5, moderate: 10, intense: 20 };
  score += exerciseBoost[profile.exercise] || 0;

  score = Math.min(100, score);

  // Determine danger level
  let level, levelColor;
  if (score < 25) { level = "Low Risk"; levelColor = "#22c55e"; }
  else if (score < 50) { level = "Moderate Risk"; levelColor = "#eab308"; }
  else if (score < 75) { level = "High Risk"; levelColor = "#f97316"; }
  else { level = "Severe Risk"; levelColor = "#ef4444"; }

  // Mask recommendation
  let mask;
  if (aqi <= 50 && score < 40) mask = "None needed";
  else if (aqi <= 100 && score < 60) mask = "Cloth mask";
  else if (aqi <= 150 || score < 75) mask = "Surgical mask";
  else mask = "N95 / KN95";

  // Safe outdoor hours
  const safeDuration = Math.max(0, Math.floor((100 - score) / 20));

  // Best time to go outside
  let bestTime;
  if (aqi <= 100) bestTime = "Anytime (preferably morning)";
  else if (aqi <= 150) bestTime = "Early morning (6 AM – 8 AM)";
  else bestTime = "Avoid going outside";

  // Indoor warning hours
  const indoorWarning = aqi > 200 ? "Keep windows closed all day" :
    aqi > 150 ? "Avoid opening windows 10 AM – 7 PM" :
    "Ventilate room in early morning";

  return { score, level, levelColor, mask, safeDuration, bestTime, indoorWarning };
}

function HealthRisk() {
  const [profile, setProfile] = useState({
    age: 30,
    asthma: false,
    heartProblem: false,
    diabetes: false,
    pregnant: false,
    outdoorHours: 2,
    exercise: "light",
  });
  const [city, setCity] = useState("Delhi");
  const [aqi, setAqi] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aqiLoading, setAqiLoading] = useState(false);

  const fetchCityAQI = async () => {
    setAqiLoading(true);
    const data = await getCityAQI(city);
    if (data && data.status === "ok") {
      setAqi(data.data.aqi);
    }
    setAqiLoading(false);
  };

  const handleAnalyze = (e) => {
    e.preventDefault();
    if (!aqi) {
      alert("Please fetch city AQI first");
      return;
    }
    const res = calculateHealthRisk(profile, aqi);
    setResult(res);
  };

  const Toggle = ({ label, field }) => (
    <label className="flex items-center justify-between p-3 rounded-xl cursor-pointer"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <span className="text-gray-300 text-sm">{label}</span>
      <div
        className="relative w-11 h-6 rounded-full cursor-pointer transition-all duration-200"
        style={{ background: profile[field] ? "#3b82f6" : "rgba(255,255,255,0.1)" }}
        onClick={() => setProfile({ ...profile, [field]: !profile[field] })}
      >
        <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200"
          style={{ left: profile[field] ? "1.5rem" : "0.25rem" }} />
      </div>
    </label>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Personal Health Risk AI</h1>
        <p className="text-gray-400 text-sm">Get personalized air quality health assessment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Input Form ── */}
        <div className="space-y-5">
          {/* City AQI fetch */}
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FiWind className="text-blue-400" /> Your Location AQI
            </h3>
            <div className="flex gap-3">
              <input className="air-input flex-1" placeholder="Enter your city..."
                value={city} onChange={(e) => setCity(e.target.value)} />
              <button onClick={fetchCityAQI} disabled={aqiLoading}
                className="btn-primary px-4 py-2 text-sm flex-shrink-0">
                {aqiLoading ? "..." : "Get AQI"}
              </button>
            </div>
            {aqi && (
              <div className="mt-3 flex items-center gap-3 p-3 rounded-xl"
                style={{ background: `${getAQIColor(aqi)}15`, border: `1px solid ${getAQIColor(aqi)}30` }}>
                <span className="font-display font-bold text-3xl" style={{ color: getAQIColor(aqi) }}>{aqi}</span>
                <div>
                  <p className="text-white font-semibold">{getAQILabel(aqi)}</p>
                  <p className="text-gray-400 text-xs">{city}</p>
                </div>
              </div>
            )}
          </div>

          {/* Health profile form */}
          <div className="glass-card p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FiHeart className="text-red-400" /> Your Health Profile
            </h3>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm mb-2 block">Age: {profile.age}</label>
                <input type="range" min="1" max="90" value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                  className="w-full accent-blue-500" />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>1</span><span>Child (5-12)</span><span>Adult</span><span>Senior 65+</span><span>90</span>
                </div>
              </div>

              <div className="space-y-2">
                <Toggle label="🫁 Asthma / Respiratory issues" field="asthma" />
                <Toggle label="❤️ Heart / Cardiovascular problem" field="heartProblem" />
                <Toggle label="🩺 Diabetes" field="diabetes" />
                <Toggle label="🤰 Pregnant" field="pregnant" />
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-2 block">
                  Daily outdoor hours: {profile.outdoorHours}h
                </label>
                <input type="range" min="0" max="12" value={profile.outdoorHours}
                  onChange={(e) => setProfile({ ...profile, outdoorHours: Number(e.target.value) })}
                  className="w-full accent-blue-500" />
              </div>

              <div>
                <label className="text-gray-300 text-sm mb-2 block">Exercise type</label>
                <div className="grid grid-cols-4 gap-2">
                  {["none", "light", "moderate", "intense"].map((t) => (
                    <button key={t} type="button"
                      onClick={() => setProfile({ ...profile, exercise: t })}
                      className="py-2 rounded-xl text-xs capitalize font-medium transition-all"
                      style={{
                        background: profile.exercise === t ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${profile.exercise === t ? "#3b82f6" : "rgba(255,255,255,0.1)"}`,
                        color: profile.exercise === t ? "#60a5fa" : "#9ca3af",
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                <FiHeart /> Analyze My Health Risk
              </button>
            </form>
          </div>
        </div>

        {/* ── Results Panel ── */}
        {result ? (
          <div className="space-y-5 fade-in-up">
            {/* Risk score */}
            <div className="glass-card p-6 text-center" style={{ border: `1px solid ${result.levelColor}30` }}>
              <p className="text-gray-400 text-sm mb-3">Your Personal Risk Score</p>
              {/* Circular progress */}
              <div className="relative w-36 h-36 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={result.levelColor} strokeWidth="8"
                    strokeDasharray={`${result.score * 2.64} ${264 - result.score * 2.64}`}
                    strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display font-black text-3xl" style={{ color: result.levelColor }}>
                    {result.score}
                  </span>
                  <span className="text-gray-400 text-xs">/100</span>
                </div>
              </div>
              <h3 className="font-display font-bold text-2xl" style={{ color: result.levelColor }}>
                {result.level}
              </h3>
            </div>

            {/* Recommendations */}
            <div className="glass-card p-5 space-y-4">
              <h3 className="text-white font-semibold">Personalized Recommendations</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <p className="text-gray-400 text-xs mb-1">😷 Mask Type</p>
                  <p className="text-white font-bold">{result.mask}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <p className="text-gray-400 text-xs mb-1">⏱ Safe Outdoors</p>
                  <p className="text-white font-bold">{result.safeDuration}h max</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
                  <p className="text-gray-400 text-xs mb-1 flex items-center gap-1"><FiClock /> Best Time Outside</p>
                  <p className="text-white font-semibold">{result.bestTime}</p>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                  <p className="text-gray-400 text-xs mb-1">🏠 Indoor Advice</p>
                  <p className="text-white font-semibold">{result.indoorWarning}</p>
                </div>
              </div>

              {/* Risk level tips */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Health Tips</p>
                {result.score > 60 && (
                  <p className="text-sm flex items-start gap-2 text-gray-300">
                    <FiAlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" />
                    Consult a doctor if you experience breathlessness or chest tightness
                  </p>
                )}
                {profile.asthma && (
                  <p className="text-sm flex items-start gap-2 text-gray-300">
                    <FiAlertTriangle className="text-orange-400 mt-0.5 flex-shrink-0" />
                    Keep your inhaler accessible at all times
                  </p>
                )}
                <p className="text-sm flex items-start gap-2 text-gray-300">
                  <FiCheckCircle className="text-green-400 mt-0.5 flex-shrink-0" />
                  Stay hydrated – water helps flush pollutants from airways
                </p>
                <p className="text-sm flex items-start gap-2 text-gray-300">
                  <FiCheckCircle className="text-green-400 mt-0.5 flex-shrink-0" />
                  Use air purifier indoors with HEPA filter
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
              <FiHeart className="text-blue-400 text-3xl" />
            </div>
            <h3 className="text-white font-display font-bold text-xl mb-2">Ready to Analyze</h3>
            <p className="text-gray-400 text-sm">
              Fill in your health profile and fetch your city AQI to get a personalized risk assessment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthRisk;
