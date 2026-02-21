const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();





const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Rate limiting to prevent API abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // max 1000 requests per window
  message: { error: "Too many requests, please try again later" },
});
app.use("/api", limiter);

// ── Routes ──
app.use("/api/auth", require("./routes/auth"));
app.use("/api/health", require("./routes/health"));
app.use("/api/aqi", require("./routes/aqi"));
app.use("/api/predict", require("./routes/predict"));
app.use("/api/challenge", require("./routes/challenge"));

// Root health check
app.get("/", (req, res) => {
  res.json({ message: "AirGuard API is running 🌿", version: "1.0.0" });
});

// ── Connect to MongoDB & Start Server ──
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 AirGuard server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("⚠️ MongoDB connection failed. Running without database.");
    console.log("   Tip: Install MongoDB or use MongoDB Atlas.");
    // Start server anyway for demo purposes
    app.listen(PORT, () => {
      console.log(`🚀 AirGuard server running on http://localhost:${PORT} (no DB)`);
    });
  });

module.exports = app;
