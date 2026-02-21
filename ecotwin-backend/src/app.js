// =============================================
// EcoTwin AI – app.js  (Express Config)
// =============================================
const express     = require('express');
const cors        = require('cors');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');

// Route imports
const authRoutes        = require('./routes/auth.routes');
const companyRoutes     = require('./routes/company.routes');
const deviceRoutes      = require('./routes/device.routes');
const emissionRoutes    = require('./routes/emission.routes');
const alertRoutes       = require('./routes/alert.routes');
const reportRoutes      = require('./routes/report.routes');
const dashboardRoutes   = require('./routes/dashboard.routes');
const notificationRoutes = require('./routes/notification.routes');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Middleware ──────────────────────────────
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Global rate limiter (100 req / 15 min per IP)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' }
}));

// ── Health check ────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'EcoTwin AI API', timestamp: new Date() });
});

// ── API Routes ──────────────────────────────
const API = '/api';
app.use(`${API}/auth`,          authRoutes);
app.use(`${API}/company`,       companyRoutes);
app.use(`${API}/device-data`,   deviceRoutes);
app.use(`${API}/emissions`,     emissionRoutes);
app.use(`${API}/alerts`,        alertRoutes);
app.use(`${API}/reports`,       reportRoutes);
app.use(`${API}/dashboard`,     dashboardRoutes);
app.use(`${API}/notifications`, notificationRoutes);

// ── 404 ─────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ─────────────────────
app.use(errorHandler);

module.exports = app;
