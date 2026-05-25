const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getStatus } = require('../whatsappClient');
const extractionService = require('../services/extractionService');
const logger = require('../utils/logger');
require('dotenv').config();

// In-memory job store  { jobId: { status, progress, result, error } }
const jobs = new Map();

// POST /api/extract
router.post('/extract', async (req, res) => {
  const { status } = getStatus();
  if (status !== 'connected') {
    return res.status(503).json({ error: 'WhatsApp not connected', status });
  }

  const { chatId, chatName, startDate, startTime, endDate, endTime, includeMedia } = req.body;

  if (!chatId || !startDate || !endDate) {
    return res.status(400).json({ error: 'chatId, startDate, and endDate are required' });
  }

  const jobId = uuidv4();
  jobs.set(jobId, { status: 'queued', progress: null, result: null, error: null });

  res.json({ jobId });

  // Run asynchronously — do NOT await here; respond immediately with jobId
  extractionService
    .run({ jobId, chatId, chatName, startDate, startTime, endDate, endTime, includeMedia }, jobs)
    .catch((err) => {
      logger.error(`Job ${jobId} crashed: ${err.message}`);
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = err.message;
      }
    });
});

// GET /api/extract/:jobId/status
router.get('/extract/:jobId/status', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// GET /api/export/:jobId/download  — streams the export folder as a ZIP
router.get('/export/:jobId/download', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'done') return res.status(409).json({ error: 'Export not ready', status: job.status });

  const exportDir = job.result?.exportDir;
  if (!exportDir || !fs.existsSync(exportDir)) {
    return res.status(404).json({ error: 'Export directory not found' });
  }

  // Stream as ZIP using built-in archiver pattern via a child process
  const archiver = require('archiver');
  const dirName = path.basename(exportDir);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${dirName}.zip"`);

  const archive = archiver.create('zip', { zlib: { level: 6 } });
  archive.on('error', (err) => {
    logger.error(`ZIP error: ${err.message}`);
    res.status(500).end();
  });
  archive.pipe(res);
  archive.directory(exportDir, dirName);
  archive.finalize();
});

module.exports = router;
