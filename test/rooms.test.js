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
  assert.throws(() => joinRoom(store, 'NOPE01', { name: 'Маша', token: 'car' }), /комнат.*не найден/i);
});

test('joinRoom бросает ошибку при дубликате имени', () => {
  const store = new Map();
  const { code } = createRoom(store, { name: 'Ваня', token: 'hat' });
  assert.throws(() => joinRoom(store, code, { name: 'Ваня', token: 'car' }), /имя.*занят/i);
});

test('joinRoom бросает ошибку при занятой фишке', () => {
  const store = new Map();
  const { code } = createRoom(store, { name: 'Ваня', token: 'hat' });
  assert.throws(() => joinRoom(store, code, { name: 'Маша', token: 'hat' }), /фишк.*занят/i);
});

test('joinRoom не пускает больше 6 игроков', () => {
  const store = new Map();
  const { code } = createRoom(store, { name: 'P1', token: 'hat' });
  joinRoom(store, code, { name: 'P2', token: 'car' });
  joinRoom(store, code, { name: 'P3', token: 'dog' });
  joinRoom(store, code, { name: 'P4', token: 'ship' });
  joinRoom(store, code, { name: 'P5', token: 'boot' });
  joinRoom(store, code, { name: 'P6', token: 'thimble' });
  assert.throws(() => joinRoom(store, code, { name: 'P7', token: 'cat' }), /максимум.*6.*игрок/i);
});

test('joinRoom не пускает в уже начавшуюся игру', () => {
  const store = new Map();
  const { code, playerId } = createRoom(store, { name: 'Ваня', token: 'hat' });
  joinRoom(store, code, { name: 'Маша', token: 'car' });
  startGame(store, code, playerId);
  assert.throws(() => joinRoom(store, code, { name: 'Олег', token: 'dog' }), /игр.*уже.*начал/i);
});

test('startGame меняет state на playing, только хост может', () => {
  const store = new Map();
  const { code, playerId } = createRoom(store, { name: 'Ваня', token: 'hat' });
  joinRoom(store, code, { name: 'Маша', token: 'car' });
  startGame(store, code, playerId);
  const room = store.get(code);
  assert.equal(room.state, 'playing');
  assert.ok(room.currentPlayerId, 'должен быть текущий игрок');
});

test('startGame требует минимум 2 игрока', () => {
  const store = new Map();
  const { code, playerId } = createRoom(store, { name: 'Ваня', token: 'hat' });
  assert.throws(() => startGame(store, code, playerId), /минимум.*2.*игрок/i);
});

test('startGame не может запустить не хост', () => {
  const store = new Map();
  const { code } = createRoom(store, { name: 'Ваня', token: 'hat' });
  const { playerId: guestId } = joinRoom(store, code, { name: 'Маша', token: 'car' });
  assert.throws(() => startGame(store, code, guestId), /тольк.*хост/i);
});
