/**
 * Central API service layer.
 * All HTTP calls go through this module — one place to change base URL or add auth headers.
 */

import axios from "axios";

const BASE_URL = "http://localhost:5000/api/finance";

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
});

/**
 * Upload a CSV file for financial analysis.
 * @param {FormData} formData
 */
export const uploadCSV = (formData) =>
    api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

/**
 * Fetch the business health score.
 */
export const fetchHealthScore = () => api.get("/health");

/**
 * Export Financial Report — fetches PDF blob and triggers browser download.
 */
export const exportReportPDF = async () => {
    const response = await fetch(`${BASE_URL}/export-report`);
    if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.message || "Report generation failed");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    a.href = url;
    a.download = `Smart-Cashflow-Report-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export default api;

