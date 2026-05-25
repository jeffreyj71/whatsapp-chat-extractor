const express = require('express');
const router = express.Router();
const { getClient, getStatus } = require('../whatsappClient');
const logger = require('../utils/logger');

// GET /api/chats
router.get('/chats', async (_req, res) => {
  const { status } = getStatus();
  if (status !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected', status });
  }

  const client = getClient();
  try {
    const chats = await client.getChats();
    const simplified = chats.map((chat) => ({
      id: chat.id._serialized,
      name: chat.name || chat.id.user,
      isGroup: chat.isGroup,
      isReadOnly: chat.isReadOnly || false,
      unreadCount: chat.unreadCount || 0,
      lastMessageTimestamp: chat.timestamp || null,
      pinned: chat.pinned || false,
    }));
    // Sort by most recent message first
    simplified.sort((a, b) => (b.lastMessageTimestamp || 0) - (a.lastMessageTimestamp || 0));
    res.json({ chats: simplified });
  } catch (err) {
    logger.error(`Failed to fetch chats: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch chats', detail: err.message });
  }
});

module.exports = router;
