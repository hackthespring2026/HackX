/**
 * Insights Engine — Node.js orchestrator
 * Tries to run the Python model first; falls back to a pure-JS engine
 * if Python is not available on the host machine.
 */

const { spawn } = require("child_process");
const path = require("path");

const MODEL_PATH = path.join(__dirname, "model.py");

// Python executables to try in order (cross-platform)
const PYTHON_CMDS = ["python", "python3", "py"];

/**
 * Run the Python model via child process.
 * @param {object} financialResult
 * @returns {Promise<object>}
 */
function runPythonModel(financialResult) {
    return new Promise((resolve, reject) => {
        let resolved = false;

        const tryCmd = (cmdIndex) => {
            if (cmdIndex >= PYTHON_CMDS.length) {
                return reject(new Error("No working Python interpreter found."));
            }

            const cmd = PYTHON_CMDS[cmdIndex];
            const proc = spawn(cmd, [MODEL_PATH], { timeout: 8000 });
            let output = "";
            let errOut = "";

            proc.stdout.on("data", (d) => (output += d.toString()));
            proc.stderr.on("data", (d) => (errOut += d.toString()));

            proc.on("error", () => tryCmd(cmdIndex + 1));

            proc.on("close", (code) => {
                if (resolved) return;
                if (code === 0 && output.trim()) {
                    try {
                        resolved = true;
                        resolve(JSON.parse(output.trim()));
                    } catch {
                        reject(new Error("Python model returned invalid JSON."));
                    }
                } else {
                    tryCmd(cmdIndex + 1);
                }
            });

            proc.stdin.write(JSON.stringify(financialResult));
            proc.stdin.end();
        };

        tryCmd(0);
    });
}

/**
 * Pure-JS fallback — deterministic rule-based engine.
 * Used when Python is unavailable.
 */
function runJSFallback(financialResult) {
    const { runway, burnMonths, averageLoss, monthlyData, breakEvenMonth } =
        financialResult;
    const n = monthlyData ? monthlyData.length : 0;
    const insights = [];
    const recommendations = [];
    let riskScore = 0;

    if (!n) {
        return {
            insights: ["No financial data available."],
            recommendations: ["Upload a CSV file to generate insights."],
            riskLevel: "low",
        };
    }

    const revenues = monthlyData.map((m) => m.Revenue || 0);
    const costs = monthlyData.map((m) => m.totalCost || 0);
    const profits = monthlyData.map((m) => m.netProfit || 0);
    const totalRev = revenues.reduce((a, b) => a + b, 0);
    const totalCost = costs.reduce((a, b) => a + b, 0);
    const expRatio = totalRev > 0 ? totalCost / totalRev : 9.99;
    const latestCash = monthlyData[n - 1]?.closingCash || 0;
    const burnRatio = burnMonths / n;

    // Revenue trend (simple slope)
    const revSlope =
        n >= 2 ? revenues[n - 1] - revenues[0] : 0;
    if (revSlope > 0) {
        insights.push("Revenue is on an upward trajectory across the analysis period.");
        recommendations.push("Scale the highest-performing acquisition channels to sustain momentum.");
    } else if (revSlope < 0) {
        riskScore += 2;
        insights.push("Revenue has declined over the analysis period — corrective action is required.");
        recommendations.push("Analyse root causes of revenue decline and implement a recovery plan within 30 days.");
    } else {
        insights.push("Revenue has remained flat — growth momentum has stalled.");
        recommendations.push("Launch targeted growth initiatives to move revenue off a flat baseline.");
    }

    // Expense ratio
    if (expRatio >= 1.2) {
        riskScore += 2;
        insights.push(`Cost-to-revenue ratio is ${(expRatio * 100).toFixed(0)}% — significantly over-spending.`);
        recommendations.push("Implement immediate cost controls and conduct a zero-based budget review.");
    } else if (expRatio >= 1.0) {
        riskScore += 1;
        insights.push(`Expenses exceed revenue (${(expRatio * 100).toFixed(0)}% ratio) — breakeven not achieved.`);
        recommendations.push("Set a hard spend cap at 90% of revenue and track weekly against burn budget.");
    } else if (expRatio <= 0.75) {
        insights.push(`Strong cost discipline — expenses are ${(expRatio * 100).toFixed(0)}% of revenue.`);
    }

    // Cash position
    const avgCost = totalCost / n;
    if (latestCash < 0) {
        riskScore += 3;
        insights.push("Negative cash position detected — this is a critical risk requiring immediate action.");
        recommendations.push("Secure emergency liquidity through credit lines, investor funding, or asset sales.");
    } else if (latestCash < avgCost * 2) {
        riskScore += 1;
        insights.push("Cash reserves cover less than two months of operating costs — limited buffer.");
        recommendations.push("Prioritise building a 3-month cash reserve before any discretionary spending.");
    } else {
        insights.push("Cash reserves provide adequate operating coverage.");
    }

    // Burn rate
    if (burnRatio > 0.5) {
        riskScore += 1;
        recommendations.push(`${burnMonths} of ${n} months resulted in losses. Develop a clear path to consistent profitability.`);
    }

    if (!breakEvenMonth) {
        riskScore += 1;
        insights.push("Breakeven has not been reached within the analysis period.");
        recommendations.push("Model pricing and cost scenarios to identify the fastest path to breakeven.");
    } else {
        insights.push(`Breakeven was achieved in ${breakEvenMonth}.`);
    }

    const riskLevel = riskScore >= 5 ? "high" : riskScore >= 2 ? "medium" : "low";

    return {
        insights: [...new Set(insights)].slice(0, 4),
        recommendations: [...new Set(recommendations)].slice(0, 4),
        riskLevel,
    };
}

/**
 * Main export — orchestrates Python then JS fallback.
 */
async function getInsights(financialResult) {
    try {
        return await runPythonModel(financialResult);
    } catch {
        return runJSFallback(financialResult);
    }
}

module.exports = { getInsights };
