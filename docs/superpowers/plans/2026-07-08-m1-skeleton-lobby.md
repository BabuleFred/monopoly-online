# Веха 1: Скелет проекта + сервер + лобби — План реализации

> **Для агентов:** REQUIRED SUB-SKILL: используйте superpowers:subagent-driven-development или superpowers:executing-plans для пошаговой реализации. Шаги используют чекбоксы (`- [ ]`).

**Цель:** Получить работающий Node.js сервер (HTTP + WebSocket) с лобби: хост создаёт комнату с уникальным кодом, игроки входят по коду + имя, хост видит список и может начать игру (пока — заглушка, перевод в состояние playing).

**Архитектура:** Node.js HTTP-сервер отдаёт статику из `public/`. WebSocket-сервер (`ws`) на том же порту обрабатывает сообщения лобби. Состояние комнат — в памяти (`rooms.js`). Никакой игровой логики пока нет — только лобби.

**Технологии:** Node.js, `ws`, встроенный `node:test` для тестов.

---

## Структура файлов Вехи 1

```
D:\Monopoly\
├── package.json
├── .gitignore
├── server\
│   ├── index.js          — HTTP + WS сервер, точка входа
│   ├── rooms.js           — создание/вход в комнаты, логика лобби
│   └── messages.js        — маршрутизация WS-сообщений (только лобби)
├── test\
│   └── rooms.test.js      — тесты логики комнат
└── public\
    ├── index.html         — экран входа (создать/войти) + лобби
    ├── style.css          — стили экранов входа и лобби
    ├── net.js             — WS-клиент (отправка/приём, localStorage)
    └── ui.js              — переключение экранов, список игроков
```

---

## Task 1: Инициализация проекта и git

**Files:**
- Create: `D:\Monopoly\package.json`
- Create: `D:\Monopoly\.gitignore`

- [ ] **Step 1: Инициализировать git-репозиторий**

```bash
cd D:/Monopoly
git init
git config user.name "Monopoly Dev" || true
git config user.email "dev@monopoly.local" || true
```

- [ ] **Step 2: Создать `.gitignore`**

```gitignore
node_modules/
data/game-state.json
*.log
```

- [ ] **Step 3: Создать `package.json`**

```json
{
  "name": "monopoly-ru",
  "version": "0.1.0",
  "description": "Русская Монополия — мультиплеер в браузере",
  "type": "commonjs",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "test": "node --test test/"
  },
  "dependencies": {
    "ws": "^8.18.0"
  }
}
```

- [ ] **Step 4: Установить зависимости**

```bash
cd D:/Monopoly
npm install
```
Expected: создаётся `node_modules/`, установлен `ws`.

- [ ] **Step 5: Коммит**

```bash
cd D:/Monopoly
git add .gitignore package.json package-lock.json
git commit -m "init: проект, зависимости (ws)"
```

---

## Task 2: Логика комнат (rooms.js) — модель и создание/вход

`rooms.js` — чистая логика без WebSocket, чтобы её можно было тестировать напрямую. Экспортирует функции, работающие с объектом-хранилищем `rooms` (Map код → комната).

**Files:**
- Create: `D:\Monopoly\server\rooms.js`
- Test: `D:\Monopoly\test\rooms.test.js`

- [ ] **Step 1: Написать failing-тест на создание комнаты**

`test/rooms.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
const { createRoom, joinRoom, listPlayers, startGame } = require('../server/rooms');

test('createRoom создаёт комнату с кодом и хостом', () => {
  const store = new Map();
  const { code, playerId } = createRoom(store, { name: 'Ваня', token: 'hat' });
  assert.ok(code, 'код должен быть');
  assert.equal(code.length, 6, 'код длиной 6 символов');
  const players = listPlayers(store, code);
  assert.equal(players.length, 1);
  assert.equal(players[0].name, 'Ваня');
  assert.equal(players[0].isHost, true);
  assert.equal(playerId, players[0].id);
});
```

