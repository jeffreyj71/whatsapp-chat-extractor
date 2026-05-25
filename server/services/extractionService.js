const path = require('path');
const { getClient, broadcast } = require('../whatsappClient');
const { isInRange, parseDatetime, toDateSlug } = require('../utils/dateUtils');
const { buildExportDirName, ensureDir } = require('../utils/fileUtils');
const { downloadMedia } = require('./mediaService');
const { writeExports } = require('./exportService');
const logger = require('../utils/logger');
require('dotenv').config();

const EXPORTS_BASE = path.resolve(process.env.EXPORTS_PATH || 'exports');

function serializeMessage(msg, mediaResult) {
  return {
    id: msg.id?.id || msg.id?._serialized || '',
    timestamp: msg.timestamp,
    date: new Date(msg.timestamp * 1000).toISOString(),
    sender: msg.author || msg.from || '',
    senderName: msg._data?.notifyName || '',
    direction: msg.fromMe ? 'outgoing' : 'incoming',
    type: msg.type,
    body: msg.body || '',
    isDeleted: msg.type === 'revoked',
    isForwarded: msg.isForwarded || false,
    quotedMessageId: msg._data?.quotedMsg?.id?.id || '',
    quotedBody: msg._data?.quotedMsg?.body || '',
    hasMedia: msg.hasMedia || false,
    mediaFilename: mediaResult?.filename || '',
    mediaStatus: !msg.hasMedia
      ? 'none'
      : mediaResult?.saved
        ? 'downloaded'
        : mediaResult?.reason || 'not_requested',
    location: msg.location
      ? { lat: msg.location.latitude, lng: msg.location.longitude, description: msg.location.description }
      : null,
    vCard: msg.vCards?.length ? msg.vCards : null,
  };
}

function updateJob(jobs, jobId, patch) {
  const job = jobs.get(jobId);
  if (job) Object.assign(job, patch);
  broadcast('progress', { jobId, ...(jobs.get(jobId) || {}) });
}

/**
 * Fetch ALL messages for a chat by repeatedly loading earlier messages
 * until we've gone past the start date or exhausted the history.
 */
async function fetchAllMessages(client, chat, startMs, endMs, jobId, jobs, updateJob) {
  // Step 1: load the chat page to populate message cache
  updateJob(jobs, jobId, { progress: { step: 'fetching_messages', percent: 12 } });

  // Initial fetch — gets the most recent messages into browser memory
  let fetched = [];
  try {
    fetched = await chat.fetchMessages({ limit: 500 });
  } catch (err) {
    logger.warn(`Initial fetchMessages error: ${err.message}`);
  }

  logger.info(`Job ${jobId}: initial fetch returned ${fetched.length} messages`);

  // If still empty, try via page evaluation as a fallback
  if (fetched.length === 0) {
    logger.warn(`Job ${jobId}: fetchMessages returned 0 — trying page-level load`);
    try {
      // Force WhatsApp Web to open the chat and load messages
      await client.pupPage.evaluate(async (chatId) => {
        const chat = await window.Store.Chat.find(chatId);
        if (chat) await chat.loadEarlierMsgs();
      }, chat.id._serialized);

      await new Promise((r) => setTimeout(r, 2000));
      fetched = await chat.fetchMessages({ limit: 500 });
      logger.info(`Job ${jobId}: after forced load, got ${fetched.length} messages`);
    } catch (err) {
      logger.warn(`Page-level load failed: ${err.message}`);
    }
  }

  // Step 2: paginate backwards if needed — keep loading earlier messages until we pass startMs
  let allFetched = [...fetched];
  let attempts = 0;
  const MAX_ROUNDS = 50; // cap at 50 rounds × 500 = 25k messages

  while (attempts < MAX_ROUNDS) {
    // Find the oldest message we have
    const oldest = allFetched.reduce((min, m) => (!min || m.timestamp < min.timestamp ? m : min), null);
    if (!oldest) break;

    // If oldest is already before our start date, we have enough
    if (oldest.timestamp * 1000 < startMs) break;

    updateJob(jobs, jobId, {
      progress: { step: 'fetching_messages', percent: 15 + Math.min(attempts * 2, 20), count: allFetched.length },
    });

    logger.info(`Job ${jobId}: loading earlier messages (round ${attempts + 1}), oldest so far: ${new Date(oldest.timestamp * 1000).toISOString()}`);

    let earlier = [];
    try {
      earlier = await chat.fetchMessages({ limit: 500, before: oldest.id._serialized });
    } catch (err) {
      logger.warn(`Earlier fetch error: ${err.message}`);
      break;
    }

    if (!earlier || earlier.length === 0) break;

    // De-duplicate by id
    const existingIds = new Set(allFetched.map((m) => m.id._serialized));
    const newOnes = earlier.filter((m) => !existingIds.has(m.id._serialized));
    if (newOnes.length === 0) break;

    allFetched = allFetched.concat(newOnes);
    attempts++;
    await new Promise((r) => setTimeout(r, 400));
  }

  logger.info(`Job ${jobId}: total fetched = ${allFetched.length}`);

  // Filter to date range
  const inRange = allFetched.filter((m) => isInRange(m.timestamp, startMs, endMs));
  logger.info(`Job ${jobId}: ${inRange.length} messages in date range`);

  return inRange;
}

