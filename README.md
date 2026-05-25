# WhatsApp Chat Extractor

A local-first tool to export your own WhatsApp messages to JSON/CSV with optional media download.

---

## Privacy Warning

> **This tool is for your own personal WhatsApp account only.**
> Only export chats you are authorized to access.
> All data stays on your local machine — nothing is uploaded anywhere.
> You must comply with WhatsApp's Terms of Service and applicable privacy laws.

---

## Features

- QR code login (persisted session — scan once)
- Browse and search all your chats
- Filter by date and time range
- Export messages to JSON and CSV
- Download media attachments (images, videos, audio, documents)
- Real-time progress via WebSocket
- Clean React UI

---

## Requirements

- Node.js 18 or higher
- npm 9 or higher
- Google Chrome or Chromium (used by Puppeteer internally)
- A WhatsApp account (personal)

---

## Setup

### 1. Clone / download the project

```bash
cd whatsapp-extractor
```

### 2. Copy environment config

```bash
cp .env.example .env
```

Edit `.env` if you want to change ports or paths.

### 3. Install server dependencies

```bash
npm install
```

### 4. Install client dependencies

```bash
cd client && npm install && cd ..
```

---

## Running

### Start both server and client (recommended)

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1 — backend
npm run server

# Terminal 2 — frontend
npm run client
```

Then open **http://localhost:5173** in your browser.

---

## Usage

1. Open the app in your browser.
2. Scan the QR code with your phone (WhatsApp > Linked Devices > Link a Device).
3. Once connected, your chats will load automatically.
4. Search and select a chat.
5. Pick a start and end date (and optional time).
6. Choose whether to include media downloads.
7. Click **Start Extraction**.
8. Watch the progress panel.
9. When complete, click **Download ZIP** or **Open Folder** to access your export.

---

## Export Structure

```
exports/
  <ChatName>_2024-01-01_2024-03-31/
    messages.json      ← full structured data
    messages.csv       ← Excel-friendly
    summary.txt        ← stats overview
    media/
      image_001.jpg
      video_001.mp4
      document_001.pdf
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/status | Connection status + phone info |
| GET | /api/qr | Current QR code (base64 PNG) |
| GET | /api/chats | List all chats |
| POST | /api/extract | Start an extraction job |
| GET | /api/extract/:jobId/status | Job progress |
| GET | /api/export/:jobId/download | Download export ZIP |

WebSocket: `ws://localhost:3001` — streams `qr`, `status`, and `progress` events.

---

## Limitations

- WhatsApp Web may not load very old messages (older than ~90 days) depending on your device.
- Expired media (images/videos older than ~30 days) cannot be downloaded — they will be marked as `unavailable`.
- Extraction speed depends on chat size; large chats may take several minutes.
- WhatsApp may rate-limit fast scrolling; the extractor paces itself to avoid this.
- Group chats show sender names when available.

---

## Test Checklist

- [ ] QR code appears on first launch
- [ ] QR scan connects phone and shows account name
- [ ] Chat list loads after connection
- [ ] Search filters chats by name
- [ ] Date range validation (start must be before end)
- [ ] Extraction runs and shows progress
- [ ] `messages.json` is valid JSON
- [ ] `messages.csv` opens correctly in Excel
- [ ] `summary.txt` shows correct counts
- [ ] Media files are saved in `media/` folder
- [ ] Expired/unavailable media is marked, not crash
- [ ] Session persists across server restarts (no re-scan needed)
- [ ] Disconnecting and reconnecting works

---

## Troubleshooting

**QR not showing:** Restart the server. Puppeteer may still be initializing.

**"WhatsApp not connected":** Scan the QR code first. If session is corrupt, delete the `.wwebjs_auth` folder and restart.

**Media not downloading:** The media may be expired on WhatsApp's servers. This is a WhatsApp limitation.

**Puppeteer errors on Windows:** Make sure you have a compatible Chrome/Chromium version. Run `npx puppeteer browsers install chrome` if needed.