- [ ] **Step 2: Запустить тест — должен упасть**

```bash
cd D:/Monopoly
npm test
```
Expected: FAIL — `Cannot find module '../server/rooms'`.

- [ ] **Step 3: Реализовать rooms.js (минимум для createRoom + listPlayers)**

`server/rooms.js`:
```js
// rooms.js — логика лобби: создание/вход/старт. Без WebSocket.
const { randomCode, makePlayerId } = require('./util');

const TOKENS = ['hat','car','dog','ship','boot','thimble','cat','wheelbarrow'];

function createRoom(store, { name, token }) {
  if (!name) throw new Error('Имя обязательно');
  if (!TOKENS.includes(token)) throw new Error('Недопустимая фишка');
  let code;
  do { code = randomCode(6); } while (store.has(code));
  const playerId = makePlayerId();
  const room = {
    code,
    state: 'lobby',
    players: [{
      id: playerId,
      name,
      token,
      isHost: true,
      online: true,
      color: '#e74c3c'
    }],
    board: null,
    currentPlayerId: null,
    turnPhase: null,
    log: []
  };
  store.set(code, room);
  return { code, playerId };
}

function listPlayers(store, code) {
  const room = store.get(code);
  return room ? room.players.map(p => ({ ...p })) : [];
}

module.exports = { createRoom, listPlayers, TOKENS };
```

`server/util.js`:
```js
const crypto = require('crypto');

function randomCode(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function makePlayerId() {
  return 'p' + crypto.randomBytes(3).toString('hex');
}

module.exports = { randomCode, makePlayerId };
```

- [ ] **Step 4: Запустить тест — должен пройти**

```bash
cd D:/Monopoly
npm test
```
Expected: PASS.

- [ ] **Step 5: Коммит**

```bash
cd D:/Monopoly
git add server/rooms.js server/util.js test/rooms.test.js
git commit -m "feat: createRoom — создание комнаты с кодом и хостом"
```

---

## Task 3: joinRoom и startGame — логика лобби

**Files:**
- Modify: `D:\Monopoly\server\rooms.js`
- Test: `D:\Monopoly\test\rooms.test.js`

- [ ] **Step 1: Дописать failing-тесты на joinRoom и startGame**

