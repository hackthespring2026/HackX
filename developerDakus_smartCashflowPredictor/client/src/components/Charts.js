import React, { memo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
);

// ── Shared chart option factory ───────────────────────────────────────────────
const baseOptions = (extraScales = {}) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 900, easing: "easeOutQuart" },
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: {
      position: "top",
      align: "end",
      labels: {
        color: "#8fa3c8",
        font: { family: "'Plus Jakarta Sans', sans-serif", size: 13, weight: "600" },
        boxWidth: 10, boxHeight: 10, padding: 18,
        usePointStyle: true, pointStyle: "circle",
      },
    },
    tooltip: {
      backgroundColor: "rgba(4, 8, 15, 0.96)",
      titleColor: "#e6edf8",
      bodyColor: "#8fa3c8",
      borderColor: "rgba(75,124,243,0.25)",
      borderWidth: 1,
      padding: 14,
      cornerRadius: 10,
      titleFont: { family: "'Plus Jakarta Sans', sans-serif", weight: "700", size: 13 },
      bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13 },
      callbacks: {
        label: (ctx) => {
          const val = ctx.parsed?.y ?? ctx.parsed;
          if (typeof val !== "number") return ctx.formattedValue;
          const abs = Math.abs(val).toLocaleString("en-IN", { maximumFractionDigits: 0 });
          return `  ${ctx.dataset.label}: ₹${abs}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(80,120,200,0.06)", drawBorder: false },
      ticks: { color: "#8fa3c8", font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }, maxRotation: 0 },
      border: { display: false },
    },
    y: {
      grid: { color: "rgba(80,120,200,0.06)", drawBorder: false },
      ticks: {
        color: "#8fa3c8",
        font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
        callback: (val) => `₹${Math.abs(val).toLocaleString("en-IN", { notation: "compact", maximumFractionDigits: 1 })}`,
      },
      border: { display: false },
      ...extraScales,
    },
  },
});

// ── Net Profit trend ─────────────────────────────────────────────────────────
const NetProfitChart = memo(({ monthlyData }) => {
  const labels = monthlyData.map((m) => m.Month);
  const profits = monthlyData.map((m) => m.netProfit || 0);

  const data = {
    labels,
    datasets: [{
      label: "Net Profit",
      data: profits,
      borderColor: "#4b7cf3",
      backgroundColor: (ctx) => {
        const chart = ctx.chart;
        const { ctx: c, chartArea } = chart;
        if (!chartArea) return "rgba(75,124,243,0.10)";
        const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        grad.addColorStop(0, "rgba(75,124,243,0.22)");
        grad.addColorStop(1, "rgba(75,124,243,0.00)");
        return grad;
      },
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: "#4b7cf3",
      pointBorderColor: "#04080f",
      pointBorderWidth: 2,
      tension: 0.42,
      borderWidth: 2.5,
    }],
  };

  const opts = {
    ...baseOptions(),
    plugins: {
      ...baseOptions().plugins,
      legend: { display: false },
    },
  };

  return <Line data={data} options={opts} />;
});

// ── Closing Cash trend ────────────────────────────────────────────────────────
const ClosingCashChart = memo(({ monthlyData }) => {
  const labels = monthlyData.map((m) => m.Month);
  const cash = monthlyData.map((m) => m.closingCash || 0);

  const data = {
    labels,
    datasets: [{
      label: "Closing Cash",
      data: cash,
      borderColor: "#15c8a4",
      backgroundColor: (ctx) => {
        const chart = ctx.chart;
        const { ctx: c, chartArea } = chart;
        if (!chartArea) return "rgba(21,200,164,0.10)";
        const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        grad.addColorStop(0, "rgba(21,200,164,0.20)");
        grad.addColorStop(1, "rgba(21,200,164,0.00)");
        return grad;
      },
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: "#15c8a4",
      pointBorderColor: "#04080f",
      pointBorderWidth: 2,
      tension: 0.42,
      borderWidth: 2.5,
    }],
  };

  const opts = {
    ...baseOptions(),
    plugins: { ...baseOptions().plugins, legend: { display: false } },
  };

  return <Line data={data} options={opts} />;
});

// ── Revenue vs Expenses (grouped bar) ────────────────────────────────────────
const RevExpChart = memo(({ monthlyData }) => {
  const labels = monthlyData.map((m) => m.Month);
  const data = {
    labels,
    datasets: [
      {
        label: "Revenue",
        data: monthlyData.map((m) => m.Revenue || 0),
        backgroundColor: "rgba(75,124,243,0.72)",
        hoverBackgroundColor: "rgba(75,124,243,0.90)",
        borderRadius: 5, borderSkipped: false,
      },
      {
        label: "Expenses",
        data: monthlyData.map((m) => m.totalCost || 0),
        backgroundColor: "rgba(240,82,82,0.60)",
        hoverBackgroundColor: "rgba(240,82,82,0.80)",
        borderRadius: 5, borderSkipped: false,
      },
    ],
  };

  const opts = {
    ...baseOptions(),
    plugins: { ...baseOptions().plugins },
  };

  return <Bar data={data} options={opts} />;
});

// ── Expense Distribution (doughnut) ──────────────────────────────────────────
const ExpenseDistChart = memo(({ monthlyData }) => {
  const totFixed = monthlyData.reduce((s, m) => s + (m.Fixed_Cost || 0), 0);
  const totVariable = monthlyData.reduce((s, m) => s + (m.Variable_Cost || 0), 0);
  const totInventory = monthlyData.reduce((s, m) => s + (m.Inventory_Cost || 0), 0);
  const totLoan = monthlyData.reduce((s, m) => s + (m.Loan_EMI || 0), 0);

  const data = {
    labels: ["Fixed Cost", "Variable Cost", "Inventory", "Loan EMI"],
    datasets: [{
      data: [totFixed, totVariable, totInventory, totLoan],
      backgroundColor: [
        "rgba(75,124,243,0.80)",
        "rgba(240,82,82,0.75)",
        "rgba(245,166,35,0.80)",
        "rgba(157,122,244,0.80)",
      ],
      hoverOffset: 8,
      borderWidth: 2,
      borderColor: "#04080f",
    }],
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    animation: { duration: 900, easing: "easeOutQuart" },
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#8fa3c8",
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          boxWidth: 10, boxHeight: 10, padding: 14,
          usePointStyle: true, pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(4,8,15,0.96)",
        titleColor: "#e6edf8", bodyColor: "#8fa3c8",
        borderColor: "rgba(75,124,243,0.25)", borderWidth: 1,
        padding: 12, cornerRadius: 10,
        titleFont: { family: "'Plus Jakarta Sans', sans-serif", weight: "700", size: 12 },
        bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed;
            return `  ₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
          },
        },
      },
    },
  };

  return <Doughnut data={data} options={opts} />;
});

