import React from 'react';

const STATUS_MESSAGES = {
  disconnected: 'Initializing WhatsApp client…',
  qr_ready: 'Scan the QR code with your phone',
  connecting: 'Connecting…',
  connected: 'Connected!',
  auth_failure: 'Authentication failed. Please restart the server.',
};

export default function QRLogin({ qrData, connectionStatus }) {
  const message = STATUS_MESSAGES[connectionStatus] || connectionStatus;

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h2 style={styles.title}>Link Your WhatsApp Account</h2>
        <p style={styles.subtitle}>
          Open WhatsApp on your phone → <strong>Linked Devices</strong> → <strong>Link a Device</strong>
        </p>

        <div style={styles.qrBox}>
          {qrData ? (
            <img src={qrData} alt="WhatsApp QR code" style={styles.qrImg} />
          ) : (
            <div style={styles.placeholder}>
              {connectionStatus === 'connecting' ? (
                <Spinner />
              ) : connectionStatus === 'auth_failure' ? (
                <span style={{ fontSize: 48 }}>❌</span>
              ) : (
                <Spinner />
              )}
            </div>
          )}
        </div>

        <p style={styles.statusText}>{message}</p>

        <div style={styles.notice}>
          <strong>Privacy notice:</strong> Your session is stored locally only. No data leaves your machine.
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={spinnerStyle} />
  );
}

const spinnerKeyframes = `
@keyframes spin { to { transform: rotate(360deg); } }
`;
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinnerKeyframes;
  document.head.appendChild(style);
}

const spinnerStyle = {
  width: 48, height: 48,
  border: '4px solid #30363d',
  borderTop: '4px solid #25d366',
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

const styles = {
  wrap: { display: 'flex', justifyContent: 'center', paddingTop: 40 },
  card: {
    background: '#161b22', borderRadius: 12, padding: '32px 40px',
    border: '1px solid #30363d', maxWidth: 400, width: '100%', textAlign: 'center',
  },
  title: { margin: '0 0 8px', fontSize: 22, fontWeight: 700 },
  subtitle: { margin: '0 0 24px', color: '#8b949e', fontSize: 14, lineHeight: 1.6 },
  qrBox: {
    width: 220, height: 220, margin: '0 auto 20px',
    background: '#fff', borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  qrImg: { width: '100%', height: '100%', display: 'block' },
  placeholder: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
  statusText: { color: '#8b949e', fontSize: 14, margin: '0 0 16px' },
  notice: {
    background: '#0d1117', borderRadius: 6, padding: '10px 14px',
    fontSize: 12, color: '#8b949e', border: '1px solid #30363d', textAlign: 'left',
  },
};
