const path = require('path');
const fs = require('fs');
const sanitize = require('sanitize-filename');

/**
 * Return a safe directory name for an export job.
 * e.g. "My Chat_2024-01-01_2024-03-31"
 */
function buildExportDirName(chatName, startSlug, endSlug) {
  const safeName = sanitize(chatName || 'unknown').replace(/\s+/g, '_').slice(0, 60);
  return `${safeName}_${startSlug}_${endSlug}`;
}

/**
 * Ensure a directory exists (recursive mkdir).
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Build a safe media filename from an index, mime type, and optional original name.
 * e.g. "image_001.jpg", "document_003.pdf"
 */
function buildMediaFilename(index, mimetype, originalFilename) {
  const paddedIndex = String(index).padStart(3, '0');

  if (originalFilename) {
    const safe = sanitize(originalFilename).replace(/\s+/g, '_').slice(0, 80);
    if (safe) return `${paddedIndex}_${safe}`;
  }

  const extMap = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/opus': 'opus',
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/zip': 'zip',
    'text/plain': 'txt',
  };

  const typePrefix = (mimetype || '').split('/')[0] || 'file';
  const ext = extMap[mimetype] || (mimetype ? mimetype.split('/')[1]?.split(';')[0] : 'bin') || 'bin';
  return `${typePrefix}_${paddedIndex}.${ext}`;
}

/**
 * Write a Buffer or base64 string to a file path.
 */
function writeMedia(filePath, data) {
  if (typeof data === 'string') {
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  } else {
    fs.writeFileSync(filePath, data);
  }
}

module.exports = { buildExportDirName, ensureDir, buildMediaFilename, writeMedia };
