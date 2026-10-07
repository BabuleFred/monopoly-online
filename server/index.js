// index.js — HTTP (статика public/) + WebSocket сервер лобби.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { handleMessage, lobbyState } = require('./messages');
const { loadRooms, createPersistence } = require('./persistence');
const { getAccessUrls, classifyAddress } = require('./network');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const DATA_FILE = process.env.GAME_STATE_FILE || path.resolve(__dirname, '..', 'data', 'game-state.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.resolve(PUBLIC_DIR, '.' + urlPath);

  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== PUBLIC_DIR) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });
const ctx = { store: loadRooms(DATA_FILE), playerIdByWs: new Map() };
const persistence = createPersistence(DATA_FILE, ctx.store);

wss.on('connection', (ws) => {
  const wsKey = ws._socket.remoteAddress + ':' + ws._socket.remotePort + ':' + Date.now();
  ws._monopolyKey = wsKey;

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      ws.send(JSON.stringify({ type: 'error', payload: { message: 'Неверный JSON' } }));
      return;
    }

    const res = handleMessage(msg, wsKey, ctx);
    ws.send(JSON.stringify({ type: res.type, payload: res.payload }));
    if (res.type !== 'error') persistence.saveImmediately();

    if (res.broadcast) {
      const roomCode = ctx.playerIdByWs.get(wsKey)?.code || msg.payload?.code;
      broadcastToRoom(roomCode, res.broadcast);
    }
  });

  ws.on('close', () => {
    const binding = ctx.playerIdByWs.get(wsKey);
    if (binding) {
      const room = ctx.store.get(binding.code);
      if (room) {
        const p = room.players.find(pl => pl.id === binding.playerId);
        if (p) p.online = false;
        persistence.saveImmediately();
        const update = room.state === 'playing'
          ? { type: 'gameState', payload: { room } }
          : lobbyState(ctx.store, binding.code);
        broadcastToRoom(binding.code, update);
      }
    }
    ctx.playerIdByWs.delete(wsKey);
  });
});

function broadcastToRoom(code, msg) {
  if (!code) return;
  for (const [key, binding] of ctx.playerIdByWs) {
    if (binding.code !== code) continue;
    for (const client of wss.clients) {
      if (client._monopolyKey === key && client.readyState === 1) {
        client.send(JSON.stringify(msg));
      }
    }
  }
}

function shutdown(signal) {
  console.log(`Получен ${signal}, сохраняю игру...`);
  persistence.saveImmediately();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

server.listen(PORT, HOST, () => {
  console.log('Монополия запущена. Откройте один из адресов:');
  getAccessUrls(PORT).forEach(url => console.log(`  ${url}  — ${classifyAddress(url)}`));
  console.log('Для телефона обычно нужен адрес с пометкой "локальная сеть/WiFi".');
  console.log('Если телефон не открывает адрес — проверьте, что телефон и ПК в одной WiFi-сети, и разрешите Node.js в Windows Firewall.');
});
