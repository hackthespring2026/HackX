import { useState } from "react";
import { uploadPdf } from "../api/ragApi";

export default function PdfUploader() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a PDF file");
      return;
    }

    setStatus("Uploading & indexing...");

    try {
      const res = await uploadPdf(file);
      setStatus(`✅ ${res.filename} indexed successfully`);
    } catch (err) {
      setStatus("❌ Upload failed");
    }
  };

  return (
    <div className="pdf-uploader">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload PDF</button>
      <p>{status}</p>
    </div>
  );
}
