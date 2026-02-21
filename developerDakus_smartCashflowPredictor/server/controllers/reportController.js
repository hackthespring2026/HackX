/**
 * Report Controller
 * Handles GET /api/finance/export-report
 * Streams a generated PDF to the client.
 */

const store = require("../store");
const { generateReport } = require("../services/reportService");
const { getInsights } = require("../insights/insightsEngine");
const { calculateHealthScore } = require("../services/healthScoreService");
const { generateAdvice } = require("../services/advisorService");

const exportReport = async (req, res) => {
    const financialResult = store.getLastResult();

    if (!financialResult) {
        return res.status(404).json({
            message: "No financial data found. Please upload a CSV file first.",
        });
    }

    try {
        // Gather all report data
        const { score, status, breakdown } = calculateHealthScore(financialResult);
        const { insights: advisorInsights } = generateAdvice(financialResult);
        const insightsData = await getInsights(financialResult);

        const healthData = {
            score,
            status,
            breakdown,
            insights: advisorInsights,
        };

        // Build date string for filename
        const now = new Date();
        const yy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        const fname = `Smart-Cashflow-Report-${yy}-${mm}-${dd}.pdf`;

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${fname}"`);
        res.setHeader("Cache-Control", "no-cache");

        // Generate and pipe PDF
        const doc = generateReport({ financialResult, healthData, insightsData });
        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error("Report generation error:", error);
        if (!res.headersSent) {
            return res.status(500).json({
                message: "Failed to generate report.",
                error: error.message,
            });
        }
    }
};

module.exports = { exportReport };
