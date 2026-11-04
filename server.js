const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory telemetry buffer (up to 100 events)
let telemetryLogs = [
  { id: 1, time: '14:22:05', studio: 'Anime Legends X', player: 'User_998124', type: 'REMOTE_SPAM', action: 'Auto-Blocked & Flagged', status: 'Blocked', color: 'text-amber-400' },
  { id: 2, time: '14:21:50', studio: 'Blox Fruits V2', player: 'Robloxian_4401', type: 'SPEED_HACK', action: 'Position Rollback & Kick', status: 'Mitigated', color: 'text-sky-400' },
  { id: 3, time: '14:21:12', studio: 'Pet Simulator World', player: 'ExploitKing99', type: 'DUPE_ATTEMPT', action: 'Permanent Server Ban', status: 'Banned', color: 'text-rose-400' }
];

let metrics = {
  activeStudios: 14,
  blocked24h: 1428,
  ccuMonitored: 42500,
  mrr: 18500
};

// API: Get Telemetry Logs
app.get('/api/logs', (req, res) => {
  res.json({ logs: telemetryLogs, metrics });
});

// API: Receive Telemetry from Roblox Game Server
app.post('/api/telemetry', (req, res) => {
  const { apiKey, studio, player, type, action, status } = req.body;

  // Basic API Key validation (mock)
  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized: Missing API Key' });
  }

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];

  const newEvent = {
    id: Date.now(),
    time: timeStr,
    studio: studio || 'Verified Studio',
    player: player || 'UnknownUser',
    type: type || 'REMOTE_SPAM',
    action: action || 'Blocked',
    status: status || 'Blocked',
    color: type === 'DUPE_ATTEMPT' ? 'text-rose-400' : 'text-amber-400'
  };

  telemetryLogs.unshift(newEvent);
  if (telemetryLogs.length > 100) telemetryLogs.pop();
  metrics.blocked24h += 1;

  console.log(`[SECURITY ALERT] [${studio}] Player ${player} triggered ${type} (${action})`);

  res.json({ success: true, event: newEvent });
});

// API: Test Discord Webhook
app.post('/api/webhook/test', (req, res) => {
  const { webhookUrl } = req.body;
  // In production, use axios/fetch to post to Discord webhook URL
  console.log(`[DISCORD WEBHOOK TEST] Sending alert to: ${webhookUrl || 'Default Channel'}`);
  res.json({ success: true, message: 'Test Discord webhook alert sent successfully!' });
});

app.listen(PORT, () => {
  console.log(`🛡️ SentinelRBX Security Hub backend running at http://localhost:${PORT}`);
});
