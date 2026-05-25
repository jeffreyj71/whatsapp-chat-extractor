import React from 'react';

export default function ExportOptions({ includeMedia, onChangeMedia, onStart, dateRange }) {
  const { startDate, startTime, endDate, endTime } = dateRange;

  const canStart = startDate && endDate && (() => {
    const start = new Date(`${startDate}T${startTime || '00:00'}`);
    const end = new Date(`${endDate}T${endTime || '23:59'}`);
    return start < end;
  })();

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Export Options</h3>

      <label style={styles.toggle}>
        <input
          type="checkbox"
          checked={includeMedia}
          onChange={(e) => onChangeMedia(e.target.checked)}
          style={styles.checkbox}
        />
        <div>
          <span style={styles.toggleLabel}>Include Media Downloads</span>
          <p style={styles.toggleDesc}>
            Download images, videos, audio, and documents. Expired media will be skipped.
          </p>
        </div>
      </label>

      <div style={styles.outputInfo}>
        <span style={styles.outputLabel}>Output files:</span>
        <span style={styles.tag}>messages.json</span>
        <span style={styles.tag}>messages.csv</span>
        <span style={styles.tag}>summary.txt</span>
        {includeMedia && <span style={styles.tag}>media/</span>}
      </div>

      <button
        style={{ ...styles.btn, ...(canStart ? {} : styles.btnDisabled) }}
        disabled={!canStart}
        onClick={onStart}
      >
        ▶ Start Extraction
      </button>

      {!canStart && (
        <p style={styles.hint}>Please fill in both start and end dates before proceeding.</p>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: '#161b22', borderRadius: 10, padding: '20px 24px',
    border: '1px solid #30363d', display: 'flex', flexDirection: 'column', gap: 16,
  },
  title: { margin: 0, fontSize: 16, fontWeight: 600 },
  toggle: {
    display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
    padding: '12px 14px', background: '#0d1117', borderRadius: 8,
    border: '1px solid #30363d',
  },
  checkbox: { marginTop: 3, accentColor: '#25d366', width: 16, height: 16, flexShrink: 0 },
  toggleLabel: { fontWeight: 500, fontSize: 14 },
  toggleDesc: { color: '#8b949e', fontSize: 12, margin: '4px 0 0' },
  outputInfo: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  outputLabel: { fontSize: 12, color: '#8b949e' },
  tag: {
    fontSize: 12, background: '#21262d', border: '1px solid #30363d',
    borderRadius: 4, padding: '2px 8px', color: '#79c0ff',
    fontFamily: 'monospace',
  },
  btn: {
    padding: '12px 24px', fontSize: 15, fontWeight: 600,
    background: '#25d366', color: '#0d1117', border: 'none',
    borderRadius: 8, cursor: 'pointer', alignSelf: 'flex-start',
  },
  btnDisabled: {
    background: '#21262d', color: '#8b949e', cursor: 'not-allowed',
  },
  hint: { color: '#8b949e', fontSize: 12, margin: 0 },
};
