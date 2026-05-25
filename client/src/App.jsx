import React, { useState, useEffect, useCallback } from 'react';
import { api, connectWebSocket } from './api/client.js';
import QRLogin from './components/QRLogin.jsx';
import ChatSelector from './components/ChatSelector.jsx';
import DateRangePicker from './components/DateRangePicker.jsx';
import ExportOptions from './components/ExportOptions.jsx';
import ProgressPanel from './components/ProgressPanel.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';

const STEPS = ['login', 'select_chat', 'configure', 'extracting', 'done'];

export default function App() {
  const [step, setStep] = useState('login');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectedInfo, setConnectedInfo] = useState(null);
  const [qrData, setQrData] = useState(null);

  const [selectedChat, setSelectedChat] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', startTime: '', endDate: '', endTime: '' });
  const [includeMedia, setIncludeMedia] = useState(false);

  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = connectWebSocket({
      status: (data) => {
        setConnectionStatus(data.status);
        setConnectedInfo(data.info || null);
        if (data.status === 'connected') {
          setStep((prev) => (prev === 'login' ? 'select_chat' : prev));
          setQrData(null);
        }
        if (data.status === 'disconnected' || data.status === 'auth_failure') {
          setStep('login');
        }
      },
      qr: (data) => {
        setQrData(data.qr);
        setConnectionStatus('qr_ready');
        setStep('login');
      },
      progress: (data) => {
        if (data.jobId === jobId || !jobId) {
          setJobStatus(data);
          if (data.status === 'done') setStep('done');
          if (data.status === 'failed') setStep('done');
        }
      },
    });

    // Also poll status once on load (in case WS arrives late)
    api.getStatus().then((s) => {
      setConnectionStatus(s.status);
      setConnectedInfo(s.info || null);
      if (s.status === 'connected') setStep('select_chat');
    }).catch(() => {});

    return () => ws.close();
  }, [jobId]);

  const handleChatSelected = useCallback((chat) => {
    setSelectedChat(chat);
    setStep('configure');
  }, []);

  const handleStartExtraction = useCallback(async () => {
    try {
      const { jobId: id } = await api.startExtraction({
        chatId: selectedChat.id,
        chatName: selectedChat.name,
        ...dateRange,
        includeMedia,
      });
      setJobId(id);
      setJobStatus({ status: 'queued', progress: { step: 'queued', percent: 0 } });
      setStep('extracting');
    } catch (err) {
      alert(`Failed to start extraction: ${err.message}`);
    }
  }, [selectedChat, dateRange, includeMedia]);

  const handleReset = useCallback(() => {
    setSelectedChat(null);
    setDateRange({ startDate: '', startTime: '', endDate: '', endTime: '' });
    setIncludeMedia(false);
    setJobId(null);
    setJobStatus(null);
    setStep(connectionStatus === 'connected' ? 'select_chat' : 'login');
  }, [connectionStatus]);

  return (
    <div style={styles.root}>
      <Header connectionStatus={connectionStatus} connectedInfo={connectedInfo} />

      <main style={styles.main}>
        {step === 'login' && (
          <QRLogin qrData={qrData} connectionStatus={connectionStatus} />
        )}

        {step === 'select_chat' && (
          <ChatSelector onSelect={handleChatSelected} />
        )}

        {step === 'configure' && selectedChat && (
          <div style={styles.configureWrap}>
            <SelectedChatBadge chat={selectedChat} onBack={() => setStep('select_chat')} />
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <ExportOptions
              includeMedia={includeMedia}
              onChangeMedia={setIncludeMedia}
              onStart={handleStartExtraction}
              dateRange={dateRange}
            />
          </div>
        )}

        {step === 'extracting' && (
          <ProgressPanel jobStatus={jobStatus} />
        )}

        {step === 'done' && (
          <ResultsPanel jobStatus={jobStatus} jobId={jobId} onReset={handleReset} />
        )}
      </main>

      <Footer />
    </div>
  );
}

function Header({ connectionStatus, connectedInfo }) {
  const dot = {
    connected: '#25d366',
    qr_ready: '#f0a500',
    connecting: '#f0a500',
    disconnected: '#e53e3e',
    auth_failure: '#e53e3e',
  }[connectionStatus] || '#888';

  return (
    <header style={styles.header}>
      <div style={styles.headerLeft}>
        <span style={styles.logo}>📱 WhatsApp Extractor</span>
      </div>
      <div style={styles.headerRight}>
        <span style={{ ...styles.dot, background: dot }} />
        <span style={styles.statusText}>
          {connectionStatus === 'connected' && connectedInfo
            ? `${connectedInfo.name} (+${connectedInfo.phoneNumber})`
            : connectionStatus.replace('_', ' ')}
        </span>
      </div>
    </header>
  );
}

function SelectedChatBadge({ chat, onBack }) {
  return (
    <div style={styles.badge}>
      <button style={styles.backBtn} onClick={onBack}>← Back</button>
      <span style={styles.badgeText}>
        {chat.isGroup ? '👥' : '👤'} {chat.name}
      </span>
    </div>
  );
}

function Footer() {
  return (
    <footer style={styles.footer}>
      ⚠️ Only export chats you are authorized to access. All data stays on your local machine.
    </footer>
  );
}

const styles = {
  root: { display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 24px', background: '#161b22',
    borderBottom: '1px solid #30363d',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  logo: { fontSize: 18, fontWeight: 700, color: '#25d366' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: '50%', display: 'inline-block' },
  statusText: { fontSize: 13, color: '#8b949e' },
  main: { flex: 1, maxWidth: 760, width: '100%', margin: '0 auto', padding: '32px 16px' },
  configureWrap: { display: 'flex', flexDirection: 'column', gap: 20 },
  badge: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#161b22', borderRadius: 8, padding: '10px 16px',
    border: '1px solid #30363d',
  },
  badgeText: { fontWeight: 600, fontSize: 15 },
  backBtn: {
    background: 'none', border: '1px solid #30363d', color: '#8b949e',
    borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 13,
  },
  footer: {
    textAlign: 'center', padding: '12px 16px', fontSize: 12,
    color: '#8b949e', borderTop: '1px solid #30363d', background: '#161b22',
  },
};
