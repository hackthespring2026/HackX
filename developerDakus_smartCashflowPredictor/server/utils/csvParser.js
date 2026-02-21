const fs = require("fs");
const csv = require("csv-parser");

const requiredHeaders = [
  "Month",
  "Opening_Cash",
  "Revenue",
  "Fixed_Cost",
  "Variable_Cost",
  "Inventory_Cost",
  "Loan_EMI"
];

const parseCSVFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    let headersValidated = false;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("headers", (headers) => {
        const missing = requiredHeaders.filter((header) => !headers.includes(header));
        if (missing.length > 0) {
          reject(new Error(`Missing required CSV columns: ${missing.join(", ")}`));
          return;
        }
        headersValidated = true;
      })
      .on("data", (data) => {
        rows.push(data);
      })
      .on("end", () => {
        if (!headersValidated) {
          reject(new Error("Invalid CSV header row"));
          return;
        }
        resolve(rows);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

module.exports = parseCSVFile;
