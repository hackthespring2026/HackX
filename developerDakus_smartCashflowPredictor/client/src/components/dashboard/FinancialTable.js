import React, { useState, useMemo, memo } from "react";

/**
 * FinancialTable — full-featured monthly financial data table.
 * Features: month filter, column sort (asc/desc), pagination (6 rows/page),
 *           previous-month comparison summary above the table.
 */

const PAGE_SIZE = 6;

const SORT_ICONS = { asc: "↑", desc: "↓", none: "↕" };

function fmt(v) {
    if (v === undefined || v === null) return "—";
    return `₹${Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function pct(cur, prev) {
    if (!prev || prev === 0) return null;
    const p = ((cur - prev) / Math.abs(prev)) * 100;
    return p;
}

// ── Previous month summary bar ────────────────────────────────────────────────
function PrevMonthSummary({ monthlyData }) {
    const n = monthlyData.length;
    if (n < 2) return null;

    const prev = monthlyData[n - 2];
    const curr = monthlyData[n - 1];

    const revChange = pct(curr.Revenue, prev.Revenue);
    const expChange = pct(curr.totalCost, prev.totalCost);
    const cashChange = pct(curr.closingCash, prev.closingCash);

    const Tag = ({ val, label }) => {
        if (val === null) return null;
        const up = val >= 0;
        return (
            <span className={`prev-change-tag ${up ? "prev-tag-up" : "prev-tag-down"}`}>
                {up ? "▲" : "▼"} {Math.abs(val).toFixed(1)}% {label}
            </span>
        );
    };

    return (
        <div className="prev-month-bar">
            <p className="prev-month-title">
                Previous Month Summary
                <span className="prev-month-range"> ({prev.Month} → {curr.Month})</span>
            </p>
            <div className="prev-month-stats">
                <div className="prev-stat-item">
                    <span className="prev-stat-label">Revenue</span>
                    <span className="prev-stat-now">{fmt(curr.Revenue)}</span>
                    <span className="prev-stat-was">was {fmt(prev.Revenue)}</span>
                    <Tag val={revChange} label="MoM" />
                </div>
                <div className="prev-stat-item">
                    <span className="prev-stat-label">Expenses</span>
                    <span className="prev-stat-now">{fmt(curr.totalCost)}</span>
                    <span className="prev-stat-was">was {fmt(prev.totalCost)}</span>
                    <Tag val={expChange} label="MoM" />
                </div>
                <div className="prev-stat-item">
                    <span className="prev-stat-label">Cash Position</span>
                    <span className="prev-stat-now">{fmt(curr.closingCash)}</span>
                    <span className="prev-stat-was">was {fmt(prev.closingCash)}</span>
                    <Tag val={cashChange} label="MoM" />
                </div>
            </div>
        </div>
    );
}

// ── Column header with sort button ────────────────────────────────────────────
function ColHead({ label, field, sort, onSort }) {
    const dir = sort.field === field ? sort.dir : "none";
    return (
        <th
            className={`ft-th ft-th-sort ${dir !== "none" ? "ft-th-active" : ""}`}
            onClick={() => onSort(field)}
            aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"}
        >
            {label} <span className="sort-icon" aria-hidden="true">{SORT_ICONS[dir]}</span>
        </th>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
function FinancialTable({ monthlyData = [] }) {
    const [monthFilter, setMonthFilter] = useState("All");
    const [sort, setSort] = useState({ field: null, dir: "none" });
    const [page, setPage] = useState(1);

    const months = useMemo(() => ["All", ...monthlyData.map((m) => m.Month)], [monthlyData]);

    const handleSort = (field) => {
        setSort((prev) => {
            if (prev.field !== field) return { field, dir: "asc" };
            if (prev.dir === "asc") return { field, dir: "desc" };
            return { field: null, dir: "none" };
        });
        setPage(1);
    };

    const filtered = useMemo(() => {
        let rows = monthFilter === "All"
            ? [...monthlyData]
            : monthlyData.filter((m) => m.Month === monthFilter);

        if (sort.field) {
            rows.sort((a, b) => {
                const av = a[sort.field] ?? 0;
                const bv = b[sort.field] ?? 0;
                return sort.dir === "asc" ? av - bv : bv - av;
            });
        }
        return rows;
    }, [monthlyData, monthFilter, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageRows = useMemo(
        () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [filtered, page]
    );

    if (!monthlyData.length) return null;

    return (
        <div className="ft-wrap card anim-up">
            {/* Previous month comparison */}
            <PrevMonthSummary monthlyData={monthlyData} />

            {/* Table toolbar */}
            <div className="ft-toolbar">
                <p className="ft-heading">Monthly Financial Data</p>
                <div className="ft-controls">
                    <label htmlFor="monthFilter" className="visually-hidden">Filter by month</label>
                    <select
                        id="monthFilter"
                        className="ft-select"
                        value={monthFilter}
                        onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
                    >
                        {months.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <span className="ft-count">{filtered.length} records</span>
                </div>
            </div>

            {/* Table */}
            <div className="ft-scroll">
                <table className="ft-table" role="grid">
                    <thead>
                        <tr>
                            <ColHead label="Month" field="Month" sort={sort} onSort={handleSort} />
                            <ColHead label="Revenue" field="Revenue" sort={sort} onSort={handleSort} />
                            <ColHead label="Expenses" field="totalCost" sort={sort} onSort={handleSort} />
                            <ColHead label="Net P&L" field="netProfit" sort={sort} onSort={handleSort} />
                            <ColHead label="Cash" field="closingCash" sort={sort} onSort={handleSort} />
                            <th className="ft-th">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageRows.map((m, i) => {
                            const np = m.netProfit || 0;
                            const isProfit = np >= 0;
                            const prevM = monthlyData[monthlyData.indexOf(m) - 1];
                            const revChg = prevM ? pct(m.Revenue, prevM.Revenue) : null;

                            return (
                                <tr key={m.Month + i} className="ft-row">
                                    <td className="ft-td ft-td-month">{m.Month}</td>
                                    <td className="ft-td ft-td-num">
                                        {fmt(m.Revenue)}
                                        {revChg !== null && (
                                            <span className={`ft-chg ${revChg >= 0 ? "ft-chg-up" : "ft-chg-down"}`}>
                                                {revChg >= 0 ? "▲" : "▼"} {Math.abs(revChg).toFixed(1)}%
                                            </span>
                                        )}
                                    </td>
                                    <td className="ft-td ft-td-num">{fmt(m.totalCost)}</td>
                                    <td className={`ft-td ft-td-num ${isProfit ? "ft-positive" : "ft-negative"}`}>
                                        {isProfit ? "+" : ""}{fmt(np)}
                                    </td>
                                    <td className="ft-td ft-td-num">{fmt(m.closingCash)}</td>
                                    <td className="ft-td">
                                        <span className={`status-pill ${isProfit ? "pill-profit" : "pill-loss"}`}>
                                            {isProfit ? "Profit" : "Loss"}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {pageRows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="ft-td ft-td-empty">No data for selected month</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="ft-pagination">
                    <button
                        className="ft-pg-btn"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        ‹ Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            className={`ft-pg-btn ${p === page ? "ft-pg-active" : ""}`}
                            onClick={() => setPage(p)}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        className="ft-pg-btn"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next ›
                    </button>
                </div>
            )}
        </div>
    );
}

export default memo(FinancialTable);