Добавить в `test/rooms.test.js`:
```js
test('joinRoom добавляет игрока в комнату', () => {
  const store = new Map();
  const { code } = createRoom(store, { name: 'Ваня', token: 'hat' });
  const { playerId } = joinRoom(store, code, { name: 'Маша', token: 'car' });
  const players = listPlayers(store, code);
  assert.equal(players.length, 2);
  assert.equal(players[1].name, 'Маша');
  assert.equal(players[1].isHost, false);
  assert.equal(playerId, players[1].id);
});

test('joinRoom бросает ошибку при неверном коде', () => {
  const store = new Map();
  assert.throws(() => joinRoom(store, 'NOPE01', { name: 'Маша', token: 'car' }), /комнат.*не найден/);
});

test('joinRoom бросает ошибку при дубликате имени', () => {
  const store = new Map();
  const { code } = createRoom(store, { name: 'Ваня', token: 'hat' });
  assert.throws(() => joinRoom(store, code, { name: 'Ваня', token: 'car' }), /имя.*занят/);
});

test('joinRoom бросает ошибку при занятой фишке', () => {
  const store = new Map();
  const { code } = createRoom(store, { name: 'Ваня', token: 'hat' });
  assert.throws(() => joinRoom(store, code, { name: 'Маша', token: 'hat' }), /фишк.*занят/);
});

test('joinRoom не пускает больше 6 игроков', () => {
  const store = new Map();
  const { code } = createRoom(store, { name: 'P1', token: 'hat' });
  joinRoom(store, code, { name: 'P2', token: 'car' });
  joinRoom(store, code, { name: 'P3', token: 'dog' });
  joinRoom(store, code, { name: 'P4', token: 'ship' });
  joinRoom(store, code, { name: 'P5', token: 'boot' });
  joinRoom(store, code, { name: 'P6', token: 'thimble' });
  assert.throws(() => joinRoom(store, code, { name: 'P7', token: 'cat' }), /максимум.*6.*игрок/);
});

test('joinRoom не пускает в уже начавшуюся игру', () => {
  const store = new Map();
  const { code } = createRoom(store, { name: 'Ваня', token: 'hat' });
  startGame(store, code);
  assert.throws(() => joinRoom(store, code, { name: 'Маша', token: 'car' }), /игр.*уже.*начал/);
});

test('startGame меняет state на playing, только хост может', () => {
  const store = new Map();
  const { code, playerId } = createRoom(store, { name: 'Ваня', token: 'hat' });
  startGame(store, code, playerId);
  const room = store.get(code);
  assert.equal(room.state, 'playing');
  assert.ok(room.currentPlayerId, 'должен быть текущий игрок');
});

test('startGame требует минимум 2 игрока', () => {
  const store = new Map();
  const { code, playerId } = createRoom(store, { name: 'Ваня', token: 'hat' });
  assert.throws(() => startGame(store, code, playerId), /минимум.*2.*игрок/);
});

test('startGame не может запустить не хост', () => {
  const store = new Map();
  const { code } = createRoom(store, { name: 'Ваня', token: 'hat' });
  const { playerId: guestId } = joinRoom(store, code, { name: 'Маша', token: 'car' });
  assert.throws(() => startGame(store, code, guestId), /тольк.*хост/);
});
```

- [ ] **Step 2: Запустить тесты — должны упасть**

```bash
cd D:/Monopoly
npm test
```
Expected: FAIL — `joinRoom is not a function`.

- [ ] **Step 3: Реализовать joinRoom и startGame**

Добавить в `server/rooms.js` (перед `module.exports`):
```js
function joinRoom(store, code, { name, token }) {
  const room = store.get(code);
  if (!room) throw new Error('Комната с таким кодом не найдена');
  if (room.state !== 'lobby') throw new Error('Игра уже началась');
  if (room.players.length >= 6) throw new Error('В комнате максимум 6 игроков');
  if (!name) throw new Error('Имя обязательно');
  if (!TOKENS.includes(token)) throw new Error('Недопустимая фишка');
  if (room.players.some(p => p.name.toLowerCase() === name.toLowerCase()))
    throw new Error('Это имя уже занято');
  if (room.players.some(p => p.token === token))
    throw new Error('Эта фишка уже занята');
  const playerId = makePlayerId();
  const colors = ['#e74c3c','#2ecc71','#3498db','#f1c40f','#9b59b6','#e67e22'];
  room.players.push({
    id: playerId,
    name,
    token,
    isHost: false,
    online: true,
    color: colors[room.players.length % colors.length]
  });
  return { playerId };
}

function startGame(store, code, byPlayerId) {
  const room = store.get(code);
  if (!room) throw new Error('Комната не найдена');
  const player = room.players.find(p => p.id === byPlayerId);
  if (!player) throw new Error('Игрок не найден');
  if (!player.isHost) throw new Error('Только хост может начать игру');
  if (room.players.length < 2) throw new Error('Минимум 2 игрока');
  room.state = 'playing';
  // порядок хода — по списку (позже можно перемешать в Вехе 2)
  room.currentPlayerId = room.players[0].id;
}
```

Обновить `module.exports`:
```js
module.exports = { createRoom, joinRoom, startGame, listPlayers, TOKENS };
```

- [ ] **Step 4: Запустить тесты — должны пройти**

```bash
cd D:/Monopoly
npm test
```
Expected: все PASS.

- [ ] **Step 5: Коммит**

