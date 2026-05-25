const path = require('path');
const logger = require('../utils/logger');
const { buildMediaFilename, writeMedia } = require('../utils/fileUtils');

/**
 * Attempt to download media for a message.
 * Returns { saved: true, filename, localPath } on success,
 * or { saved: false, reason } on failure.
 */
async function downloadMedia(message, mediaDir, mediaIndex) {
  try {
    // message.hasMedia is true for downloadable types
    if (!message.hasMedia) return { saved: false, reason: 'no_media' };

    const media = await message.downloadMedia();
    if (!media || !media.data) return { saved: false, reason: 'unavailable' };

    const filename = buildMediaFilename(mediaIndex, media.mimetype, media.filename);
    const localPath = path.join(mediaDir, filename);
    writeMedia(localPath, media.data);

    return { saved: true, filename, localPath, mimetype: media.mimetype };
  } catch (err) {
    logger.warn(`Media download failed for msg ${message.id?.id}: ${err.message}`);
    return { saved: false, reason: err.message };
  }
}

module.exports = { downloadMedia };
