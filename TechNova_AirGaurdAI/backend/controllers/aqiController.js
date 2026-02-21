const axios = require("axios");

const WAQI_TOKEN = process.env.WAQI_TOKEN || "demo";
const WAQI_BASE = "https://api.waqi.info";

// GET /api/aqi/city/:cityName
const getCityAQI = async (req, res) => {
  try {
    const { cityName } = req.params;
    const response = await axios.get(
      `${WAQI_BASE}/feed/${encodeURIComponent(cityName)}/?token=${WAQI_TOKEN}`
    );
    res.json(response.data);
  } catch (err) {
    console.error("WAQI city error:", err.message);
    res.status(500).json({ error: "Failed to fetch AQI data" });
  }
};

// GET /api/aqi/geo/:lat/:lng
const getAQIByGeo = async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const response = await axios.get(
      `${WAQI_BASE}/feed/geo:${lat};${lng}/?token=${WAQI_TOKEN}`
    );
    res.json(response.data);
  } catch (err) {
    console.error("WAQI geo error:", err.message);
    res.status(500).json({ error: "Failed to fetch geo AQI data" });
  }
};

// GET /api/aqi/map?bounds=lat1,lng1,lat2,lng2
const getMapAQI = async (req, res) => {
  try {
    const { bounds } = req.query;
    const response = await axios.get(
      `${WAQI_BASE}/v2/map/bounds/?latlng=${bounds}&networks=all&token=${WAQI_TOKEN}`
    );
    res.json(response.data);
  } catch (err) {
    console.error("WAQI map error:", err.message);
    res.status(500).json({ error: "Failed to fetch map AQI data" });
  }
};

module.exports = { getCityAQI, getAQIByGeo, getMapAQI };
