// rooms.js — логика лобби: создание/вход/старт. Без WebSocket.
const { randomCode, makePlayerId } = require('./util');
const { startRoomGame } = require('./game');

const TOKENS = ['hat', 'car', 'dog', 'ship', 'boot', 'thimble', 'cat', 'wheelbarrow'];

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

function joinRoom(store, code, { name, token }) {
  const room = store.get(code);
  if (!room) throw new Error('Комната с таким кодом не найдена');
  if (room.state !== 'lobby') throw new Error('Игра уже началась');
  if (room.players.length >= 6) throw new Error('В комнате максимум 6 игроков');
  if (!name) throw new Error('Имя обязательно');
  if (!TOKENS.includes(token)) throw new Error('Недопустимая фишка');
  if (room.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
    throw new Error('Это имя уже занято');
  }
  if (room.players.some(p => p.token === token)) {
    throw new Error('Эта фишка уже занята');
  }

  const playerId = makePlayerId();
  const colors = ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6', '#e67e22'];
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
  startRoomGame(room);
}

module.exports = { createRoom, joinRoom, startGame, listPlayers, TOKENS };
