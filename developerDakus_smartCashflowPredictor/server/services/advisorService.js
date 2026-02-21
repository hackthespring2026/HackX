/**
 * AI Advisor Service — Rule-Based Recommendation Engine
 *
 * Produces deterministic, explainable financial insights and recommendations
 * based on cashflow trends, expense ratios, revenue growth, and runway.
 * No external models or API calls required.
 */

/**
 * Derive enriched context from financial result.
 */
function deriveContext(financialResult) {
    const { runway, burnMonths, averageLoss, monthlyData, breakEvenMonth, risks } =
        financialResult;
    const totalMonths = monthlyData ? monthlyData.length : 0;

    // Revenue trend (month-over-month growth rates)
    const revGrowthRates = [];
    for (let i = 1; i < (monthlyData || []).length; i++) {
        const prev = monthlyData[i - 1].Revenue;
        const curr = monthlyData[i].Revenue;
        if (prev > 0) revGrowthRates.push((curr - prev) / prev);
    }
    const avgRevGrowth =
        revGrowthRates.length > 0
            ? revGrowthRates.reduce((a, b) => a + b, 0) / revGrowthRates.length
            : 0;

    // Expense ratio
    const totalRevenue = (monthlyData || []).reduce((a, m) => a + m.Revenue, 0);
    const totalCost = (monthlyData || []).reduce((a, m) => a + m.totalCost, 0);
    const expenseRatio = totalRevenue > 0 ? totalCost / totalRevenue : 999;

    // Latest month cashflow
    const latestMonth = monthlyData && monthlyData.length > 0
        ? monthlyData[monthlyData.length - 1]
        : null;
    const latestNetProfit = latestMonth ? latestMonth.netProfit : 0;
    const latestClosingCash = latestMonth ? latestMonth.closingCash : 0;

    // Loan burden ratio
    const totalLoanEMI = (monthlyData || []).reduce((a, m) => a + (m.Loan_EMI || 0), 0);
    const loanBurden = totalRevenue > 0 ? totalLoanEMI / totalRevenue : 0;

    // Inventory efficiency
    const totalInventory = (monthlyData || []).reduce((a, m) => a + (m.Inventory_Cost || 0), 0);
    const inventoryRatio = totalCost > 0 ? totalInventory / totalCost : 0;

    // Consecutive loss streak (latest)
    let lossStreak = 0;
    for (let i = (monthlyData || []).length - 1; i >= 0; i--) {
        if (monthlyData[i].netProfit < 0) {
            lossStreak++;
        } else {
            break;
        }
    }

    return {
        runway,
        burnMonths,
        totalMonths,
        burnRatio: totalMonths > 0 ? burnMonths / totalMonths : 0,
        avgRevGrowth,
        expenseRatio,
        latestNetProfit,
        latestClosingCash,
        loanBurden,
        inventoryRatio,
        lossStreak,
        breakEvenMonth,
        risks,
    };
}

/**
 * Rule engine — evaluates context, returns insights and recommendations.
 */
