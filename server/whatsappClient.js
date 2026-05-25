const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config();

let client = null;
let currentQR = null;           // base64 PNG of latest QR
let connectionStatus = 'disconnected'; // disconnected | qr_ready | connecting | connected | auth_failure
let connectedInfo = null;       // { name, phoneNumber, platform }
const wsClients = new Set();    // WebSocket connections to broadcast to

function broadcast(event, data) {
  const payload = JSON.stringify({ event, data });
  for (const ws of wsClients) {
    try { ws.send(payload); } catch {}
  }
}

function registerWsClient(ws) {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
  // Immediately push current state to newly connected browser tab
  ws.send(JSON.stringify({ event: 'status', data: getStatus() }));
  if (currentQR) {
    ws.send(JSON.stringify({ event: 'qr', data: { qr: currentQR } }));
  }
}

function getStatus() {
  return { status: connectionStatus, info: connectedInfo };
}

function getClient() {
  return client;
}

async function initClient() {
  if (client) return;

  const sessionPath = path.resolve(process.env.SESSION_DATA_PATH || '.wwebjs_auth');

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  });

  client.on('qr', async (qrString) => {
    connectionStatus = 'qr_ready';
    logger.info('QR code received — waiting for scan');
    try {
      currentQR = await qrcode.toDataURL(qrString);
      broadcast('qr', { qr: currentQR });
      broadcast('status', getStatus());
    } catch (err) {
      logger.error(`QR generation failed: ${err.message}`);
    }
  });

  client.on('loading_screen', (percent, message) => {
    connectionStatus = 'connecting';
    logger.info(`Loading WhatsApp: ${percent}% — ${message}`);
    broadcast('status', { status: 'connecting', percent, message });
  });

  client.on('authenticated', () => {
    currentQR = null;
    connectionStatus = 'connecting';
    logger.info('Authenticated successfully');
    broadcast('status', getStatus());
  });

  client.on('auth_failure', (msg) => {
    connectionStatus = 'auth_failure';
    logger.error(`Auth failure: ${msg}`);
    broadcast('status', getStatus());
  });

  client.on('ready', async () => {
    connectionStatus = 'connected';
    currentQR = null;
    try {
      const info = client.info;
      connectedInfo = {
        name: info.pushname || 'Unknown',
        phoneNumber: info.wid?.user || 'Unknown',
        platform: info.platform || 'Unknown',
      };
    } catch {
      connectedInfo = {};
    }
    logger.info(`WhatsApp ready — connected as ${connectedInfo.name}`);
    broadcast('status', getStatus());
  });

  client.on('disconnected', (reason) => {
    connectionStatus = 'disconnected';
    connectedInfo = null;
    currentQR = null;
    logger.warn(`WhatsApp disconnected: ${reason}`);
    broadcast('status', getStatus());
    // Allow reinit on next request
    client = null;
  });

  logger.info('Initializing WhatsApp client…');
  await client.initialize();
}

module.exports = { initClient, getClient, getStatus, registerWsClient, broadcast };
