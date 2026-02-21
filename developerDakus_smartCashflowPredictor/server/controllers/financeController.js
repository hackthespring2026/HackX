const fs = require("fs");
const parseCSVFile = require("../utils/csvParser");
const calculateFinancialMetrics = require("../services/calculationService");
const store = require("../store");
const { invalidateCache } = require("./healthController");

const uploadFinanceCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "CSV file is required" });
  }

  const filePath = req.file.path;

  try {
    const rows = await parseCSVFile(filePath);
    const result = calculateFinancialMetrics(rows);

    // Save to shared store and bust health score cache
    store.setLastResult(result);
    invalidateCache();

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      message: error.message || "Failed to process CSV file",
    });
  } finally {
    fs.unlink(filePath, () => { });
  }
};

module.exports = { uploadFinanceCSV };
