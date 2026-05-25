import React from 'react';
import { api } from '../api/client.js';

export default function ResultsPanel({ jobStatus, jobId, onReset }) {
  const failed = jobStatus?.status === 'failed';
  const result = jobStatus?.result || {};

  const handleDownload = () => {
    window.location.href = api.getDownloadUrl(jobId);
  };

  if (failed) {
    return (
      <div style={styles.wrap}>
        <div style={styles.iconRow}>
          <span style={styles.iconFail}>✕</span>
        </div>
        <h2 style={styles.title}>Extraction Failed</h2>
        <p style={styles.error}>{jobStatus?.error || 'An unknown error occurred.'}</p>
        <button style={styles.btn} onClick={onReset}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.iconRow}>
        <span style={styles.iconOk}>✓</span>
      </div>
      <h2 style={styles.title}>Export Complete</h2>

      <div style={styles.statsGrid}>
        <StatCard label="Messages" value={result.messageCount ?? '—'} />
        <StatCard label="Media Downloaded" value={result.mediaDownloaded ?? '—'} />
        {result.mediaFailed > 0 && (
          <StatCard label="Media Skipped" value={result.mediaFailed} warn />
        )}
      </div>

      <div style={styles.filesInfo}>
        <p style={styles.filesTitle}>Files written to:</p>
        <code style={styles.dirPath}>{result.dirName || 'exports/'}</code>
        <p style={styles.filesList}>
          messages.json &nbsp;·&nbsp; messages.csv &nbsp;·&nbsp; summary.txt
          {result.mediaDownloaded > 0 && ' · media/'}
        </p>
      </div>

      <div style={styles.btnRow}>
        <button style={styles.btn} onClick={handleDownload}>
          ⬇ Download ZIP
        </button>
        <button style={styles.btnSecondary} onClick={onReset}>
          ↩ New Export
        </button>
      </div>

      <p style={styles.hint}>
        The ZIP contains all exported files. You can also find them in the{' '}
        <code style={styles.inlineCode}>exports/</code> folder inside the project directory.
      </p>
    </div>
  );
}

function StatCard({ label, value, warn }) {
  return (
    <div style={styles.statCard}>
      <span style={{ ...styles.statValue, color: warn ? '#f0a500' : '#25d366' }}>{value}</span>
      <span style={styles.statLabel}>{label}</span>
    </div>
  );
}

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center' },
  iconRow: { marginTop: 16 },
  iconOk: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 64, height: 64, borderRadius: '50%',
    background: '#1a3c2a', border: '2px solid #25d366',
    fontSize: 28, color: '#25d366',
  },
  iconFail: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 64, height: 64, borderRadius: '50%',
    background: '#3c1a1a', border: '2px solid #e53e3e',
    fontSize: 28, color: '#e53e3e',
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700 },
  error: { color: '#e53e3e', fontSize: 14, maxWidth: 400 },
  statsGrid: { display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  statCard: {
    background: '#161b22', borderRadius: 10, padding: '16px 24px',
    border: '1px solid #30363d', display: 'flex', flexDirection: 'column', gap: 4,
    minWidth: 100,
  },
  statValue: { fontSize: 28, fontWeight: 800 },
  statLabel: { fontSize: 12, color: '#8b949e' },
  filesInfo: {
    background: '#161b22', borderRadius: 8, padding: '16px 20px',
    border: '1px solid #30363d', width: '100%', textAlign: 'left',
  },
  filesTitle: { margin: '0 0 6px', fontSize: 13, color: '#8b949e' },
  dirPath: {
    display: 'block', fontSize: 13, color: '#79c0ff',
    background: '#0d1117', padding: '6px 10px', borderRadius: 4,
    marginBottom: 8, wordBreak: 'break-all',
  },
  filesList: { margin: 0, fontSize: 12, color: '#8b949e' },
  btnRow: { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  btn: {
    padding: '12px 24px', fontSize: 15, fontWeight: 600,
    background: '#25d366', color: '#0d1117', border: 'none',
    borderRadius: 8, cursor: 'pointer',
  },
  btnSecondary: {
    padding: '12px 24px', fontSize: 15, fontWeight: 600,
    background: '#21262d', color: '#e6edf3',
    border: '1px solid #30363d', borderRadius: 8, cursor: 'pointer',
  },
  hint: { fontSize: 12, color: '#8b949e', maxWidth: 420, lineHeight: 1.6 },
  inlineCode: { fontFamily: 'monospace', color: '#79c0ff' },
};
