import React, { useEffect, useRef } from 'react';

const STEP_LABELS = {
  queued: 'Queued…',
  loading_chat: 'Loading chat…',
  fetching_messages: 'Fetching messages…',
  processing_messages: 'Processing messages…',
  writing_exports: 'Writing export files…',
  complete: 'Complete!',
};

export default function ProgressPanel({ jobStatus }) {
  const logsRef = useRef(null);
  const logLines = useRef([]);

  const progress = jobStatus?.progress || {};
  const step = progress.step || 'queued';
  const percent = progress.percent || 0;
  const label = STEP_LABELS[step] || step;

  // Build a running log
  const newLine = buildLogLine(progress);
  if (newLine && logLines.current[logLines.current.length - 1] !== newLine) {
    logLines.current.push(newLine);
  }

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  });

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>Extracting Messages</h2>

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${percent}%` }} />
      </div>
      <div style={styles.progressRow}>
        <span style={styles.stepLabel}>{label}</span>
        <span style={styles.percent}>{percent}%</span>
      </div>

      {progress.total > 0 && (
        <div style={styles.stats}>
          <Stat label="Messages processed" value={`${progress.processed || 0} / ${progress.total}`} />
          {progress.mediaDownloaded !== undefined && (
            <Stat label="Media downloaded" value={progress.mediaDownloaded} />
          )}
          {progress.mediaFailed > 0 && (
            <Stat label="Media skipped" value={progress.mediaFailed} warn />
          )}
        </div>
      )}

      <div style={styles.logBox} ref={logsRef}>
        {logLines.current.map((line, i) => (
          <div key={i} style={styles.logLine}>{line}</div>
        ))}
        {logLines.current.length === 0 && (
          <div style={styles.logLine}>Waiting for server…</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, warn }) {
  return (
    <div style={styles.stat}>
      <span style={styles.statLabel}>{label}</span>
      <span style={{ ...styles.statValue, color: warn ? '#f0a500' : '#25d366' }}>{value}</span>
    </div>
  );
}

function buildLogLine(progress) {
  const step = progress.step;
  if (!step) return null;
  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const label = STEP_LABELS[step] || step;
  if (progress.count) return `[${ts}] ${label} — ${progress.count} messages fetched`;
  if (progress.processed) return `[${ts}] ${label} — ${progress.processed}/${progress.total}`;
  return `[${ts}] ${label}`;
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  title: { margin: 0, fontSize: 20, fontWeight: 700 },
  progressBar: {
    height: 10, background: '#21262d', borderRadius: 5, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', background: '#25d366', borderRadius: 5,
    transition: 'width 0.4s ease',
  },
  progressRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stepLabel: { fontSize: 14, color: '#8b949e' },
  percent: { fontSize: 14, fontWeight: 600 },
  stats: {
    display: 'flex', gap: 16, flexWrap: 'wrap',
    background: '#161b22', borderRadius: 8, padding: '12px 16px',
    border: '1px solid #30363d',
  },
  stat: { display: 'flex', flexDirection: 'column', gap: 2 },
  statLabel: { fontSize: 11, color: '#8b949e' },
  statValue: { fontSize: 18, fontWeight: 700 },
  logBox: {
    background: '#0d1117', borderRadius: 8, padding: '12px 16px',
    border: '1px solid #30363d', fontFamily: 'monospace', fontSize: 12,
    color: '#8b949e', maxHeight: 200, overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  logLine: {},
};