// ── Charts container ──────────────────────────────────────────────────────────
function Charts({ monthlyData }) {
  return (
    <section>
      {/* Row 1: Net Profit + Closing Cash */}
      <div className="charts-grid" style={{ marginBottom: "var(--sp-5)" }}>
        <div className="card chart-card lift-card">
          <div>
            <p className="chart-card-title">Net Profit Trend</p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-2)", marginTop: 2 }}>
              Monthly net profit / loss
            </p>
          </div>
          <div className="chart-frame"><NetProfitChart monthlyData={monthlyData} /></div>
        </div>

        <div className="card chart-card lift-card">
          <div>
            <p className="chart-card-title">Cash Position</p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-2)", marginTop: 2 }}>
              Month-end closing cash balance
            </p>
          </div>
          <div className="chart-frame"><ClosingCashChart monthlyData={monthlyData} /></div>
        </div>
      </div>

      {/* Row 2: Revenue vs Expenses (full width) */}
      <div className="charts-grid" style={{ gridTemplateColumns: "1.6fr 1fr", marginBottom: "var(--sp-5)" }}>
        <div className="card chart-card lift-card">
          <div>
            <p className="chart-card-title">Revenue vs. Expenses</p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-2)", marginTop: 2 }}>
              Monthly comparison — grouped bars
            </p>
          </div>
          <div className="chart-frame" style={{ height: 320 }}>
            <RevExpChart monthlyData={monthlyData} />
          </div>
        </div>

        <div className="card chart-card lift-card">
          <div>
            <p className="chart-card-title">Expense Distribution</p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--text-2)", marginTop: 2 }}>
              Total breakdown by category
            </p>
          </div>
          <div className="chart-frame" style={{ height: 320 }}>
            <ExpenseDistChart monthlyData={monthlyData} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(Charts);