```bash
cd D:/Monopoly
git add server/rooms.js test/rooms.test.js
git commit -m "feat: joinRoom + startGame — вход в комнату и запуск игры"
```

---

## Task 4: Маршрутизация WS-сообщений лобби (messages.js)

`messages.js` принимает разобранное сообщение `{type, payload}`, контекст `{store, ws, playerIdByWs}` и возвращает ответ. Чистая логика, тестируемая.

**Files:**
- Create: `D:\Monopoly\server\messages.js`
- Test: `D:\Monopoly\test\messages.test.js`

- [ ] **Step 1: Написать failing-тесты**

`test/messages.test.js`:
```js
const test = require('node:test');
const assert = require('node:assert');
const { handleMessage } = require('../server/messages');

function ctx() {
  const store = new Map();
  const playerIdByWs = new Map();
  const wsKey = 'ws-1';
  return { store, playerIdByWs, wsKey };
}

test('createRoom возвращает code и playerId и привязывает ws', () => {
  const c = ctx();
  const res = handleMessage({ type: 'createRoom', payload: { name: 'Ваня', token: 'hat' } }, c.wsKey, c);
  assert.equal(res.type, 'roomCreated');
  assert.ok(res.payload.code);
  assert.ok(res.payload.playerId);
  assert.equal(c.playerIdByWs.get(c.wsKey), res.payload.playerId);
  assert.equal(res.broadcast.type, 'lobbyUpdate');
});

test('joinRoom возвращает roomJoined и рассылает lobbyUpdate', () => {
  const c = ctx();
  const created = handleMessage({ type: 'createRoom', payload: { name: 'Ваня', token: 'hat' } }, c.wsKey, c);
  const code = created.payload.code;
  const ws2 = 'ws-2';
  const res = handleMessage({ type: 'joinRoom', payload: { code, name: 'Маша', token: 'car' } }, ws2, c);
  assert.equal(res.type, 'roomJoined');
  assert.equal(res.payload.code, code);
  assert.equal(c.playerIdByWs.get(ws2), res.payload.playerId);
  assert.equal(res.broadcast.type, 'lobbyUpdate');
  assert.equal(res.broadcast.payload.players.length, 2);
});

test('joinRoom с неверным кодом возвращает error', () => {
  const c = ctx();
  const res = handleMessage({ type: 'joinRoom', payload: { code: 'NOPE01', name: 'Маша', token: 'car' } }, 'ws-2', c);
  assert.equal(res.type, 'error');
  assert.match(res.payload.message, /не найден/);
});

test('startGame рассылает gameState', () => {
  const c = ctx();
  const created = handleMessage({ type: 'createRoom', payload: { name: 'Ваня', token: 'hat' } }, c.wsKey, c);
  const code = created.payload.code;
  const hostId = created.payload.playerId;
  handleMessage({ type: 'joinRoom', payload: { code, name: 'Маша', token: 'car' } }, 'ws-2', c);
  const res = handleMessage({ type: 'startGame', payload: { code } }, c.wsKey, c);
  assert.equal(res.broadcast.type, 'gameState');
  assert.equal(res.broadcast.payload.room.state, 'playing');
});

test('startGame не хостом — error', () => {
  const c = ctx();
  const created = handleMessage({ type: 'createRoom', payload: { name: 'Ваня', token: 'hat' } }, c.wsKey, c);
  const code = created.payload.code;
  const res = handleMessage({ type: 'startGame', payload: { code } }, 'ws-2', c);
  assert.equal(res.type, 'error');
  assert.match(res.payload.message, /хост/);
});
```

- [ ] **Step 2: Запустить — упасть**

```bash
cd D:/Monopoly
npm test
```
Expected: FAIL — `Cannot find module '../server/messages'`.

- [ ] **Step 3: Реализовать messages.js**

