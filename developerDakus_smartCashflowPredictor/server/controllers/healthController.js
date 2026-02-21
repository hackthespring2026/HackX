/**
 * Health Controller
 * Handles GET /api/health-score
 * Reads from the in-memory shared data store and applies 60s cache.
 */

const { calculateHealthScore } = require("../services/healthScoreService");
const { generateAdvice } = require("../services/advisorService");
const store = require("../store");

let cache = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

const getHealthScore = (req, res) => {
    const financialResult = store.getLastResult();

    if (!financialResult) {
        return res.status(404).json({
            message: "No financial data available. Please upload a CSV file first.",
        });
    }

    const now = Date.now();
    if (cache && now - cacheTimestamp < CACHE_TTL_MS) {
        return res.status(200).json(cache);
    }

    try {
        const { score, status, breakdown } = calculateHealthScore(financialResult);
        const { insights, recommendations } = generateAdvice(financialResult);

        const payload = {
            score,
            status,
            breakdown,
            insights,
            recommendations,
        };

        cache = payload;
        cacheTimestamp = now;

        return res.status(200).json(payload);
    } catch (error) {
        return res.status(500).json({
            message: "Failed to calculate health score.",
            error: error.message,
        });
    }
};

const invalidateCache = () => {
    cache = null;
    cacheTimestamp = 0;
};

module.exports = { getHealthScore, invalidateCache };
