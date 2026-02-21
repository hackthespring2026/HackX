const express = require("express");
const router = express.Router();
const { getCityAQI, getAQIByGeo, getMapAQI } = require("../controllers/aqiController");

router.get("/city/:cityName", getCityAQI);
router.get("/geo/:lat/:lng", getAQIByGeo);
router.get("/map", getMapAQI);

module.exports = router;
