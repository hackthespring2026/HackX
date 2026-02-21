/**
 * Report Service — PDF Generation via PDFKit
 *
 * Generates a professional SaaS-style financial report PDF containing:
 *  - Business Health Score (with visual bar)
 *  - Financial Summary (Revenue, Expenses, Net Cash)
 *  - AI Insights & Recommendations
 *  - Monthly Comparison Table
 *  - Risk Alerts
 */

const PDFDocument = require("pdfkit");

// ── Design tokens ────────────────────────────────────────────────────────────
const COLORS = {
    dark: "#04080f",
    darkCard: "#0c1525",
    text: "#e6edf8",
    subtext: "#8fa3c8",
    border: "#1a2d4a",
    blue: "#4b7cf3",
    teal: "#15c8a4",
    red: "#f05252",
    amber: "#f5a623",
    green: "#30d488",
    violet: "#9d7af4",
    white: "#ffffff",
    lightGray: "#f5f7fa",
    bodyText: "#1a2234",
    headBg: "#04122a",
};

const PAGE = {
    size: "A4",
    margins: { top: 60, bottom: 60, left: 50, right: 50 },
    width: 595.28,
    height: 841.89,
    contentWidth: 495.28,    // width - left - right margins
};

// ── Utility helpers ──────────────────────────────────────────────────────────
function fmt(num) {
    if (num === undefined || num === null) return "—";
    return `Rs.${Math.abs(num).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtSign(num) {
    if (num === undefined || num === null) return "—";
    const abs = `Rs.${Math.abs(num).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    return num < 0 ? `-${abs}` : `+${abs}`;
}

function pct(cur, prev) {
    if (!prev || prev === 0) return "—";
    const change = ((cur - prev) / Math.abs(prev)) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function statusColor(status) {
    return {
        excellent: COLORS.teal,
        good: COLORS.blue,
        stable: COLORS.amber,
        poor: COLORS.red,
        critical: COLORS.red,
    }[status] || COLORS.subtext;
}

function riskColor(level) {
    return { low: COLORS.green, medium: COLORS.amber, high: COLORS.red }[level] || COLORS.subtext;
}

// ── Drawing helpers ──────────────────────────────────────────────────────────
function drawDivider(doc, y = null) {
    const x = PAGE.margins.left;
    const ly = y ?? doc.y + 10;
    doc.moveTo(x, ly).lineTo(x + PAGE.contentWidth, ly)
        .stroke(COLORS.border);
    doc.y = ly + 14;
}

function drawBadge(doc, label, x, y, color, width = 80) {
    const h = 16;
    doc.roundedRect(x, y, width, h, 3).fill(color + "22");
    doc.roundedRect(x, y, width, h, 3).stroke(color + "55");
    doc.fillColor(color).fontSize(7).font("Helvetica-Bold")
        .text(label.toUpperCase(), x, y + 4, { width, align: "center" });
}

function sectionHeading(doc, title) {
    doc.moveDown(0.5);
    doc.fillColor(COLORS.blue).fontSize(7).font("Helvetica-Bold")
        .text(title.toUpperCase(), { letterSpacing: 1.5 });
    doc.moveDown(0.25);
}

// ── Bar chart (horizontal) ────────────────────────────────────────────────────
function drawHorizontalBar(doc, x, y, total, actual, color, barHeight = 8) {
    const BAR_W = PAGE.contentWidth - 160;
    doc.roundedRect(x, y, BAR_W, barHeight, barHeight / 2).fill(COLORS.border);
    const fillW = total > 0 ? Math.min((actual / total) * BAR_W, BAR_W) : 0;
    if (fillW > 0) {
        doc.roundedRect(x, y, fillW, barHeight, barHeight / 2).fill(color);
    }
}

// ── Revenue vs Expenses bar chart (vertical, inline) ─────────────────────────
function drawBarChart(doc, monthlyData, x, y, chartW, chartH) {
    const n = Math.min(monthlyData.length, 12);
    const data = monthlyData.slice(-n);
    const allVals = data.flatMap((m) => [m.Revenue || 0, m.totalCost || 0]);
    const maxVal = Math.max(...allVals, 1);

    const barPairW = (chartW - 20) / n;
    const barW = (barPairW - 8) / 2;

    // Axes
    doc.rect(x, y, chartW, chartH).fill(COLORS.darkCard);
    doc.moveTo(x, y).lineTo(x, y + chartH).stroke(COLORS.border);
    doc.moveTo(x, y + chartH).lineTo(x + chartW, y + chartH).stroke(COLORS.border);

    data.forEach((m, i) => {
        const px = x + 10 + i * barPairW;

        const revH = maxVal > 0 ? ((m.Revenue || 0) / maxVal) * (chartH - 20) : 0;
        const costH = maxVal > 0 ? ((m.totalCost || 0) / maxVal) * (chartH - 20) : 0;

        // Revenue bar
        doc.rect(px, y + chartH - revH - 2, barW, revH).fill(COLORS.blue + "bb");
        // Cost bar
        doc.rect(px + barW + 2, y + chartH - costH - 2, barW, costH).fill(COLORS.red + "aa");

        // Month label
        doc.fillColor(COLORS.subtext).fontSize(6).font("Helvetica")
            .text(m.Month || "", px, y + chartH + 3, { width: barPairW, align: "center", lineBreak: false });
    });

    // Legend
    const lx = x + chartW - 110;
    const ly = y + 6;
    doc.rect(lx, ly, 8, 8).fill(COLORS.blue + "bb");
    doc.fillColor(COLORS.subtext).fontSize(7).font("Helvetica").text("Revenue", lx + 12, ly + 1);
    doc.rect(lx + 55, ly, 8, 8).fill(COLORS.red + "aa");
    doc.fillColor(COLORS.subtext).fontSize(7).font("Helvetica").text("Expenses", lx + 67, ly + 1);
}

// ── Net Profit line chart ─────────────────────────────────────────────────────
function drawLineChart(doc, monthlyData, x, y, chartW, chartH) {
    const n = Math.min(monthlyData.length, 12);
    const data = monthlyData.slice(-n);
    const values = data.map((m) => m.netProfit || 0);
    const maxV = Math.max(...values.map(Math.abs), 1);

    doc.rect(x, y, chartW, chartH).fill(COLORS.darkCard);

    // Zero axis
    const zeroY = y + chartH / 2;
    doc.moveTo(x, zeroY).lineTo(x + chartW, zeroY).stroke(COLORS.border);

    // Points
    const pts = values.map((v, i) => {
        const px = x + 10 + (i / Math.max(n - 1, 1)) * (chartW - 20);
        const py = zeroY - (v / maxV) * (chartH / 2 - 10);
        return [px, py];
    });

    if (pts.length > 1) {
        const isPositive = values[values.length - 1] >= 0;
        doc.moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k < pts.length; k++) {
            doc.lineTo(pts[k][0], pts[k][1]);
        }
        doc.stroke(isPositive ? COLORS.teal : COLORS.red);
    }

    pts.forEach(([px, py], i) => {
        const v = values[i];
        doc.circle(px, py, 2).fill(v >= 0 ? COLORS.teal : COLORS.red);
    });

    // Month labels
    data.forEach((m, i) => {
        const px = 10 + (i / Math.max(n - 1, 1)) * (chartW - 20);
        doc.fillColor(COLORS.subtext).fontSize(6).font("Helvetica")
            .text(m.Month || "", x + px - 8, y + chartH + 3, { width: 16, align: "center", lineBreak: false });
    });
}

// ── Table drawing ─────────────────────────────────────────────────────────────
function drawTable(doc, headers, rows, x, y, colWidths) {
    const ROW_H = 18;
    const HEADER_H = 22;
    const totalW = colWidths.reduce((a, b) => a + b, 0);

    // Header background
    doc.rect(x, y, totalW, HEADER_H).fill(COLORS.headBg);

    let cx = x + 6;
    headers.forEach((h, i) => {
        doc.fillColor(COLORS.subtext).fontSize(7).font("Helvetica-Bold")
            .text(h.toUpperCase(), cx, y + 7, { width: colWidths[i] - 12, lineBreak: false });
        cx += colWidths[i];
    });

    let ry = y + HEADER_H;
    rows.forEach((row, ri) => {
        // Alternating rows
        if (ri % 2 === 0) {
            doc.rect(x, ry, totalW, ROW_H).fill(COLORS.darkCard);
        } else {
            doc.rect(x, ry, totalW, ROW_H).fill(COLORS.dark + "80");
        }

        // Bottom border
        doc.moveTo(x, ry + ROW_H).lineTo(x + totalW, ry + ROW_H).stroke(COLORS.border);

        cx = x + 6;
        row.forEach((cell, ci) => {
            let color = COLORS.text;
            if (typeof cell === "object" && cell.type === "badge") {
                drawBadge(doc, cell.label, cx, ry + 4, cell.color, colWidths[ci] - 12);
                cx += colWidths[ci];
                return;
            }
            const val = String(cell);
            if (val.startsWith("+")) color = COLORS.green;
            else if (val.startsWith("-")) color = COLORS.red;
            doc.fillColor(color).fontSize(8).font("Helvetica")
                .text(val, cx, ry + 5, { width: colWidths[ci] - 12, lineBreak: false });
            cx += colWidths[ci];
        });
        ry += ROW_H;

        // Page break if needed
        if (ry + ROW_H > PAGE.height - PAGE.margins.bottom - 30) {
            doc.addPage();
            ry = PAGE.margins.top;
        }
    });

    return ry;
}

// ── Main export function ──────────────────────────────────────────────────────
function generateReport({ financialResult, healthData, insightsData }) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
    const { monthlyData, runway, burnMonths, averageLoss, breakEvenMonth, risks } = financialResult;

    const revenues = (monthlyData || []).map((m) => m.Revenue || 0);
    const costs = (monthlyData || []).map((m) => m.totalCost || 0);
    const profits = (monthlyData || []).map((m) => m.netProfit || 0);
    const totalRev = revenues.reduce((a, b) => a + b, 0);
    const totalExp = costs.reduce((a, b) => a + b, 0);
    const netCash = monthlyData?.length ? monthlyData[monthlyData.length - 1].closingCash : 0;
    const n = monthlyData?.length || 0;
    const prevRev = n >= 2 ? revenues[n - 2] : 0;
    const lastRev = n >= 1 ? revenues[n - 1] : 0;
    const prevExp = n >= 2 ? costs[n - 2] : 0;
    const lastExp = n >= 1 ? costs[n - 1] : 0;

    const doc = new PDFDocument({
        size: PAGE.size,
        margins: PAGE.margins,
        info: {
            Title: "Smart Cashflow Report",
            Author: "CashFlow AI",
            Subject: "Financial Analysis Report",
        },
    });

    const L = PAGE.margins.left;

    // ════════════════════════════════════════════════════════
    // PAGE 1 — COVER + HEALTH + SUMMARY
    // ════════════════════════════════════════════════════════

    // — Header banner ——————————————————————————————————————
    doc.rect(0, 0, PAGE.width, 110).fill(COLORS.headBg);

    doc.fillColor(COLORS.white).fontSize(22).font("Helvetica-Bold")
        .text("Smart Cashflow Report", L, 28);

    doc.fillColor(COLORS.subtext).fontSize(9).font("Helvetica")
        .text(`Generated on ${dateStr}  ·  CashFlow AI`, L, 56);

    doc.fillColor(COLORS.subtext).fontSize(8)
        .text(`Analysis period: ${n} months`, L, 72);

    // Status dot line
    const score = healthData?.score ?? 0;
    const status = healthData?.status ?? "—";
    const riskLv = insightsData?.riskLevel ?? "low";
    doc.fillColor(statusColor(status)).fontSize(10).font("Helvetica-Bold")
        .text(`Health Score: ${score}/100  ·  Status: ${status.toUpperCase()}`, L, 88);

    doc.y = 130;

    // ── Business Health Score ─────────────────────────────
    sectionHeading(doc, "Business Health Score");

    const hx = L;
    const hy = doc.y;
    const BAR_W = 320;
    const BAR_H = 14;

    doc.roundedRect(hx, hy, BAR_W, BAR_H, BAR_H / 2).fill(COLORS.border);
    const fillW2 = Math.max(0, (score / 100) * BAR_W);
    if (fillW2 > 0) {
        doc.roundedRect(hx, hy, fillW2, BAR_H, BAR_H / 2).fill(statusColor(status));
    }

    doc.fillColor(statusColor(status)).fontSize(11).font("Helvetica-Bold")
        .text(`${score}/100`, hx + BAR_W + 14, hy);

    drawBadge(doc, status, hx + BAR_W + 14, hy + 18, statusColor(status), 70);

    doc.y = hy + 40;

    // Breakdown table
    if (healthData?.breakdown) {
        const bk = healthData.breakdown;
        const bRows = [
            ["Runway Score", `${bk.runwayScore?.toFixed(0) ?? "—"}/100`],
            ["Burn Rate Score", `${bk.burnRateScore?.toFixed(0) ?? "—"}/100`],
            ["Revenue Growth Score", `${bk.revenueGrowthScore?.toFixed(0) ?? "—"}/100`],
            ["Expense Ratio Score", `${bk.expenseRatioScore?.toFixed(0) ?? "—"}/100`],
            ["Consecutive Loss Score", `${bk.consecutiveLossScore?.toFixed(0) ?? "—"}/100`],
        ];
        bRows.forEach(([label, val]) => {
            doc.fillColor(COLORS.subtext).fontSize(8).font("Helvetica")
                .text(label, L, doc.y, { continued: true, width: 240 });
            doc.fillColor(COLORS.text).font("Helvetica-Bold").text(val, { align: "right" });
        });
    }

    drawDivider(doc);

    // ── Financial Summary ─────────────────────────────────
    sectionHeading(doc, "Financial Summary");

    const summaryRows = [
        { label: "Total Revenue", value: fmt(totalRev), color: COLORS.blue, trend: pct(lastRev, prevRev) },
        { label: "Total Expenses", value: fmt(totalExp), color: COLORS.red, trend: pct(lastExp, prevExp) },
        { label: "Net Cash Position", value: fmt(netCash), color: netCash >= 0 ? COLORS.teal : COLORS.red, trend: "" },
        { label: "Avg Monthly Loss", value: fmt(averageLoss), color: COLORS.amber, trend: "" },
        { label: "Break-even Month", value: breakEvenMonth || "Not reached", color: COLORS.text, trend: "" },
        { label: "Cash Runway", value: typeof runway === "number" ? `${runway.toFixed(1)} months` : "Positive cashflow", color: COLORS.text, trend: "" },
        { label: "Loss Months Count", value: String(burnMonths), color: burnMonths > 0 ? COLORS.amber : COLORS.green, trend: "" },
    ];

    const COL1 = 220;
    const COL2 = 120;

    summaryRows.forEach((row) => {
        const y0 = doc.y;
        doc.fillColor(COLORS.subtext).fontSize(8).font("Helvetica")
            .text(row.label, L, y0, { width: COL1, lineBreak: false });
        doc.fillColor(row.color).font("Helvetica-Bold")
            .text(row.value, L + COL1, y0, { width: COL2, align: "right", lineBreak: false });
        if (row.trend) {
            const trendColor = row.trend.startsWith("+") ? COLORS.green : COLORS.red;
            doc.fillColor(trendColor).font("Helvetica").fontSize(7)
                .text(row.trend, L + COL1 + COL2 + 8, y0 + 1, { lineBreak: false });
        }
        doc.moveDown(0.5);
    });

    drawDivider(doc);

    // ── MOM Comparison ────────────────────────────────────
    if (n >= 2) {
        sectionHeading(doc, "Month-over-Month Comparison");

        const prevM = monthlyData[n - 2];
        const lastM = monthlyData[n - 1];

        const momRows = [
            ["", prevM.Month || "Previous", lastM.Month || "Current", "Change"],
            ["Revenue", fmt(prevM.Revenue), fmt(lastM.Revenue), pct(lastM.Revenue, prevM.Revenue)],
            ["Expenses", fmt(prevM.totalCost), fmt(lastM.totalCost), pct(lastM.totalCost, prevM.totalCost)],
            ["Net Profit", fmtSign(prevM.netProfit), fmtSign(lastM.netProfit), pct(lastM.netProfit, prevM.netProfit)],
            ["Closing Cash", fmt(prevM.closingCash), fmt(lastM.closingCash), pct(lastM.closingCash, prevM.closingCash)],
        ];

        const [h, ...bodyRows] = momRows;
        drawTable(doc, h, bodyRows, L, doc.y, [120, 110, 110, 90]);

        doc.y += 20;
        drawDivider(doc);
    }

    // ════════════════════════════════════════════════════════
    // PAGE 2 — CHARTS + MONTHLY TABLE
    // ════════════════════════════════════════════════════════
    doc.addPage();

    // — Chart: Revenue vs Expenses ———————————————————————
    sectionHeading(doc, "Revenue vs. Expenses");
    drawBarChart(doc, monthlyData || [], L, doc.y, PAGE.contentWidth, 130);
    doc.y += 155;
    drawDivider(doc);

    // — Chart: Net Profit Trend ——————————————————————————
    sectionHeading(doc, "Net Profit Trend");
    drawLineChart(doc, monthlyData || [], L, doc.y, PAGE.contentWidth, 100);
    doc.y += 125;
    drawDivider(doc);

    // — Monthly Data Table ——————————————————————————————
    sectionHeading(doc, "Monthly Financial Data");

    const tableHeaders = ["Month", "Revenue", "Expenses", "Net P&L", "Closing Cash", "Status"];
    const colWidths = [60, 90, 90, 90, 90, 75];

    const tableRows = (monthlyData || []).map((m) => {
        const np = m.netProfit || 0;
        return [
            m.Month || "—",
            fmt(m.Revenue),
            fmt(m.totalCost),
            fmtSign(np),
            fmt(m.closingCash),
            { type: "badge", label: np >= 0 ? "Profit" : "Loss", color: np >= 0 ? COLORS.teal : COLORS.red },
        ];
    });

    drawTable(doc, tableHeaders, tableRows, L, doc.y, colWidths);
    doc.y += 20;

    // ════════════════════════════════════════════════════════
    // PAGE 3 — INSIGHTS + RISK
    // ════════════════════════════════════════════════════════
    doc.addPage();

    // — Risk Level ——————————————————————————————————————
    sectionHeading(doc, "Risk Assessment");

    const rColor = riskColor(riskLv);
    doc.roundedRect(L, doc.y, PAGE.contentWidth, 36, 6).fill(rColor + "12");
    doc.roundedRect(L, doc.y, PAGE.contentWidth, 36, 6).stroke(rColor + "44");

    const riskY = doc.y;
    doc.fillColor(rColor).fontSize(11).font("Helvetica-Bold")
        .text(`Risk Level: ${riskLv.toUpperCase()}`, L + 14, riskY + 10);
    const riskDesc = { low: "Business fundamentals are healthy.", medium: "Some areas require attention.", high: "Critical issues — immediate action required." };
    doc.fillColor(COLORS.subtext).fontSize(8).font("Helvetica")
        .text(riskDesc[riskLv] || "", L + 14, riskY + 24);
    doc.y = riskY + 50;

    drawDivider(doc);

    // — Insights ——————————————————————————————————————
    sectionHeading(doc, "Key Insights");
    const insights = [...(insightsData?.insights || []), ...(healthData?.insights || [])];
    const uniqueInsights = [...new Set(insights)].slice(0, 6);

    uniqueInsights.forEach((ins, i) => {
        const iy = doc.y;
        doc.circle(L + 5, iy + 5, 3).fill(COLORS.blue);
        doc.fillColor(COLORS.text).fontSize(8.5).font("Helvetica")
            .text(ins, L + 16, iy, { width: PAGE.contentWidth - 16 });
        doc.moveDown(0.4);
    });

    drawDivider(doc);

    // — Recommendations ───────────────────────────────────
    sectionHeading(doc, "Recommendations");
    const recos = insightsData?.recommendations || [];

    recos.slice(0, 5).forEach((rec, i) => {
        const ry2 = doc.y;
        doc.roundedRect(L, ry2, 18, 16, 3).fill(COLORS.violet + "33");
        doc.fillColor(COLORS.violet).fontSize(9).font("Helvetica-Bold")
            .text(String(i + 1), L, ry2 + 3, { width: 18, align: "center" });
        doc.fillColor(COLORS.subtext).fontSize(8.5).font("Helvetica")
            .text(rec, L + 24, ry2, { width: PAGE.contentWidth - 24 });
        doc.moveDown(0.6);
    });

    drawDivider(doc);

    // — Risk Alerts ———————————————————————————————————
    if (risks && risks.length) {
        sectionHeading(doc, "Risk Alerts");
        risks.slice(0, 8).forEach((r) => {
            const isHigh = r.includes("CRITICAL") || r.includes("HIGH RISK");
            doc.fillColor(isHigh ? COLORS.red : COLORS.amber).fontSize(8).font("Helvetica-Bold")
                .text("!", L, doc.y, { continued: true, width: 14 });
            doc.fillColor(COLORS.text).font("Helvetica")
                .text(`  ${r}`, { width: PAGE.contentWidth - 14 });
            doc.moveDown(0.3);
        });
        drawDivider(doc);
    }

    // — Footer on last page ————————————————————————————
    const footerY = PAGE.height - 40;
    doc.moveTo(L, footerY).lineTo(L + PAGE.contentWidth, footerY).stroke(COLORS.border);
    doc.fillColor(COLORS.subtext).fontSize(7).font("Helvetica")
        .text(`CashFlow AI · Confidential  ·  Generated ${dateStr}  ·  Page 3`, L, footerY + 8, { align: "center", width: PAGE.contentWidth });

    return doc;
}

module.exports = { generateReport };
