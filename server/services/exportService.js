const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const logger = require('../utils/logger');

/**
 * Write messages.json, messages.csv, and summary.txt into exportDir.
 */
async function writeExports({ exportDir, messages, chatName, startDate, endDate, mediaStats }) {
  // messages.json
  const jsonPath = path.join(exportDir, 'messages.json');
  fs.writeFileSync(jsonPath, JSON.stringify(messages, null, 2), 'utf8');

  // messages.csv
  const csvPath = path.join(exportDir, 'messages.csv');
  try {
    const fields = [
      'id', 'timestamp', 'date', 'sender', 'direction',
      'type', 'body', 'mediaFilename', 'mediaStatus',
      'quotedMessageId', 'quotedBody', 'isDeleted', 'isForwarded',
    ];
    const parser = new Parser({ fields, defaultValue: '' });
    const csv = parser.parse(messages);
    fs.writeFileSync(csvPath, csv, 'utf8');
  } catch (err) {
    logger.warn(`CSV generation failed: ${err.message}`);
    fs.writeFileSync(csvPath, 'CSV generation failed: ' + err.message, 'utf8');
  }

  // summary.txt
  const summaryPath = path.join(exportDir, 'summary.txt');
  const summaryLines = [
    '=== WhatsApp Chat Export Summary ===',
    '',
    `Chat Name:          ${chatName}`,
    `Start Date:         ${startDate}`,
    `End Date:           ${endDate}`,
    `Total Messages:     ${messages.length}`,
    `Media Downloaded:   ${mediaStats.downloaded}`,
    `Media Unavailable:  ${mediaStats.failed}`,
    `Export Timestamp:   ${new Date().toISOString()}`,
    '',
    '=== Privacy Notice ===',
    'This export was generated locally. No data was sent to any third party.',
    'Only export chats you are authorized to access.',
  ];
  fs.writeFileSync(summaryPath, summaryLines.join('\n'), 'utf8');

  logger.info(`Exports written to ${exportDir}`);
}

module.exports = { writeExports };
