const express = require("express");
const router = express.Router();
const { getHealthRisk, saveHealthProfile } = require("../controllers/healthController");
const protect = require("../utils/auth.middleware");

router.post("/risk", getHealthRisk);
router.post("/profile", protect, saveHealthProfile);

module.exports = router;