`server/messages.js`:
```js
// messages.js — маршрутизация WS-сообщений лобби.
const { createRoom, joinRoom, startGame, listPlayers } = require('./rooms');

function lobbyState(store, code) {
  const players = listPlayers(store, code);
  return { type: 'lobbyUpdate', broadcast: true, payload: { players, canStart: players.length >= 2 } };
}

function handleMessage(msg, wsKey, ctx) {
  const { type, payload } = msg || {};
  try {
    if (type === 'createRoom') {
      const { code, playerId } = createRoom(ctx.store, payload);
      ctx.playerIdByWs.set(wsKey, { code, playerId });
      return { type: 'roomCreated', payload: { code, playerId }, ...lobbyState(ctx.store, code) };
    }
    if (type === 'joinRoom') {
      const { code } = payload;
      const { playerId } = joinRoom(ctx.store, code, payload);
      ctx.playerIdByWs.set(wsKey, { code, playerId });
      return { type: 'roomJoined', payload: { code, playerId }, ...lobbyState(ctx.store, code) };
    }
    if (type === 'startGame') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      startGame(ctx.store, binding.code, binding.playerId);
      const room = ctx.store.get(binding.code);
      return { type: 'gameStarted', broadcast: true, payload: { room } };
    }
    return { type: 'error', payload: { message: 'Неизвестный тип сообщения: ' + type } };
  } catch (e) {
    return { type: 'error', payload: { message: e.message } };
  }
}

module.exports = { handleMessage };
```

- [ ] **Step 4: Запустить — пройти**

```bash
cd D:/Monopoly
npm test
```
Expected: все PASS.

- [ ] **Step 5: Коммит**

```bash
cd D:/Monopoly
git add server/messages.js test/messages.test.js
git commit -m "feat: маршрутизация WS-сообщений лобби (createRoom/joinRoom/startGame)"
```

---

## Task 5: HTTP + WebSocket сервер (index.js)

**Files:**
- Create: `D:\Monopoly\server\index.js`

- [ ] **Step 1: Реализовать index.js**

`server/index.js`:
```js
// index.js — HTTP (статика public/) + WebSocket сервер лобби.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const { handleMessage } = require('./messages');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

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
  const filePath = path.join(PUBLIC_DIR, urlPath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

const ctx = { store: new Map(), playerIdByWs: new Map() };

wss.on('connection', (ws) => {
  const wsKey = ws._socket.remoteAddress + ':' + ws._socket.remotePort + ':' + Date.now();
  ws._monopolyKey = wsKey;

  ws.on('message', (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { ws.send(JSON.stringify({ type: 'error', payload: { message: 'Неверный JSON' } })); return; }
    const res = handleMessage(msg, wsKey, ctx);
    if (res.broadcast) {
      const roomCode = ctx.playerIdByWs.get(wsKey)?.code || msg.payload?.code;
      broadcastToRoom(roomCode, res.type === 'gameStarted' ? { type: 'gameState', payload: { room: res.payload.room } } : res);
    } else {
      ws.send(JSON.stringify(res));
    }
  });

  ws.on('close', () => {
    const binding = ctx.playerIdByWs.get(wsKey);
    if (binding) {
      const room = ctx.store.get(binding.code);
      if (room) {
        const p = room.players.find(pl => pl.id === binding.playerId);
        if (p) p.online = false;
        broadcastToRoom(binding.code, lobbyStateFor(binding.code));
      }
    }
    ctx.playerIdByWs.delete(wsKey);
  });
});

function broadcastToRoom(code, msg) {
  if (!code) return;
  for (const [key, binding] of ctx.playerIdByWs) {
    if (binding.code !== code) continue;
    for (const ws of wss.clients) {
      if (ws._monopolyKey === key && ws.readyState === 1) ws.send(JSON.stringify(msg));
    }
  }
}

function lobbyStateFor(code) {
  const players = ctx.store.get(code)?.players.map(p => ({ ...p })) || [];
  return { type: 'lobbyUpdate', payload: { players, canStart: players.length >= 2 } };
}

server.listen(PORT, () => console.log(`Монополия: http://localhost:${PORT}`));
```

- [ ] **Step 2: Проверить ручной запуск (создать минимальную заглушку public/index.html пока нет Task 6)**

Создать временно `public/index.html`:
```html
<!doctype html><meta charset="utf-8"><title>Монополия</title>
<h1>Сервер работает</h1>
```

```bash
cd D:/Monopoly
npm start
```
Expected: в консоли `Монополия: http://localhost:3000`. Открыть `http://localhost:3000` — «Сервер работает». Остановить (Ctrl+C).

