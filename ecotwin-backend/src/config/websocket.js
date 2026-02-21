// =============================================
// EcoTwin AI – config/websocket.js
// Real-time IoT device stream via WebSocket
// =============================================
const { WebSocketServer } = require('ws');
const DeviceReading        = require('../models/DeviceReading');

let wss;

const initWebSocket = (server) => {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    console.log(`🔌 WS client connected from ${req.socket.remoteAddress}`);

    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'EcoTwin live stream active' }));

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw);
        // Clients can subscribe to specific device streams
        if (msg.type === 'SUBSCRIBE') {
          ws.subscribedDeviceId = msg.deviceId || null;
        }
      } catch {/* ignore malformed */ }
    });

    ws.on('close', () => console.log('🔌 WS client disconnected'));
  });

  console.log('📡 WebSocket server initialised');
};

// Broadcast a new device reading to all connected WS clients
const broadcast = (payload) => {
  if (!wss) return;
  const data = JSON.stringify({ type: 'DEVICE_UPDATE', payload });
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      // If client subscribed to a specific device, filter
      if (!client.subscribedDeviceId || client.subscribedDeviceId === payload.deviceId) {
        client.send(data);
      }
    }
  });
};

module.exports = { initWebSocket, broadcast };