async function run(params, jobs) {
  const { jobId, chatId, chatName, startDate, startTime, endDate, endTime, includeMedia } = params;

  updateJob(jobs, jobId, { status: 'running', progress: { step: 'loading_chat', percent: 0 } });

  const client = getClient();
  if (!client) throw new Error('WhatsApp client not available');

  const startMs = parseDatetime(startDate, startTime, 'start');
  const endMs = parseDatetime(endDate, endTime, 'end');
  if (startMs >= endMs) throw new Error('Start date must be before end date');

  const startSlug = toDateSlug(new Date(startMs));
  const endSlug = toDateSlug(new Date(endMs));
  const dirName = buildExportDirName(chatName || chatId, startSlug, endSlug);
  const exportDir = path.join(EXPORTS_BASE, dirName);
  const mediaDir = path.join(exportDir, 'media');
  ensureDir(exportDir);
  if (includeMedia) ensureDir(mediaDir);

  updateJob(jobs, jobId, { progress: { step: 'loading_chat', percent: 5 } });
  const chat = await client.getChatById(chatId);
  if (!chat) throw new Error(`Chat not found: ${chatId}`);

  // Fetch and filter messages
  const allMessages = await fetchAllMessages(client, chat, startMs, endMs, jobId, jobs, updateJob);

  // Sort chronologically
  allMessages.sort((a, b) => a.timestamp - b.timestamp);

  // Media download + serialization
  const serialized = [];
  let mediaDownloaded = 0;
  let mediaFailed = 0;
  let mediaIndex = 0;

  updateJob(jobs, jobId, { progress: { step: 'processing_messages', percent: 40, total: allMessages.length } });

  for (let i = 0; i < allMessages.length; i++) {
    const msg = allMessages[i];
    let mediaResult = null;

    if (includeMedia && msg.hasMedia) {
      mediaIndex++;
      mediaResult = await downloadMedia(msg, mediaDir, mediaIndex);
      if (mediaResult.saved) mediaDownloaded++;
      else mediaFailed++;
    }

    serialized.push(serializeMessage(msg, mediaResult));

    if (i % 50 === 0 || i === allMessages.length - 1) {
      const percent = 40 + Math.round(((i + 1) / Math.max(allMessages.length, 1)) * 50);
      updateJob(jobs, jobId, {
        progress: {
          step: 'processing_messages',
          percent,
          processed: i + 1,
          total: allMessages.length,
          mediaDownloaded,
          mediaFailed,
        },
      });
    }
  }

  updateJob(jobs, jobId, { progress: { step: 'writing_exports', percent: 92 } });
  await writeExports({
    exportDir,
    messages: serialized,
    chatName: chatName || chat.name || chatId,
    startDate,
    endDate,
    mediaStats: { downloaded: mediaDownloaded, failed: mediaFailed },
  });

  updateJob(jobs, jobId, {
    status: 'done',
    progress: { step: 'complete', percent: 100 },
    result: {
      exportDir,
      dirName,
      messageCount: serialized.length,
      mediaDownloaded,
      mediaFailed,
    },
  });

  logger.info(`Job ${jobId} complete: ${serialized.length} messages, ${mediaDownloaded} media files`);
}

module.exports = { run };
