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
  assert.deepEqual(c.playerIdByWs.get(c.wsKey), { code: res.payload.code, playerId: res.payload.playerId });
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
  assert.deepEqual(c.playerIdByWs.get(ws2), { code, playerId: res.payload.playerId });
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
  handleMessage({ type: 'joinRoom', payload: { code, name: 'Маша', token: 'car' } }, 'ws-2', c);
  const res = handleMessage({ type: 'startGame', payload: {} }, c.wsKey, c);
  assert.equal(res.broadcast.type, 'gameState');
  assert.equal(res.broadcast.payload.room.state, 'playing');
});

test('startGame не хостом — error', () => {
  const c = ctx();
  handleMessage({ type: 'createRoom', payload: { name: 'Ваня', token: 'hat' } }, c.wsKey, c);
  const res = handleMessage({ type: 'startGame', payload: {} }, 'ws-2', c);
  assert.equal(res.type, 'error');
  assert.match(res.payload.message, /авторизован|хост/i);
});

test('rollDice moves current player and broadcasts gameState', () => {
  const c = ctx();
  c.diceRoller = () => [3, 4];
  const created = handleMessage({ type: 'createRoom', payload: { name: 'Ваня', token: 'hat' } }, c.wsKey, c);
  const code = created.payload.code;
  handleMessage({ type: 'joinRoom', payload: { code, name: 'Маша', token: 'car' } }, 'ws-2', c);
  handleMessage({ type: 'startGame', payload: {} }, c.wsKey, c);

  const res = handleMessage({ type: 'rollDice', payload: {} }, c.wsKey, c);

  assert.equal(res.type, 'diceResult');
  assert.deepEqual(res.payload.dice, [3, 4]);
  assert.equal(res.broadcast.type, 'gameState');
  assert.equal(res.broadcast.payload.room.players[0].position, 7);
  assert.equal(res.broadcast.payload.room.currentPlayerId, c.playerIdByWs.get('ws-2').playerId);
});

test('buyProperty message buys pending property and broadcasts gameState', () => {
  const c = ctx();
  c.diceRoller = () => [1, 2];
  const created = handleMessage({ type: 'createRoom', payload: { name: 'Ваня', token: 'hat' } }, c.wsKey, c);
  const code = created.payload.code;
  handleMessage({ type: 'joinRoom', payload: { code, name: 'Маша', token: 'car' } }, 'ws-2', c);
  handleMessage({ type: 'startGame', payload: {} }, c.wsKey, c);
  const room = c.store.get(code);
  room.players[0].position = 38;
  handleMessage({ type: 'rollDice', payload: {} }, c.wsKey, c);

  const res = handleMessage({ type: 'buyProperty', payload: {} }, c.wsKey, c);

  assert.equal(res.type, 'propertyBought');
  assert.equal(res.broadcast.type, 'gameState');
  assert.equal(res.broadcast.payload.room.board[1].owner, created.payload.playerId);
});

test('declineBuy message clears pending purchase and broadcasts gameState', () => {
  const c = ctx();
  c.diceRoller = () => [1, 2];
  const created = handleMessage({ type: 'createRoom', payload: { name: 'Ваня', token: 'hat' } }, c.wsKey, c);
  const code = created.payload.code;
  handleMessage({ type: 'joinRoom', payload: { code, name: 'Маша', token: 'car' } }, 'ws-2', c);
  handleMessage({ type: 'startGame', payload: {} }, c.wsKey, c);
  const room = c.store.get(code);
  room.players[0].position = 38;
  handleMessage({ type: 'rollDice', payload: {} }, c.wsKey, c);

  const res = handleMessage({ type: 'declineBuy', payload: {} }, c.wsKey, c);

  assert.equal(res.type, 'purchaseDeclined');
  assert.equal(res.broadcast.type, 'gameState');
  assert.equal(res.broadcast.payload.room.pendingPurchase, null);
});

test('reconnect binds a new websocket key to existing player and sends state', () => {
  const c = ctx();
  const created = handleMessage({ type: 'createRoom', payload: { name: 'Ваня', token: 'hat' } }, c.wsKey, c);
  const code = created.payload.code;
  const playerId = created.payload.playerId;
  c.playerIdByWs.delete(c.wsKey);
  c.store.get(code).players[0].online = false;

  const res = handleMessage({ type: 'reconnect', payload: { code, playerId } }, 'new-ws', c);

  assert.equal(res.type, 'reconnected');
  assert.deepEqual(c.playerIdByWs.get('new-ws'), { code, playerId });
  assert.equal(c.store.get(code).players[0].online, true);
  assert.equal(res.broadcast.type, 'lobbyUpdate');
});
