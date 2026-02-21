"""
Smart Cash Flow Predictor — Financial Insights Engine
Implements: Rule-based analysis + Linear regression trend detection
Input: JSON from stdin (financialResult object)
Output: JSON to stdout { insights, recommendations, riskLevel }
"""
import json
import sys


def linear_slope(values):
    """Compute the slope of a simple linear regression (trend direction)."""
    n = len(values)
    if n < 2:
        return 0.0
    x_mean = (n - 1) / 2.0
    y_mean = sum(values) / n
    num = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(values))
    den = sum((i - x_mean) ** 2 for i in range(n))
    return num / den if den != 0 else 0.0


def pct(value, base):
    """Safe percentage calculation."""
    return (value / base) * 100 if base != 0 else 0.0


def analyze(data):
    monthly_data = data.get("monthlyData", [])

    if not monthly_data:
        return {
            "insights": ["No financial data available for analysis."],
            "recommendations": ["Upload a CSV file with monthly financial data to get insights."],
            "riskLevel": "low",
        }

    revenues = [float(m.get("Revenue", 0)) for m in monthly_data]
    costs = [float(m.get("totalCost", 0)) for m in monthly_data]
    net_profits = [float(m.get("netProfit", 0)) for m in monthly_data]
    closing_cash = [float(m.get("closingCash", 0)) for m in monthly_data]
    loan_emis = [float(m.get("Loan_EMI", 0)) for m in monthly_data]

    n = len(monthly_data)

    # === LINEAR REGRESSION SLOPES ===
    rev_slope = linear_slope(revenues)
    cost_slope = linear_slope(costs)
    profit_slope = linear_slope(net_profits)

    # === AGGREGATE METRICS ===
    total_revenue = sum(revenues)
    total_cost = sum(costs)
    avg_revenue = total_revenue / n
    avg_cost = total_cost / n

    expense_ratio = total_cost / total_revenue if total_revenue > 0 else 9.99
    latest_cash = closing_cash[-1] if closing_cash else 0
    latest_profit = net_profits[-1] if net_profits else 0
    burn_months = sum(1 for p in net_profits if p < 0)
    burn_ratio = burn_months / n

    total_loan = sum(loan_emis)
    loan_burden = total_loan / total_revenue if total_revenue > 0 else 0

    # === RISK SCORING (additive) ===
    risk_score = 0
    insights = []
    recommendations = []

    # --- Revenue trend ---
    rev_slope_pct = pct(rev_slope, avg_revenue) if avg_revenue > 0 else 0
    if rev_slope > 0:
        insights.append(
            f"Revenue is trending upward at approximately {rev_slope_pct:.1f}% per month."
        )
        recommendations.append(
            "Reinforce growth by identifying your highest-performing revenue channels and scaling them."
        )
    elif rev_slope < -0.01 * avg_revenue:
        risk_score += 2
        insights.append(
            f"Revenue shows a declining trend of {abs(rev_slope_pct):.1f}% per month. Intervention is needed."
        )
        recommendations.append(
            "Investigate revenue decline sources — customer churn, pricing sensitivity, or market conditions — and act within 30 days."
        )
    else:
        insights.append("Revenue has remained largely flat across the analysis period.")
        recommendations.append(
            "Launch a structured growth initiative. Flat revenue with rising costs leads to margin compression."
        )

    # --- Profitability trend ---
    if profit_slope > 0:
        insights.append("Net profit margins are improving month over month.")
    elif profit_slope < 0:
        risk_score += 1
        insights.append(
            "Profit margins are compressing — costs are growing faster than revenue."
        )
        recommendations.append(
            "Conduct a zero-based cost review. Identify the top three cost drivers and set reduction targets."
        )

    # --- Expense ratio ---
    if expense_ratio >= 1.3:
        risk_score += 2
        insights.append(
            f"Cost-to-revenue ratio is {expense_ratio*100:.0f}% — dangerously above sustainable levels."
        )
        recommendations.append(
            "Freeze all non-critical expenditure immediately. Renegotiate supplier and vendor contracts."
        )
    elif expense_ratio >= 1.0:
        risk_score += 1
        insights.append(
            f"Expenses exceed revenue at {expense_ratio*100:.0f}% — breakeven has not been achieved."
        )
        recommendations.append(
            "Set a hard budget ceiling of 90% of monthly revenue and review spend weekly."
        )
    elif expense_ratio <= 0.75:
        insights.append(
            f"Cost efficiency is strong — expenses are {expense_ratio*100:.0f}% of revenue."
        )

    # --- Cash position ---
    two_month_ops = avg_cost * 2
    if latest_cash < 0:
        risk_score += 3
        insights.append(
            "The business is in a negative cash position. This is a critical operational risk."
        )
        recommendations.append(
            "Secure emergency liquidity immediately through credit facilities, investor bridge funding, or asset monetization."
        )
    elif latest_cash < two_month_ops:
        risk_score += 1
        insights.append(
            "Cash reserves are below two months of operating expenses — a thin safety margin."
        )
        recommendations.append(
            "Prioritize building cash reserves to cover at least three months of operations before any growth expenditure."
        )
    else:
        insights.append(
            "Cash reserves provide adequate operational coverage relative to expense levels."
        )

    # --- Loan burden ---
    if loan_burden > 0.2:
        risk_score += 1
        recommendations.append(
            "Debt repayment consumes over 20% of revenue. Explore refinancing options to reduce monthly obligations."
        )

    # --- Burn rate ---
    if burn_ratio > 0.5:
        risk_score += 1
        recommendations.append(
            f"{burn_months} of {n} months were loss-making. Develop a clear path to consistent monthly profitability."
        )

    # === RISK CLASSIFICATION VIA DECISION TREE LOGIC ===
    if risk_score >= 5:
        risk_level = "high"
    elif risk_score >= 2:
        risk_level = "medium"
    else:
        risk_level = "low"

    # Deduplicate and cap
    seen_i, seen_r = set(), set()
    final_insights, final_recs = [], []
    for x in insights:
        if x not in seen_i:
            seen_i.add(x)
            final_insights.append(x)
    for x in recommendations:
        if x not in seen_r:
            seen_r.add(x)
            final_recs.append(x)

    return {
        "insights": final_insights[:4],
        "recommendations": final_recs[:4],
        "riskLevel": risk_level,
    }


if __name__ == "__main__":
    try:
        raw = sys.stdin.read()
        data = json.loads(raw)
        result = analyze(data)
        print(json.dumps(result))
    except Exception as e:
        print(
            json.dumps(
                {
                    "insights": ["Analysis encountered an error."],
                    "recommendations": ["Ensure your CSV data is valid and re-upload."],
                    "riskLevel": "medium",
                    "error": str(e),
                }
            )
        )
