const User = require("../models/User");

// Custom AI health risk scoring logic
function calculateHealthRisk(profile, aqi) {
  let score = 0;

  // Base AQI contribution to risk
  if (aqi <= 50) score += 10;
  else if (aqi <= 100) score += 30;
  else if (aqi <= 150) score += 50;
  else if (aqi <= 200) score += 70;
  else score += 90;

  // Age-based vulnerability
  const age = profile.age || 25;
  if (age < 5 || age > 65) score += 20;
  else if (age < 12 || age > 50) score += 10;

  // Health conditions
  if (profile.asthma) score += 20;
  if (profile.heartProblem) score += 25;
  if (profile.diabetes) score += 10;
  if (profile.pregnant) score += 15;

  // Outdoor exposure
  score += (profile.outdoorHours || 2) * 5;

  // Exercise intensity
  const exerciseScore = { none: 0, light: 5, moderate: 10, intense: 20 };
  score += exerciseScore[profile.exercise] || 5;

  // Cap at 100
  score = Math.min(100, Math.max(0, score));

  // Determine risk level
  let riskLevel, riskColor;
  if (score < 25) { riskLevel = "Low"; riskColor = "green"; }
  else if (score < 50) { riskLevel = "Moderate"; riskColor = "yellow"; }
  else if (score < 75) { riskLevel = "High"; riskColor = "orange"; }
  else { riskLevel = "Severe"; riskColor = "red"; }

  // Mask recommendation
  let mask;
  if (aqi <= 50 && !profile.asthma) mask = "None required";
  else if (aqi <= 100) mask = "Cloth mask";
  else if (aqi <= 150) mask = "Surgical mask";
  else mask = "N95 / KN95 respirator";

  // Safe outdoor duration (hours)
  const safeDuration = Math.max(0, Math.floor((100 - score) / 20));

  return {
    score,
    riskLevel,
    riskColor,
    mask,
    safeDuration,
    bestTime: aqi <= 100 ? "Anytime (morning preferred)" : aqi <= 150 ? "6 AM – 8 AM only" : "Avoid going outside",
    indoorAdvice: aqi > 150 ? "Keep windows closed all day" : aqi > 100 ? "Close windows 10 AM – 7 PM" : "Ventilate in early morning",
  };
}

// POST /api/health/risk – Calculate health risk score
const getHealthRisk = async (req, res) => {
  try {
    const { age, asthma, heartProblem, diabetes, pregnant, outdoorHours, exercise, aqi } = req.body;

    if (!aqi) {
      return res.status(400).json({ error: "AQI value is required" });
    }

    const profile = { age, asthma, heartProblem, diabetes, pregnant, outdoorHours, exercise };
    const result = calculateHealthRisk(profile, Number(aqi));

    res.json({ success: true, result });
  } catch (err) {
    console.error("Health risk error:", err);
    res.status(500).json({ error: "Failed to calculate health risk" });
  }
};

// POST /api/health/profile – Save user health profile
const saveHealthProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const profile = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { healthProfile: profile },
      { new: true }
    );

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ success: true, healthProfile: user.healthProfile });
  } catch (err) {
    console.error("Save profile error:", err);
    res.status(500).json({ error: "Failed to save health profile" });
  }
};

module.exports = { getHealthRisk, saveHealthProfile };
