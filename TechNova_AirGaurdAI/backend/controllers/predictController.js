const axios = require("axios");

// POST /api/predict – Calls Python ML service for AQI prediction
const predict = async (req, res) => {
  try {
    const { city, scenario, currentAqi, years = 5 } = req.body;

    // Try to call Python ML service (if running)
    try {
      const mlResponse = await axios.post("http://localhost:8000/predict", {
        city,
        scenario,
        currentAqi,
        years,
      }, { timeout: 5000 });

      return res.json(mlResponse.data);
    } catch (mlErr) {
      // If ML service is not running, use built-in simulation
      console.log("ML service not available, using built-in simulation");
    }

    // Built-in simulation (when ML service is offline)
    const scenarios = {
      traffic_up: { aqiChange: +15, co2Change: +18 },
      factory: { aqiChange: +25, co2Change: +30 },
      vehicles_down: { aqiChange: -8, co2Change: -10 },
      trees_500: { aqiChange: -5, co2Change: -12 },
      ev_adoption: { aqiChange: -12, co2Change: -20 },
      solar: { aqiChange: -18, co2Change: -35 },
    };

    const impact = scenarios[scenario] || { aqiChange: 0, co2Change: 0 };
    const currentYear = new Date().getFullYear();

    // Generate forecast data points
    const forecast = Array.from({ length: years + 1 }, (_, i) => {
      const progress = i / years;
      return {
        year: currentYear + i,
        baseline: Math.round(currentAqi + (Math.random() - 0.5) * 10),
        predicted: Math.max(5, Math.round(currentAqi + impact.aqiChange * progress + (Math.random() - 0.5) * 5)),
      };
    });

    res.json({
      success: true,
      scenario,
      impact,
      forecast,
      summary: `${scenario} will change AQI by ${impact.aqiChange > 0 ? "+" : ""}${impact.aqiChange} over ${years} years`,
    });
  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ error: "Prediction failed" });
  }
};

module.exports = { predict };
