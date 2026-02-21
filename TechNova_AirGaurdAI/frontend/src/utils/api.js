import axios from "axios";

/* ===========================
   Backend API Base
=========================== */

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ===========================
   AQI FUNCTIONS (USE BACKEND)
=========================== */

// Get AQI for any city
export async function getCityAQI(city) {
  try {
    const res = await api.get(`/aqi/city/${city}`);
    return res.data;
  } catch (err) {
    console.error("Backend AQI fetch error:", err);
    return null;
  }
}

// Get AQI by coordinates
export async function getAQIByCoords(lat, lng) {
  try {
    const res = await api.get(`/aqi/geo/${lat}/${lng}`);
    return res.data;
  } catch (err) {
    console.error("Backend geo AQI error:", err);
    return null;
  }
}

// Get AQI map data
export async function getMapData(bounds) {
  try {
    const res = await api.get(`/aqi/map?bounds=${bounds}`);
    return res.data;
  } catch (err) {
    console.error("Backend map AQI error:", err);
    return null;
  }
}

/* ===========================
   AQI Helper Functions
=========================== */

export function getAQIColor(aqi) {
  if (aqi <= 50) return "#22c55e";
  if (aqi <= 100) return "#eab308";
  if (aqi <= 150) return "#f97316";
  if (aqi <= 200) return "#ef4444";
  if (aqi <= 300) return "#a855f7";
  return "#7f1d1d";
}

export function getAQILabel(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export function getAQIClass(aqi) {
  if (aqi <= 50) return "aqi-safe";
  if (aqi <= 100) return "aqi-moderate";
  if (aqi <= 150) return "aqi-unhealthy";
  if (aqi <= 200) return "aqi-danger";
  return "aqi-hazardous";
}

/* ===========================
   Backend API Calls
=========================== */

export async function loginUser(email, password) {
  return api.post("/auth/login", { email, password });
}

export async function registerUser(name, email, password) {
  return api.post("/auth/register", { name, email, password });
}

export async function saveHealthProfile(profile) {
  return api.post("/health/profile", profile);
}

export async function getHealthRisk(profile, aqi) {
  return api.post("/health/risk", { ...profile, aqi });
}

export async function getPrediction(data) {
  return api.post("/predict", data);
}

export async function updateChallenge(action) {
  return api.post("/challenge/update", { action });
}

export async function getLeaderboard() {
  return api.get("/challenge/leaderboard");
}

export default api;