/**
 * Health Score Service
 * Calculates a weighted 0-100 business health score from financial metrics.
 * Weights are configurable via the WEIGHTS object.
 */

const WEIGHTS = {
  runwayScore: 0.28,
  burnRateScore: 0.22,
  revenueGrowthScore: 0.20,
  expenseRatioScore: 0.18,
  consecutiveLossScore: 0.12,
};

const STATUS_THRESHOLDS = [
  { min: 80, status: "excellent" },
  { min: 65, status: "good" },
  { min: 45, status: "stable" },
  { min: 25, status: "poor" },
  { min: 0,  status: "critical" },
];

/**
 * Clamp a value between 0 and 100.
 */
const clamp = (val) => Math.max(0, Math.min(100, val));

/**
 * Calculate individual component scores (each 0-100).
 */
function componentScores(metrics) {
  const {
    runway,
    burnMonths,
    totalMonths,
    averageLoss,
    monthlyData,
  } = metrics;

  // 1. Runway Score — longer runway is better
  let runwayScore;
  if (typeof runway !== "number") {
    // runway is "Healthy" string — means no burn at all
    runwayScore = 100;
  } else if (runway <= 0) {
    runwayScore = 0;
  } else if (runway >= 18) {
    runwayScore = 100;
  } else {
    runwayScore = clamp((runway / 18) * 100);
  }

  // 2. Burn Rate Score — fewer burn months relative to total = better
  const burnRatio = totalMonths > 0 ? burnMonths / totalMonths : 0;
  const burnRateScore = clamp((1 - burnRatio) * 100);

  // 3. Revenue Growth Score — avg month-over-month growth
  let revenueGrowthScore = 50; // neutral default
  if (monthlyData && monthlyData.length >= 2) {
    let growthSum = 0;
    let growthCount = 0;
    for (let i = 1; i < monthlyData.length; i++) {
      const prev = monthlyData[i - 1].Revenue;
      const curr = monthlyData[i].Revenue;
      if (prev > 0) {
        growthSum += (curr - prev) / prev;
        growthCount++;
      }
    }
    const avgGrowth = growthCount > 0 ? growthSum / growthCount : 0;
    // Map: -50% → 0, 0% → 50, +30% or more → 100
    revenueGrowthScore = clamp(((avgGrowth + 0.5) / 0.8) * 100);
  }

  // 4. Expense Ratio Score — revenue covers expenses well = better
  let expenseRatioScore = 50;
  if (monthlyData && monthlyData.length > 0) {
    const revenueSum = monthlyData.reduce((a, m) => a + m.Revenue, 0);
    const costSum = monthlyData.reduce((a, m) => a + m.totalCost, 0);
    if (revenueSum > 0) {
      const ratio = costSum / revenueSum; // 1.0 = breakeven, <1 = profitable
      // ratio 0.5 → 100, ratio 1.0 → 50, ratio 1.5+ → 0
      expenseRatioScore = clamp(((1.5 - ratio) / 1.0) * 100);
    }
  }

  // 5. Consecutive Loss Score — penalise streaks of losses
  let maxConsecutiveLoss = 0;
  let streak = 0;
  if (monthlyData) {
    for (const m of monthlyData) {
      if (m.netProfit < 0) {
        streak++;
        maxConsecutiveLoss = Math.max(maxConsecutiveLoss, streak);
      } else {
        streak = 0;
      }
    }
  }
  // 0 consecutive = 100, 3+ = 0
  const consecutiveLossScore = clamp(((3 - maxConsecutiveLoss) / 3) * 100);

  return {
    runwayScore,
    burnRateScore,
    revenueGrowthScore,
    expenseRatioScore,
    consecutiveLossScore,
  };
}

/**
 * Main export — calculates the health score payload.
 * @param {object} financialResult — output from calculationService
 * @returns {{ score: number, status: string, breakdown: object }}
 */
function calculateHealthScore(financialResult) {
  const { runway, burnMonths, averageLoss, monthlyData, risks } = financialResult;
  const totalMonths = monthlyData ? monthlyData.length : 0;

  const metrics = { runway, burnMonths, averageLoss, monthlyData, totalMonths };
  const scores = componentScores(metrics);

  // Weighted sum
  const rawScore =
    scores.runwayScore       * WEIGHTS.runwayScore +
    scores.burnRateScore     * WEIGHTS.burnRateScore +
    scores.revenueGrowthScore * WEIGHTS.revenueGrowthScore +
    scores.expenseRatioScore  * WEIGHTS.expenseRatioScore +
    scores.consecutiveLossScore * WEIGHTS.consecutiveLossScore;

  const score = Math.round(clamp(rawScore));

  const statusEntry = STATUS_THRESHOLDS.find((t) => score >= t.min);
  const status = statusEntry ? statusEntry.status : "critical";

  return {
    score,
    status,
    breakdown: scores,
    totalMonths,
  };
}

module.exports = { calculateHealthScore };