- [ ] **Step 3: Коммит**

```bash
cd D:/Monopoly
git add server/index.js public/index.html
git commit -m "feat: HTTP + WebSocket сервер, отдаёт статику, обрабатывает лобби"
```

---

## Task 6: Фронтенд — экран входа и лобби (HTML/CSS/JS)

**Files:**
- Create: `D:\Monopoly\public\index.html` (заменить заглушку)
- Create: `D:\Monopoly\public\style.css`
- Create: `D:\Monopoly\public\net.js`
- Create: `D:\Monopoly\public\ui.js`

- [ ] **Step 1: index.html — два экрана (вход, лобби), экран игры-заглушка**

`public/index.html` (полная замена):
```html
<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Монополия</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Экран входа -->
  <section id="screen-entry" class="screen">
    <h1>Монополия</h1>
    <div class="tabs">
      <button id="tab-create" class="tab active">Создать игру</button>
      <button id="tab-join" class="tab">Войти в игру</button>
    </div>
    <div id="form-create" class="form">
      <label>Ваше имя<input id="create-name" maxlength="16"></label>
      <label>Фишка
        <select id="create-token"></select>
      </label>
      <button id="btn-create">Создать игру</button>
    </div>
    <div id="form-join" class="form hidden">
      <label>Код комнаты<input id="join-code" maxlength="6" style="text-transform:uppercase"></label>
      <label>Ваше имя<input id="join-name" maxlength="16"></label>
      <label>Фишка
        <select id="join-token"></select>
      </label>
      <button id="btn-join">Войти</button>
    </div>
    <p id="entry-error" class="error hidden"></p>
  </section>

  <!-- Лобби -->
  <section id="screen-lobby" class="screen hidden">
    <h2>Лобби</h2>
    <p>Код комнаты: <strong id="lobby-code"></strong> — сообщите его друзьям</p>
    <ul id="lobby-players"></ul>
    <button id="btn-start" disabled>Начать игру</button>
    <p id="lobby-hint" class="hint hidden">Минимум 2 игрока для старта</p>
  </section>

  <!-- Экран игры (заглушка Вехи 1) -->
  <section id="screen-game" class="screen hidden">
    <h2>Игра началась!</h2>
    <p id="game-state-info"></p>
    <p class="hint">Игровое поле появится в Вехе 2.</p>
  </section>

  <script src="net.js"></script>
  <script src="ui.js"></script>
</body>
</html>
```

- [ ] **Step 2: style.css**

