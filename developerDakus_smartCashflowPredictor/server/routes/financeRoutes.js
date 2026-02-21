const express = require("express");
const multer = require("multer");
const path = require("path");
const { uploadFinanceCSV } = require("../controllers/financeController");
const { getHealthScore } = require("../controllers/healthController");
const { getFinancialInsights } = require("../controllers/insightsController");
const { exportReport } = require("../controllers/reportController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

router.post("/upload", upload.single("file"), uploadFinanceCSV);
router.get("/health", getHealthScore);
router.get("/insights", getFinancialInsights);
router.get("/export-report", exportReport);

module.exports = router;
