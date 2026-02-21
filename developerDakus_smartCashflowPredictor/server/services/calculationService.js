const toNumber = (value, fieldName, monthLabel) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${fieldName} in month ${monthLabel}`);
  }
  return parsed;
};

const calculateFinancialMetrics = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("CSV contains no data rows");
  }

  let burnMonths = 0;
  let totalLoss = 0;
  let breakEvenMonth = null;
  let latestClosingCash = 0;

  const risks = [];
  let consecutiveLossMonths = 0;
  let revenueDecreaseStreak = 0;
  let previousRevenue = null;

  const monthlyData = rows.map((row) => {
    const month = String(row.Month || "").trim();
    if (!month) {
      throw new Error("Month value is required for every row");
    }

    const openingCash = toNumber(row.Opening_Cash, "Opening_Cash", month);
    const revenue = toNumber(row.Revenue, "Revenue", month);
    const fixedCost = toNumber(row.Fixed_Cost, "Fixed_Cost", month);
    const variableCost = toNumber(row.Variable_Cost, "Variable_Cost", month);
    const inventoryCost = toNumber(row.Inventory_Cost, "Inventory_Cost", month);
    const loanEmi = toNumber(row.Loan_EMI, "Loan_EMI", month);

    const totalCost = fixedCost + variableCost + inventoryCost + loanEmi;
    const netProfit = revenue - totalCost;
    const closingCash = openingCash + netProfit;

    if (netProfit < 0) {
      burnMonths += 1;
      totalLoss += Math.abs(netProfit);
      consecutiveLossMonths += 1;
      if (consecutiveLossMonths >= 2) {
        risks.push(`HIGH RISK: Consecutive monthly losses observed by ${month}`);
      }
    } else {
      consecutiveLossMonths = 0;
    }

    if (closingCash < 0) {
      risks.push(`CRITICAL: Negative closing cash in ${month}`);
    }

    if (previousRevenue !== null && revenue < previousRevenue) {
      revenueDecreaseStreak += 1;
      if (revenueDecreaseStreak >= 2) {
        risks.push(`DECLINING REVENUE: Revenue dropped for two consecutive months by ${month}`);
      }
    } else {
      revenueDecreaseStreak = 0;
    }

    previousRevenue = revenue;

    if (!breakEvenMonth && revenue >= totalCost) {
      breakEvenMonth = month;
    }

    latestClosingCash = closingCash;

    return {
      Month: month,
      Opening_Cash: openingCash,
      Revenue: revenue,
      Fixed_Cost: fixedCost,
      Variable_Cost: variableCost,
      Inventory_Cost: inventoryCost,
      Loan_EMI: loanEmi,
      totalCost,
      netProfit,
      closingCash
    };
  });

  const averageLoss = burnMonths > 0 ? totalLoss / burnMonths : 0;
  const runway = averageLoss > 0 ? latestClosingCash / averageLoss : "Healthy";

  return {
    monthlyData,
    burnMonths,
    averageLoss,
    runway,
    breakEvenMonth,
    risks: [...new Set(risks)]
  };
};

module.exports = calculateFinancialMetrics;
