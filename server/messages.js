// messages.js — маршрутизация WS-сообщений лобби.
const { createRoom, joinRoom, startGame, listPlayers } = require('./rooms');
const {
  rollDiceForPlayer,
  buyProperty,
  declinePurchase,
  bidAuction,
  passAuction,
  endTurn,
  buildHouse,
  sellHouse,
  mortgageProperty,
  unmortgageProperty,
  payJailFine,
  useJailCard,
  proposeTrade,
  respondTrade
} = require('./game');

function lobbyState(store, code) {
  const players = listPlayers(store, code);
  return { type: 'lobbyUpdate', payload: { players, canStart: players.length >= 2 } };
}

function handleMessage(msg, wsKey, ctx) {
  const { type, payload = {} } = msg || {};
  try {
    if (type === 'createRoom') {
      const { code, playerId } = createRoom(ctx.store, payload);
      ctx.playerIdByWs.set(wsKey, { code, playerId });
      return {
        type: 'roomCreated',
        payload: { code, playerId },
        broadcast: lobbyState(ctx.store, code)
      };
    }

    if (type === 'joinRoom') {
      const { code } = payload;
      const { playerId } = joinRoom(ctx.store, code, payload);
      ctx.playerIdByWs.set(wsKey, { code, playerId });
      return {
        type: 'roomJoined',
        payload: { code, playerId },
        broadcast: lobbyState(ctx.store, code)
      };
    }

    if (type === 'reconnect') {
      const { code, playerId } = payload;
      const room = ctx.store.get(code);
      if (!room) throw new Error('Комната не найдена');
      const player = room.players.find(p => p.id === playerId);
      if (!player) throw new Error('Игрок не найден');
      player.online = true;
      ctx.playerIdByWs.set(wsKey, { code, playerId });
      return {
        type: 'reconnected',
        payload: { code, playerId },
        broadcast: room.state === 'playing'
          ? { type: 'gameState', payload: { room } }
          : lobbyState(ctx.store, code)
      };
    }

    if (type === 'startGame') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      startGame(ctx.store, binding.code, binding.playerId);
      const room = ctx.store.get(binding.code);
      return {
        type: 'gameStarted',
        payload: { room },
        broadcast: { type: 'gameState', payload: { room } }
      };
    }

    if (type === 'rollDice') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      const result = rollDiceForPlayer(room, binding.playerId, ctx.diceRoller);
      return {
        type: 'diceResult',
        payload: { dice: result.dice, movedTo: result.movedTo, sentToJail: result.sentToJail },
        broadcast: { type: 'gameState', payload: { room } }
      };
    }

    if (type === 'buyProperty') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      buyProperty(room, binding.playerId);
      return {
        type: 'propertyBought',
        payload: {},
        broadcast: { type: 'gameState', payload: { room } }
      };
    }

    if (type === 'declineBuy') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      declinePurchase(room, binding.playerId);
      return {
        type: 'purchaseDeclined',
        payload: {},
        broadcast: { type: 'gameState', payload: { room } }
      };
    }

    if (type === 'bid') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      bidAuction(room, binding.playerId, Number(payload.amount));
      return { type: 'bidAccepted', payload: {}, broadcast: { type: 'gameState', payload: { room } } };
    }

    if (type === 'passBid') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      passAuction(room, binding.playerId);
      return { type: 'bidPassed', payload: {}, broadcast: { type: 'gameState', payload: { room } } };
    }

    if (type === 'endTurn') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      endTurn(room, binding.playerId);
      return {
        type: 'turnEnded',
        payload: {},
        broadcast: { type: 'gameState', payload: { room } }
      };
    }

    if (type === 'buildHouse') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      buildHouse(room, binding.playerId, payload.pos);
      return { type: 'houseBuilt', payload: {}, broadcast: { type: 'gameState', payload: { room } } };
    }

    if (type === 'sellHouse') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      sellHouse(room, binding.playerId, payload.pos);
      return { type: 'houseSold', payload: {}, broadcast: { type: 'gameState', payload: { room } } };
    }

    if (type === 'mortgage') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      mortgageProperty(room, binding.playerId, payload.pos);
      return { type: 'propertyMortgaged', payload: {}, broadcast: { type: 'gameState', payload: { room } } };
    }

    if (type === 'unmortgage') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      unmortgageProperty(room, binding.playerId, payload.pos);
      return { type: 'propertyUnmortgaged', payload: {}, broadcast: { type: 'gameState', payload: { room } } };
    }

    if (type === 'payJailFine') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      payJailFine(room, binding.playerId);
      return { type: 'jailFinePaid', payload: {}, broadcast: { type: 'gameState', payload: { room } } };
    }

    if (type === 'useJailCard') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      useJailCard(room, binding.playerId);
      return { type: 'jailCardUsed', payload: {}, broadcast: { type: 'gameState', payload: { room } } };
    }

    if (type === 'proposeTrade') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      const trade = proposeTrade(room, binding.playerId, payload);
      return { type: 'tradeProposed', payload: { trade }, broadcast: { type: 'gameState', payload: { room } } };
    }

    if (type === 'respondTrade') {
      const binding = ctx.playerIdByWs.get(wsKey);
      if (!binding) throw new Error('Не авторизован');
      const room = ctx.store.get(binding.code);
      if (!room) throw new Error('Комната не найдена');
      respondTrade(room, binding.playerId, payload.tradeId, payload.accept);
      return { type: 'tradeResponded', payload: {}, broadcast: { type: 'gameState', payload: { room } } };
    }

    return { type: 'error', payload: { message: 'Неизвестный тип сообщения: ' + type } };
  } catch (e) {
    return { type: 'error', payload: { message: e.message } };
  }
}

module.exports = { handleMessage, lobbyState };
