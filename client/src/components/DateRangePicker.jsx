import React from 'react';

export default function DateRangePicker({ value, onChange }) {
  const { startDate, startTime, endDate, endTime } = value;

  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

  const today = new Date().toISOString().split('T')[0];

  const error = (() => {
    if (!startDate || !endDate) return null;
    const start = new Date(`${startDate}T${startTime || '00:00'}`);
    const end = new Date(`${endDate}T${endTime || '23:59'}`);
    if (start >= end) return 'Start date/time must be before end date/time';
    return null;
  })();

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Select Date Range</h3>

      <div style={styles.row}>
        <Field label="Start Date" required>
          <input
            style={styles.input}
            type="date" max={today}
            value={startDate} onChange={set('startDate')}
          />
        </Field>
        <Field label="Start Time (optional)">
          <input
            style={styles.input}
            type="time"
            value={startTime} onChange={set('startTime')}
          />
        </Field>
      </div>

      <div style={styles.row}>
        <Field label="End Date" required>
          <input
            style={styles.input}
            type="date" max={today}
            value={endDate} onChange={set('endDate')}
          />
        </Field>
        <Field label="End Time (optional)">
          <input
            style={styles.input}
            type="time"
            value={endTime} onChange={set('endTime')}
          />
        </Field>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      <p style={styles.hint}>Times are in your local timezone. Leave blank for full day.</p>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={fieldStyles.label}>
        {label} {required && <span style={{ color: '#e53e3e' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const fieldStyles = {
  label: { display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 4, fontWeight: 500 },
};

const styles = {
  card: {
    background: '#161b22', borderRadius: 10, padding: '20px 24px',
    border: '1px solid #30363d', display: 'flex', flexDirection: 'column', gap: 16,
  },
  title: { margin: 0, fontSize: 16, fontWeight: 600 },
  row: { display: 'flex', gap: 16 },
  input: {
    width: '100%', padding: '8px 12px', fontSize: 14,
    background: '#0d1117', border: '1px solid #30363d',
    borderRadius: 6, color: '#e6edf3', outline: 'none',
    colorScheme: 'dark',
  },
  error: { color: '#e53e3e', fontSize: 13, margin: 0 },
  hint: { color: '#8b949e', fontSize: 12, margin: 0 },
};