function runRules(ctx) {
    const insights = [];
    const recommendations = [];

    // ── RUNWAY RULES ───────────────────────────────────────────────────────────
    if (typeof ctx.runway === "number") {
        if (ctx.runway <= 0) {
            insights.push("⚠️ Business has no remaining cash runway — immediate action required.");
            recommendations.push("Secure emergency bridge financing or investor funding within 30 days.");
        } else if (ctx.runway < 3) {
            insights.push(`🚨 Critical: Only ${ctx.runway.toFixed(1)} months of cash runway remaining.`);
            recommendations.push("Immediately reduce non-essential costs and explore invoice factoring or credit lines.");
        } else if (ctx.runway < 6) {
            insights.push(`⚠️ Short runway: ${ctx.runway.toFixed(1)} months — limited buffer against surprises.`);
            recommendations.push("Target a 6-month runway. Negotiate better payment terms with suppliers and accelerate receivables.");
        } else if (ctx.runway >= 18) {
            insights.push(`✅ Healthy runway of ${ctx.runway.toFixed(1)} months provides strong operational stability.`);
            recommendations.push("Consider deploying surplus cash into growth initiatives or high-yield short-term instruments.");
        } else {
            insights.push(`📊 Runway of ${ctx.runway.toFixed(1)} months is adequate — monitor monthly.`);
        }
    } else {
        insights.push("✅ No negative cashflow detected — business is self-sustaining.");
        recommendations.push("Leverage financial stability to invest in marketing, talent, or product expansion.");
    }

    // ── EXPENSE RATIO RULES ────────────────────────────────────────────────────
    if (ctx.expenseRatio >= 1.3) {
        insights.push(`🔴 Expense ratio is ${(ctx.expenseRatio * 100).toFixed(0)}% of revenue — critically over-spending.`);
        recommendations.push("Conduct a zero-based budget review. Identify and eliminate all non-revenue-generating costs immediately.");
    } else if (ctx.expenseRatio >= 1.0) {
        insights.push(`🟠 Spending exceeds revenue at ${(ctx.expenseRatio * 100).toFixed(0)}% ratio — breakeven not yet achieved.`);
        recommendations.push("Set a hard spending cap of 90% of monthly revenue and track weekly against a burn budget.");
    } else if (ctx.expenseRatio >= 0.85) {
        insights.push(`🟡 Expense ratio of ${(ctx.expenseRatio * 100).toFixed(0)}% leaves a thin profit margin.`);
        recommendations.push("Identify top 3 variable cost drivers and negotiate 10–15% reduction with vendors.");
    } else {
        insights.push(`🟢 Healthy expense ratio of ${(ctx.expenseRatio * 100).toFixed(0)}% — good cost discipline.`);
    }

    // ── REVENUE GROWTH RULES ───────────────────────────────────────────────────
    if (ctx.avgRevGrowth < -0.05) {
        insights.push(`📉 Revenue declining at ${(ctx.avgRevGrowth * 100).toFixed(1)}% avg month-over-month.`);
        recommendations.push("Audit customer acquisition and retention. Consider launching promotions, upsells, or new pricing tiers.");
    } else if (ctx.avgRevGrowth < 0) {
        insights.push("📉 Slight revenue contraction detected — growth has stalled.");
        recommendations.push("Reactivate churned customers with win-back campaigns and increase touchpoints with existing accounts.");
    } else if (ctx.avgRevGrowth >= 0.1) {
        insights.push(`🚀 Strong revenue growth at +${(ctx.avgRevGrowth * 100).toFixed(1)}% avg monthly.`);
        recommendations.push("Document growth drivers and double down on the highest-performing acquisition channels.");
    } else if (ctx.avgRevGrowth >= 0.02) {
        insights.push(`📈 Steady revenue growth at +${(ctx.avgRevGrowth * 100).toFixed(1)}% avg monthly.`);
        recommendations.push("Set a growth target of 8–12% monthly and identify scalable channels to accelerate momentum.");
    } else {
        insights.push("➡️ Revenue is flat — growth momentum has plateaued.");
        recommendations.push("Survey top customers for expansion opportunities. Consider a product-led growth strategy.");
    }

    // ── LOSS STREAK RULES ──────────────────────────────────────────────────────
    if (ctx.lossStreak >= 3) {
        insights.push(`🔴 ${ctx.lossStreak} consecutive months of net losses — pattern is worsening.`);
        recommendations.push("Initiate a turnaround plan: freeze hiring, renegotiate leases/contracts, and set a 60-day profitability milestone.");
    } else if (ctx.lossStreak === 2) {
        insights.push("🟠 Two consecutive loss months — early warning signal.");
        recommendations.push("Schedule a financial review meeting. Identify if losses are structural or seasonal and act accordingly.");
    } else if (ctx.lossStreak === 1) {
        insights.push("🟡 Latest month ended with a net loss — monitor closely.");
        recommendations.push("Analyse whether the loss is one-off or systemic. Maintain a 15% contingency buffer in cash reserves.");
    }

    // ── LOAN BURDEN RULES ─────────────────────────────────────────────────────
    if (ctx.loanBurden > 0.25) {
        insights.push(`⚠️ Loan EMI is ${(ctx.loanBurden * 100).toFixed(0)}% of revenue — heavy debt burden.`);
        recommendations.push("Explore debt restructuring or refinancing at lower rates. Avoid taking on additional debt until revenue improves.");
    } else if (ctx.loanBurden > 0.12) {
        insights.push(`🟡 Loan repayments consume ${(ctx.loanBurden * 100).toFixed(0)}% of revenue.`);
        recommendations.push("Maintain a dedicated debt repayment reserve of 15% of monthly revenue to avoid cash crunches.");
    }

    // ── INVENTORY RULES ────────────────────────────────────────────────────────
    if (ctx.inventoryRatio > 0.35) {
        insights.push(`📦 Inventory costs account for ${(ctx.inventoryRatio * 100).toFixed(0)}% of total expenses — possibly overstocked.`);
        recommendations.push("Implement just-in-time inventory principles. Run clearance promotions on slow-moving inventory.");
    }

    // ── BREAK-EVEN RULES ──────────────────────────────────────────────────────
    if (!ctx.breakEvenMonth) {
        insights.push("⚠️ Break-even point not yet reached in the provided data.");
        recommendations.push("Model different pricing scenarios to identify the fastest path to breakeven.");
    } else {
        insights.push(`✅ Business achieved breakeven by ${ctx.breakEvenMonth}.`);
    }

    // Return top 5 of each, deduplicated
    return {
        insights: [...new Set(insights)].slice(0, 5),
        recommendations: [...new Set(recommendations)].slice(0, 5),
    };
}

/**
 * Main export.
 * @param {object} financialResult — output from calculationService
 * @returns {{ insights: string[], recommendations: string[] }}
 */
function generateAdvice(financialResult) {
    const ctx = deriveContext(financialResult);
    return runRules(ctx);
}

module.exports = { generateAdvice };
