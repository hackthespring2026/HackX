import React, { useMemo } from "react";
import Sparkline from "./Sparkline";

/**
 * FinancialSummary — Revenue, Expenses, Net Cash Flow tiles with sparklines.
 * Receives `monthlyData` array from the finance result.
 */
function FinancialSummary({ monthlyData = [] }) {
    const stats = useMemo(() => {
        if (!monthlyData.length) return null;

        const revenues = monthlyData.map((m) => m.Revenue || 0);
        const costs = monthlyData.map((m) => m.totalCost || 0);
        const netCash = monthlyData.map((m) => m.closingCash || 0);

        const last = (arr) => arr[arr.length - 1] ?? 0;
        const prev = (arr) => arr[arr.length - 2] ?? arr[arr.length - 1] ?? 0;

        const pctChange = (cur, old) =>
            old === 0 ? 0 : ((cur - old) / Math.abs(old)) * 100;

        return [
            {
                label: "Total Revenue",
                value: last(revenues),
                prev: prev(revenues),
                values: revenues,
                color: "#4b7cf3",
                sub: `This month: ₹${last(revenues).toLocaleString()}`,
            },
            {
                label: "Total Expenses",
                value: last(costs),
                prev: prev(costs),
                values: costs,
                color: "#f05252",
                sub: `This month: ₹${last(costs).toLocaleString()}`,
                invert: true, // Rising expenses = negative trend
            },
            {
                label: "Net Cash Position",
                value: last(netCash),
                prev: prev(netCash),
                values: netCash,
                color: "#15c8a4",
                sub: `Closing balance`,
            },
        ].map((s) => ({
            ...s,
            change: pctChange(s.value, s.prev),
        }));
    }, [monthlyData]);

    if (!stats) return null;

    return (
        <section className="fin-summary-grid anim-up">
            {stats.map((s) => {
                const up = s.invert ? s.change <= 0 : s.change >= 0;
                const isFlat = Math.abs(s.change) < 0.5;
                const trendCls = isFlat ? "fin-trend-flat" : up ? "fin-trend-up" : "fin-trend-down";
                const trendSym = isFlat ? "—" : up ? "▲" : "▼";

                return (
                    <div className="fin-card lift-card" key={s.label}>
                        <div className="fin-card-header">
                            <span className="fin-card-label">{s.label}</span>
                            <span className={`fin-trend ${trendCls}`}>
                                {trendSym} {Math.abs(s.change).toFixed(1)}%
                            </span>
                        </div>

                        <p className="fin-card-value">
                            ₹{s.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </p>

                        <Sparkline values={s.values} color={s.color} />

                        <p className="fin-card-sub">{s.sub}</p>
                    </div>
                );
            })}
        </section>
    );
}

export default FinancialSummary;