`public/style.css`:
```css
:root { --accent:#e74c3c; --bg:#1b1b2b; --card:#2d2d44; --txt:#eee; }
* { box-sizing:border-box; }
body { margin:0; font-family:system-ui,Segoe UI,Arial,sans-serif; background:var(--bg); color:var(--txt); }
.screen { max-width:480px; margin:0 auto; padding:16px; min-height:100vh; display:flex; flex-direction:column; }
h1,h2 { text-align:center; }
.tabs { display:flex; gap:8px; margin:16px 0; }
.tab { flex:1; padding:10px; border:1px solid #555; background:transparent; color:var(--txt); border-radius:8px; cursor:pointer; }
.tab.active { background:var(--accent); border-color:var(--accent); }
.form { display:flex; flex-direction:column; gap:12px; }
label { display:flex; flex-direction:column; gap:6px; font-size:14px; }
input,select { padding:10px; border-radius:8px; border:1px solid #555; background:#1b1b2b; color:var(--txt); font-size:16px; }
button { padding:12px; border:0; border-radius:8px; background:var(--accent); color:#fff; font-size:16px; cursor:pointer; }
button:disabled { background:#555; cursor:not-allowed; }
.hidden { display:none !important; }
.error { color:#ff6b6b; }
.hint { color:#999; font-size:13px; text-align:center; }
#lobby-players { list-style:none; padding:0; }
#lobby-players li { padding:8px; background:var(--card); border-radius:8px; margin-bottom:6px; display:flex; justify-content:space-between; }
#lobby-code { font-size:24px; letter-spacing:3px; color:var(--accent); }
```

- [ ] **Step 3: net.js — WebSocket-клиент + localStorage**

`public/net.js`:
```js
// net.js — WebSocket-клиент. Хранит code/playerId в localStorage, переподключается.
const Net = {
  ws: null,
  handlers: {},
  connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    this.ws = new WebSocket(`${proto}://${location.host}`);
    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      (this.handlers[msg.type] || []).forEach(h => h(msg.payload));
    };
    this.ws.onclose = () => {
      setTimeout(() => this.connect(), 1500);
    };
  },
  send(type, payload) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ type, payload }));
  },
  on(type, fn) {
    (this.handlers[type] = this.handlers[type] || []).push(fn);
  }
};
function saveSession(s) { localStorage.setItem('monopoly', JSON.stringify(s)); }
function loadSession() { try { return JSON.parse(localStorage.getItem('monopoly')); } catch { return null; } }
Net.connect();
```

- [ ] **Step 4: ui.js — экраны входа/лобби + выбор фишки**

`public/ui.js`:
```js
// ui.js — переключение экранов, обработка лобби.
const TOKENS = ['hat','car','dog','ship','boot','thimble','cat','wheelbarrow'];
const TOKEN_NAMES = { hat:'Шляпа', car:'Машина', dog:'Собака', ship:'Корабль', boot:'Башмак', thimble:'Напёрсток', cat:'Кот', wheelbarrow:'Тачка' };

const $ = (id) => document.getElementById(id);

function fillTokens(select) {
  TOKENS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = TOKEN_NAMES[t];
    select.appendChild(opt);
  });
}
fillTokens($('create-token'));
fillTokens($('join-token'));

function showScreen(id) {
  ['screen-entry','screen-lobby','screen-game'].forEach(s => $(s).classList.add('hidden'));
  $(id).classList.remove('hidden');
}

// Табы входа
$('tab-create').onclick = () => {
  $('tab-create').classList.add('active'); $('tab-join').classList.remove('active');
  $('form-create').classList.remove('hidden'); $('form-join').classList.add('hidden');
  $('entry-error').classList.add('hidden');
};
$('tab-join').onclick = () => {
  $('tab-join').classList.add('active'); $('tab-create').classList.remove('active');
  $('form-join').classList.remove('hidden'); $('form-create').classList.add('hidden');
  $('entry-error').classList.add('hidden');
};

function err(msg) { const e = $('entry-error'); e.textContent = msg; e.classList.remove('hidden'); }

// Создать игру
$('btn-create').onclick = () => {
  const name = $('create-name').value.trim();
  const token = $('create-token').value;
  if (!name) return err('Введите имя');
  Net.send('createRoom', { name, token });
};

// Войти в игру
$('btn-join').onclick = () => {
  const code = $('join-code').value.trim().toUpperCase();
  const name = $('join-name').value.trim();
  const token = $('join-token').value;
  if (!code) return err('Введите код комнаты');
  if (!name) return err('Введите имя');
  Net.send('joinRoom', { code, name, token });
};

