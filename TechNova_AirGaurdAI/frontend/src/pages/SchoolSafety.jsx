import React, { useState, useEffect } from "react";
import { FiAlertTriangle, FiCheckCircle, FiBell } from "react-icons/fi";
import { getAQIByCoords, getAQIColor, getAQILabel } from "../utils/api";

// GEO-based school data (VERY IMPORTANT)
const schools = [
  { name: "Delhi Public School", city: "Delhi", lat: 28.7041, lng: 77.1025, students: 2400 },
  { name: "St. Xavier's High School", city: "Mumbai", lat: 19.0760, lng: 72.8777, students: 1800 },
  { name: "Kendriya Vidyalaya", city: "Ahmedabad", lat: 23.0225, lng: 72.5714, students: 1200 },
  { name: "Ryan International", city: "Chennai", lat: 13.0827, lng: 80.2707, students: 2000 },
  { name: "City Montessori", city: "Kolkata", lat: 22.5726, lng: 88.3639, students: 3200 },
];

// Activity logic
function getActivities(aqi) {
  if (aqi <= 50) return {
    status: "Safe",
    color: "#22c55e",
    outdoor: ["Morning assembly ✅", "Sports & PT ✅", "Garden activities ✅"],
    indoor: [],
    alert: false,
  };

  if (aqi <= 100) return {
    status: "Acceptable",
    color: "#eab308",
    outdoor: ["Short breaks (<30 min) ✅"],
    indoor: ["Intense activities indoors recommended"],
    alert: false,
  };

  if (aqi <= 150) return {
    status: "Caution",
    color: "#f97316",
    outdoor: ["Limit outdoor time"],
    indoor: ["PT indoors 🏐", "Assembly in hall 🎤"],
    alert: true,
    message: "Sensitive children should stay indoors",
  };

  return {
    status: "Danger",
    color: "#ef4444",
    outdoor: ["All outdoor activities SUSPENDED ⛔"],
    indoor: ["All classes indoors 📚", "Yoga 🧘"],
    alert: true,
    message: "🚨 AQI dangerously high. All students indoors.",
  };
}

function SchoolSafety() {
  const [schoolData, setSchoolData] = useState({});
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [notified, setNotified] = useState(false);

  // 🔥 GEO-based AQI fetch
  useEffect(() => {
    const fetchAll = async () => {
      const results = {};

      for (const school of schools) {
        try {
          const data = await getAQIByCoords(school.lat, school.lng);

          if (data?.status === "ok") {
            console.log("AQI for", school.city, "=", data.data.aqi);
            results[school.name] = data.data.aqi;
          } else {
            results[school.name] = null;
          }
        } catch (err) {
          console.error("AQI fetch failed:", err);
          results[school.name] = null;
        }
      }

      setSchoolData(results);
    };

    fetchAll();
  }, []);

  const handleSelect = (school) => {
    setSelectedSchool({ ...school, aqi: schoolData[school.name] });
    setNotified(false);
  };

  const simulateNotify = () => {
    setNotified(true);
    setTimeout(() => setNotified(false), 3000);
  };

  const ALERT_THRESHOLD = 150;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">School Safety Monitor</h1>

      {/* School Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schools.map((school) => {
          const aqi = schoolData[school.name];
          const color = aqi ? getAQIColor(aqi) : "#6b7280";
          const isAlert = aqi > ALERT_THRESHOLD;

          return (
            <button
              key={school.name}
              onClick={() => handleSelect(school)}
              className="glass-card p-5 text-left"
              style={{ borderColor: `${color}40` }}
            >
              <p className="text-white font-semibold">{school.name}</p>
              <p className="text-gray-400 text-sm">
                {school.city} • {school.students} students
              </p>

              {aqi ? (
                <>
                  <div className="flex items-end gap-2 mt-3">
                    <span className="text-4xl font-bold" style={{ color }}>
                      {aqi}
                    </span>
                    <span className="text-sm text-gray-400">
                      {getAQILabel(aqi)}
                    </span>
                  </div>
                  {isAlert && (
                    <p className="text-red-400 text-xs mt-2 animate-pulse">
                      ⚠️ Action Required
                    </p>
                  )}
                </>
              ) : (
                <p className="text-gray-500 mt-3">Loading...</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected School Detail */}
      {selectedSchool && selectedSchool.aqi && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-white text-xl font-bold">
              {selectedSchool.name}
            </h2>
            <button
              onClick={simulateNotify}
              className="btn-primary px-4 py-2 text-sm"
            >
              <FiBell /> {notified ? "Parents Notified!" : "Notify Parents"}
            </button>
          </div>

          {(() => {
            const { status, color, outdoor, indoor, alert, message } =
              getActivities(selectedSchool.aqi);

            return (
              <>
                {alert && (
                  <div className="bg-red-500/10 p-4 rounded-xl">
                    <p className="text-red-400 font-bold">Health Alert</p>
                    <p className="text-gray-300 text-sm">{message}</p>
                  </div>
                )}

                <p className="text-lg font-bold" style={{ color }}>
                  AQI: {selectedSchool.aqi} ({status})
                </p>

                <div>
                  <h3 className="text-white font-semibold">Outdoor</h3>
                  {outdoor.map((item, i) => (
                    <p key={i} className="text-gray-300 text-sm">
                      {item}
                    </p>
                  ))}
                </div>

                <div>
                  <h3 className="text-white font-semibold">Indoor</h3>
                  {indoor.map((item, i) => (
                    <p key={i} className="text-gray-300 text-sm">
                      {item}
                    </p>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export default SchoolSafety;