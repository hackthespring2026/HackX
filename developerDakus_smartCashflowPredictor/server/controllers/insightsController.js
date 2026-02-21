/**
 * Insights Controller
 * Handles GET /api/financial-insights
 * Uses the Python-backed insights engine (with JS fallback).
 */

const store = require("../store");
const { getInsights } = require("../insights/insightsEngine");

let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000;

const getFinancialInsights = async (req, res) => {
    const financialResult = store.getLastResult();

    if (!financialResult) {
        return res.status(404).json({
            message: "No financial data found. Upload a CSV file first.",
        });
    }

    const now = Date.now();
    if (cache && now - cacheTimestamp < CACHE_TTL_MS) {
        return res.status(200).json(cache);
    }

    try {
        const payload = await getInsights(financialResult);
        cache = payload;
        cacheTimestamp = now;
        return res.status(200).json(payload);
    } catch (error) {
        return res.status(500).json({
            message: "Failed to generate financial insights.",
            error: error.message,
        });
    }
};

const invalidateInsightsCache = () => {
    cache = null;
    cacheTimestamp = 0;
};

module.exports = { getFinancialInsights, invalidateInsightsCache };