// Обработчики сервера
Net.on('roomCreated', (p) => {
  saveSession({ code: p.code, playerId: p.playerId });
  $('lobby-code').textContent = p.code;
  showScreen('screen-lobby');
});
Net.on('roomJoined', (p) => {
  saveSession({ code: p.code, playerId: p.playerId });
  $('lobby-code').textContent = p.code;
  showScreen('screen-lobby');
});
Net.on('lobbyUpdate', (p) => {
  const ul = $('lobby-players'); ul.innerHTML = '';
  p.players.forEach(pl => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${pl.name} <span class="hint">(${TOKEN_NAMES[pl.token]||pl.token})</span></span>${pl.isHost ? '<b>хост</b>':''}`;
    ul.appendChild(li);
  });
  $('btn-start').disabled = !p.canStart;
  $('lobby-hint').classList.toggle('hidden', p.canStart);
});
Net.on('error', (p) => err(p.message));
Net.on('gameState', (p) => {
  showScreen('screen-game');
  $('game-state-info').textContent = 'Игроков: ' + p.room.players.length + ', ход: ' + (p.room.players.find(x=>x.id===p.room.currentPlayerId)?.name||'?');
});

// Кнопка «Начать игру» (видна только хосту — проверим по сохранённой сессии)
$('btn-start').onclick = () => {
  Net.send('startGame', {});
};
```

- [ ] **Step 5: Ручная проверка — полный цикл лобби**

```bash
cd D:/Monopoly
npm start
```
1. Открыть `http://localhost:3000` в двух вкладках браузера.
2. Вкладка 1: «Создать игру», имя «Ваня», фишка «Шляпа» → появляется лобби с кодом.
3. Вкладка 2: «Войти в игру», ввести код из вкладки 1, имя «Маша», фишка «Машина» → появляется в списке лобби у обоих.
4. Во вкладке 1 кнопка «Начать игру» активна → нажать → обе вкладки переходят на экран «Игра началась!». Остановить сервер (Ctrl+C).

- [ ] **Step 6: Коммит**

```bash
cd D:/Monopoly
git add public/
git commit -m "feat: фронтенд — экран входа (создать/войти), лобби со списком игроков"
```

---

## Task 7: README с инструкцией запуска

**Files:**
- Create: `D:\Monopoly\README.md`

- [ ] **Step 1: Написать README.md**

`README.md`:
```markdown
# Монополия (русская версия) — мультиплеер в браузере

Веб-игра для 2–6 игроков. Сервер запускается на компьютере, игроки подключаются через браузер.

## Запуск

1. Установить Node.js 18+ (https://nodejs.org).
2. В папке проекта:
   ```bash
   npm install
   npm start
   ```
3. Открыть `http://localhost:3000` — создать игру, получить код.
4. Другие игроки открывают тот же адрес (в локальной сети) и входят по коду.

## Доступ через интернет (ngrok)

1. Скачать ngrok: https://ngrok.com/download
2. Запустить сервер: `npm start`
3. В другом терминале:
   ```bash
   ngrok http 3000
   ```
4. ngrok выдаст ссылку вида `https://abc123.ngrok.io` — передать её друзьям.
5. Друзья открывают ссылку в браузере телефона, входят по коду комнаты.

## Статус

Веха 1: лобби (создание/вход по коду, старт игры). Поле и игровой процесс — в следующих вехах.
```

- [ ] **Step 2: Коммит**

```bash
cd D:/Monopoly
git add README.md
git commit -m "docs: README — запуск и ngrok"
```

---

## Чекпоуст Вехи 1

После выполнения всех задач:
- `npm test` — все тесты комнат и сообщений проходят.
- `npm start` — можно создать игру, войти по коду с двух устройств, увидеть лобби, начать игру (заглушка).

**Дальше:** Веха 2 — поле 40 клеток, отрисовка на Canvas, старт игры с раздачей денег, бросок кубиков и движение фишки.