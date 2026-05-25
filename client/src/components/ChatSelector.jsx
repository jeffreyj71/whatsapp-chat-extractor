import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client.js';

export default function ChatSelector({ onSelect }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getChats()
      .then((data) => { setChats(data.chats || []); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) => c.name?.toLowerCase().includes(q));
  }, [chats, search]);

  if (loading) return <CenteredMessage text="Loading chats…" spinner />;
  if (error) return <CenteredMessage text={`Error: ${error}`} />;

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>Select a Chat</h2>
      <input
        style={styles.search}
        type="text"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />
      <div style={styles.list}>
        {filtered.length === 0 && (
          <p style={styles.empty}>No chats found</p>
        )}
        {filtered.map((chat) => (
          <button key={chat.id} style={styles.chatItem} onClick={() => onSelect(chat)}>
            <span style={styles.chatIcon}>{chat.isGroup ? '👥' : '👤'}</span>
            <div style={styles.chatInfo}>
              <span style={styles.chatName}>{chat.name}</span>
              {chat.lastMessageTimestamp && (
                <span style={styles.chatDate}>
                  {formatDate(chat.lastMessageTimestamp)}
                </span>
              )}
            </div>
            <span style={styles.chevron}>›</span>
          </button>
        ))}
      </div>
      <p style={styles.count}>{filtered.length} of {chats.length} chats</p>
    </div>
  );
}

function CenteredMessage({ text, spinner }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#8b949e' }}>
      {spinner && <div style={spinnerStyle} />}
      <p>{text}</p>
    </div>
  );
}

function formatDate(ts) {
  const d = new Date(ts * 1000);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const spinnerStyle = {
  width: 32, height: 32, margin: '0 auto 12px',
  border: '3px solid #30363d', borderTop: '3px solid #25d366',
  borderRadius: '50%', animation: 'spin 0.8s linear infinite',
};

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 12 },
  title: { margin: 0, fontSize: 20, fontWeight: 700 },
  search: {
    width: '100%', padding: '10px 14px', fontSize: 14,
    background: '#161b22', border: '1px solid #30363d', borderRadius: 8,
    color: '#e6edf3', outline: 'none',
  },
  list: {
    display: 'flex', flexDirection: 'column', gap: 4,
    maxHeight: 500, overflowY: 'auto',
    border: '1px solid #30363d', borderRadius: 8,
  },
  chatItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', background: 'none', border: 'none',
    borderBottom: '1px solid #21262d', cursor: 'pointer',
    textAlign: 'left', color: '#e6edf3', transition: 'background 0.15s',
  },
  chatIcon: { fontSize: 20, flexShrink: 0 },
  chatInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  chatName: { fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chatDate: { fontSize: 12, color: '#8b949e' },
  chevron: { color: '#8b949e', fontSize: 20, flexShrink: 0 },
  empty: { padding: '20px', color: '#8b949e', textAlign: 'center' },
  count: { fontSize: 12, color: '#8b949e', textAlign: 'right', margin: 0 },
};
