import React, { useState } from "react";
import { uploadCSV } from "../services/api";

/* SVG Upload icon */
const UploadIcon = () => (
  <svg viewBox="0 0 16 16" className="drop-icon-svg" aria-hidden="true">
    <path d="M8 10V2M5 5l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 11v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" strokeLinecap="round" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 16 16" className="drop-icon-svg" aria-hidden="true">
    <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 2z" />
    <path d="M9 2v4h4" />
    <path d="M5 8h6M5 11h4" strokeLinecap="round" />
  </svg>
);

function FileUpload({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = (selected) => {
    if (!selected) return;
    if (!selected.name.endsWith(".csv")) {
      setError("Only CSV files are supported.");
      return;
    }
    setFile(selected);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a CSV file."); return; }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await uploadCSV(formData);
      onSuccess(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to process CSV. Check columns and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="upload-header">
          <h3>Upload CSV</h3>
          <p>Required: Month, Opening_Cash, Revenue, Fixed_Cost, Variable_Cost, Inventory_Cost, Loan_EMI</p>
        </div>

        <label
          className={`file-dropzone${dragging ? " dragging" : ""}`}
          htmlFor="csvUpload"
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
        >
          <input
            id="csvUpload"
            type="file"
            accept=".csv"
            className="file-input"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          <div className="drop-icon-wrap">
            {file ? <FileIcon /> : <UploadIcon />}
          </div>
          <span className="drop-title">
            {file ? "Ready to analyze" : "Drop CSV or click to browse"}
          </span>
          {file
            ? <span className="drop-file-name">{file.name}</span>
            : <span className="drop-subtitle">CSV files only</span>
          }
        </label>

        <button className="primary-btn" type="submit" disabled={loading || !file} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? "Analyzing..." : "Run Analysis"}
        </button>

        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}

export default FileUpload;
