const BASE = '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getStatus: () => apiFetch('/status'),
  getChats: () => apiFetch('/chats'),
  startExtraction: (payload) =>
    apiFetch('/extract', { method: 'POST', body: JSON.stringify(payload) }),
  getJobStatus: (jobId) => apiFetch(`/extract/${jobId}/status`),
  getDownloadUrl: (jobId) => `/api/export/${jobId}/download`,
};

/**
 * Open a WebSocket connection to the backend and call handlers on events.
 * Returns a close() function.
 */
export function connectWebSocket(handlers) {
  const wsUrl = `ws://${window.location.hostname}:3001`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const { event: name, data } = JSON.parse(event.data);
      handlers[name]?.(data);
    } catch {}
  };

  ws.onclose = () => handlers.close?.();
  ws.onerror = () => handlers.error?.();

  return { close: () => ws.close() };
}
