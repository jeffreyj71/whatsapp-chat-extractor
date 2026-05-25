require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');

const logger = require('./utils/logger');
const { initClient, registerWsClient } = require('./whatsappClient');

const statusRouter = require('./routes/status');
const chatsRouter = require('./routes/chats');
const extractRouter = require('./routes/extract');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', statusRouter);
app.use('/api', chatsRouter);
app.use('/api', extractRouter);

// Serve export files for direct download
const exportsPath = path.resolve(process.env.EXPORTS_PATH || 'exports');
app.use('/exports', express.static(exportsPath));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);

// WebSocket server — shares the same HTTP server
const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  logger.info('Browser WebSocket connected');
  registerWsClient(ws);
});

server.listen(PORT, () => {
  logger.info(`Server listening on http://localhost:${PORT}`);
  // Start WhatsApp client asynchronously — UI polls/WS for status
  initClient().catch((err) => logger.error(`WhatsApp init error: ${err.message}`));
});
