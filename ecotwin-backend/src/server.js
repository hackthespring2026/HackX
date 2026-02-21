// =============================================
// EcoTwin AI – server.js  (Entry Point)
// =============================================
require('dotenv').config();
const http    = require('http');
const app     = require('./app');
const db      = require('./config/db');
const { initWebSocket } = require('./config/websocket');

const PORT = process.env.PORT || 5000;

// Connect DB then start
db.connect().then(() => {
  const server = http.createServer(app);

  // WebSocket for real-time IoT streaming
  initWebSocket(server);

  server.listen(PORT, () => {
    console.log(`\n🌿 EcoTwin AI Backend running on port ${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV}`);
    console.log(`   WebSocket   : ws://localhost:${PORT}\n`);
  });
}).catch(err => {
  console.error('❌ DB connection failed:', err.message);
  process.exit(1);
});
