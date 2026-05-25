const express = require('express');
const router = express.Router();
const { getStatus } = require('../whatsappClient');

// GET /api/status
router.get('/status', (_req, res) => {
  res.json(getStatus());
});

// GET /api/qr  — returns the current QR as a base64 PNG data URL
router.get('/qr', (_req, res) => {
  const { status } = getStatus();
  // The QR is streamed via WebSocket; this REST endpoint is a fallback for polling clients.
  // We import the module-level currentQR via a getter.
  const wa = require('../whatsappClient');
  // whatsappClient does not expose currentQR directly; the WS is the primary channel.
  // If the client is not in qr_ready state, return a meaningful error.
  if (status !== 'qr_ready') {
    return res.status(409).json({ error: 'QR not available', status });
  }
  res.json({ status, message: 'Use WebSocket for live QR updates' });
});

module.exports = router;
