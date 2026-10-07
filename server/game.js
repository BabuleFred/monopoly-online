// game.js — ядро игровой логики: старт партии, кубики, движение и базовые действия.
const { createBoard } = require('./board');
const { createChanceDeck, createChestDeck } = require('./cards');

function startRoomGame(room) {
  room.state = 'playing';
  room.board = createBoard();
  room.currentPlayerId = room.players[0].id;
  room.turnPhase = 'roll';
  room.dice = null;
  room.doublesCount = 0;
  room.bankHouses = 32;
  room.bankHotels = 12;
  room.auction = null;
  room.pendingPurchase = null;
  room.chanceDeck = createChanceDeck();
  room.chestDeck = createChestDeck();
  room.lastCard = null;
  room.trades = [];
  room.lastAction = 'Игра началась';

  room.players.forEach(player => {
    player.money = 1500;
    player.position = 0;
    player.inJail = false;
    player.jailTurns = 0;
    player.getOutOfJailCards = 0;
    player.bankrupt = false;
  });
}

function rollDiceForPlayer(room, playerId, diceRoller = randomDice) {
  if (room.state !== 'playing') throw new Error('Игра ещё не началась');
  if (room.turnPhase !== 'roll') throw new Error('Сейчас нельзя бросать кубики');
  if (room.currentPlayerId !== playerId) throw new Error('Не ваш ход');

  const player = findPlayer(room, playerId);
  if (player.bankrupt) throw new Error('Игрок банкрот');

  const dice = diceRoller();
  const steps = dice[0] + dice[1];
  const oldPosition = player.position;
  const newPosition = (oldPosition + steps) % 40;

  if (oldPosition + steps >= 40) {
    player.money += 200;
  }

  room.dice = dice;
  room.doublesCount = dice[0] === dice[1] ? room.doublesCount + 1 : 0;

  if (newPosition === 30) {
    sendToJail(room, player);
    room.lastAction = `${player.name} выбросил ${dice[0]}+${dice[1]} и отправился в тюрьму`;
    advanceTurn(room);
    return { dice, movedTo: player.position, sentToJail: true };
  }

  player.position = newPosition;
  const handled = handleLanding(room, player, dice);

  if (!handled) {
    room.lastAction = `${player.name} выбросил ${dice[0]}+${dice[1]} и перешёл на ${room.board[newPosition].name}`;
    if (dice[0] !== dice[1]) advanceTurn(room);
  }

  return { dice, movedTo: player.position, sentToJail: false };
}

function buyProperty(room, playerId) {
  ensurePendingPurchase(room, playerId);
  const player = findPlayer(room, playerId);
  const cell = room.board[room.pendingPurchase.pos];
  if (player.money < cell.price) throw new Error('Недостаточно денег для покупки');

  player.money -= cell.price;
  cell.owner = playerId;
  room.lastAction = `${player.name} купил ${cell.name} за ${cell.price}₽`;
  room.pendingPurchase = null;
  advanceTurn(room);
}

function declinePurchase(room, playerId) {
  ensurePendingPurchase(room, playerId);
  const player = findPlayer(room, playerId);
  const cell = room.board[room.pendingPurchase.pos];
  room.lastAction = `${player.name} отказался покупать ${cell.name}. Начался аукцион`;
  room.pendingPurchase = null;
  room.auction = {
    propertyPos: cell.pos,
    highestBid: 0,
    highestBidderId: null,
    activePlayers: room.players.filter(p => !p.bankrupt).map(p => p.id),
    passedPlayers: []
  };
  room.turnPhase = 'auction';
}

function bidAuction(room, playerId, amount) {
  if (!room.auction) throw new Error('Аукцион не идёт');
  if (!room.auction.activePlayers.includes(playerId)) throw new Error('Игрок не участвует в аукционе');
  const player = findPlayer(room, playerId);
  if (amount <= room.auction.highestBid) throw new Error('Ставка должна быть выше текущей');
  if (amount > player.money) throw new Error('Недостаточно денег');
  room.auction.highestBid = amount;
  room.auction.highestBidderId = playerId;
  room.lastAction = `${player.name} сделал ставку ${amount}₽`;
}

function passAuction(room, playerId) {
  if (!room.auction) throw new Error('Аукцион не идёт');
  if (!room.auction.activePlayers.includes(playerId)) throw new Error('Игрок не участвует в аукционе');
  room.auction.activePlayers = room.auction.activePlayers.filter(id => id !== playerId);
  room.auction.passedPlayers.push(playerId);
  const player = findPlayer(room, playerId);
  room.lastAction = `${player.name} пасует на аукционе`;
  finishAuctionIfReady(room);
}

function finishAuctionIfReady(room) {
  if (!room.auction) return;
  if (room.auction.activePlayers.length > 1) return;
  const auction = room.auction;
  const cell = room.board[auction.propertyPos];
  if (auction.highestBidderId) {
    const winner = findPlayer(room, auction.highestBidderId);
    winner.money -= auction.highestBid;
    cell.owner = winner.id;
    room.currentPlayerId = winner.id;
    room.lastAction = `${winner.name} выиграл аукцион: ${cell.name} за ${auction.highestBid}₽`;
  }
  room.auction = null;
  room.turnPhase = 'roll';
}

function endTurn(room, playerId) {
  if (room.currentPlayerId !== playerId) throw new Error('Не ваш ход');
  if (room.pendingPurchase) throw new Error('Сначала купите или откажитесь от покупки');
  advanceTurn(room);
}

function buildHouse(room, playerId, pos) {
  const player = findPlayer(room, playerId);
  const cell = room.board[pos];
  ensureOwnStreet(cell, playerId);
  ensureFullGroup(room, cell, playerId);
  ensureEvenBuild(room, cell);

  if (cell.houses === 4) {
    if (room.bankHotels <= 0) throw new Error('В банке нет отелей');
    if (player.money < cell.housePrice) throw new Error('Недостаточно денег');
    player.money -= cell.housePrice;
    cell.houses = 5;
    room.bankHotels -= 1;
    room.bankHouses += 4;
    room.lastAction = `${player.name} построил отель на ${cell.name}`;
    return;
  }

  if (cell.houses >= 5) throw new Error('На участке уже есть отель');
  if (room.bankHouses <= 0) throw new Error('В банке нет домов');
  if (player.money < cell.housePrice) throw new Error('Недостаточно денег');
  player.money -= cell.housePrice;
  cell.houses += 1;
  room.bankHouses -= 1;
  room.lastAction = `${player.name} построил дом на ${cell.name}`;
}

function sellHouse(room, playerId, pos) {
  const player = findPlayer(room, playerId);
  const cell = room.board[pos];
  ensureOwnStreet(cell, playerId);
  if (cell.houses <= 0) throw new Error('На участке нет домов');
  if (cell.houses === 5) {
    cell.houses = 4;
    room.bankHotels += 1;
    room.bankHouses -= 4;
  } else {
    cell.houses -= 1;
    room.bankHouses += 1;
  }
  player.money += Math.floor(cell.housePrice / 2);
  room.lastAction = `${player.name} продал строение на ${cell.name}`;
}

function mortgageProperty(room, playerId, pos) {
  const player = findPlayer(room, playerId);
  const cell = room.board[pos];
  ensureOwnProperty(cell, playerId);
  if (cell.mortgaged) throw new Error('Собственность уже заложена');
  if (cell.type === 'street' && groupCells(room, cell).some(c => c.houses > 0)) {
    throw new Error('Нельзя заложить группу с домами');
  }
  cell.mortgaged = true;
  player.money += Math.floor(cell.price / 2);
  room.lastAction = `${player.name} заложил ${cell.name}`;
}

function unmortgageProperty(room, playerId, pos) {
  const player = findPlayer(room, playerId);
  const cell = room.board[pos];
  ensureOwnProperty(cell, playerId);
  if (!cell.mortgaged) throw new Error('Собственность не заложена');
  const cost = Math.floor(cell.price / 2 * 1.1);
  if (player.money < cost) throw new Error('Недостаточно денег');
  player.money -= cost;
  cell.mortgaged = false;
  room.lastAction = `${player.name} выкупил ${cell.name} из залога`;
}

function payJailFine(room, playerId) {
  const player = findPlayer(room, playerId);
  if (!player.inJail) throw new Error('Игрок не в тюрьме');
  if (player.money < 50) throw new Error('Недостаточно денег');
  player.money -= 50;
  markBankruptIfNeeded(player);
  player.inJail = false;
  player.jailTurns = 0;
  room.lastAction = `${player.name} заплатил 50₽ и вышел из тюрьмы`;
}

function useJailCard(room, playerId) {
  const player = findPlayer(room, playerId);
  if (!player.inJail) throw new Error('Игрок не в тюрьме');
  if (player.getOutOfJailCards <= 0) throw new Error('Нет карточки освобождения');
  player.getOutOfJailCards -= 1;
  player.inJail = false;
  player.jailTurns = 0;
  room.lastAction = `${player.name} использовал карточку освобождения`;
}

function proposeTrade(room, fromPlayerId, offer) {
  const from = findPlayer(room, fromPlayerId);
  const to = findPlayer(room, offer.toPlayerId);
  const give = normalizeTradePart(offer.give);
  const receive = normalizeTradePart(offer.receive);
  validateTradePart(room, from.id, give);
  validateTradePart(room, to.id, receive);
  const trade = {
    id: 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    fromPlayerId: from.id,
    toPlayerId: to.id,
    give,
    receive,
    status: 'pending'
  };
  room.trades.push(trade);
  room.lastAction = `${from.name} предложил обмен игроку ${to.name}`;
  return trade;
}

function respondTrade(room, playerId, tradeId, accept) {
  const trade = room.trades.find(t => t.id === tradeId);
  if (!trade) throw new Error('Обмен не найден');
  if (trade.toPlayerId !== playerId) throw new Error('Это предложение не вам');
  if (trade.status !== 'pending') throw new Error('Обмен уже обработан');
  if (!accept) {
    trade.status = 'declined';
    room.lastAction = 'Обмен отклонён';
    return;
  }
  const from = findPlayer(room, trade.fromPlayerId);
  const to = findPlayer(room, trade.toPlayerId);
  validateTradePart(room, from.id, trade.give);
  validateTradePart(room, to.id, trade.receive);
  if (from.money < trade.give.money || to.money < trade.receive.money) throw new Error('Недостаточно денег для обмена');

  from.money -= trade.give.money;
  to.money += trade.give.money;
  to.money -= trade.receive.money;
  from.money += trade.receive.money;
  trade.give.properties.forEach(pos => { room.board[pos].owner = to.id; });
  trade.receive.properties.forEach(pos => { room.board[pos].owner = from.id; });
  trade.status = 'accepted';
  room.lastAction = `${from.name} и ${to.name} совершили обмен`;
}

function normalizeTradePart(part = {}) {
  return {
    properties: Array.isArray(part.properties) ? part.properties : [],
    money: Number(part.money || 0)
  };
}

function validateTradePart(room, ownerId, part) {
  if (part.money < 0) throw new Error('Сумма обмена не может быть отрицательной');
  part.properties.forEach(pos => {
    const cell = room.board[pos];
    if (!cell || !isPurchasable(cell)) throw new Error('Некорректная собственность');
    if (cell.owner !== ownerId) throw new Error('Нельзя обменять чужую собственность');
  });
}

function drawCard(room, player, cardType) {
  const deck = cardType === 'chance' ? room.chanceDeck : room.chestDeck;
  const card = deck.shift();
  room.lastCard = { cardType, card };
  if (card.effect !== 'jailCard') deck.push(card);

  if (card.effect === 'money') {
    player.money += card.amount;
    markBankruptIfNeeded(player);
  } else if (card.effect === 'gotoJail') {
    sendToJail(room, player);
  } else if (card.effect === 'jailCard') {
    player.getOutOfJailCards += 1;
  } else if (card.effect === 'moveTo') {
    if (card.pos === 0 && player.position !== 0) player.money += 200;
    player.position = card.pos;
  } else if (card.effect === 'moveBy') {
    player.position = (player.position + card.steps + 40) % 40;
  }

  room.lastAction = `${player.name}: ${card.text}`;
}

function handleLanding(room, player, dice) {
  const cell = room.board[player.position];

  if (cell.type === 'tax') {
    player.money -= cell.amount;
    markBankruptIfNeeded(player);
    room.lastAction = `${player.name} заплатил налог ${cell.amount}₽`;
    advanceTurn(room);
    return true;
  }

  if (cell.type === 'chance' || cell.type === 'chest') {
    drawCard(room, player, cell.type);
    if (!player.inJail) advanceTurn(room);
    else advanceTurn(room);
    return true;
  }

  if (isPurchasable(cell)) {
    if (!cell.owner) {
      room.pendingPurchase = { pos: cell.pos, playerId: player.id };
      room.turnPhase = 'action';
      room.lastAction = `${player.name} попал на ${cell.name}. Можно купить за ${cell.price}₽`;
      return true;
    }

    if (cell.owner !== player.id && !cell.mortgaged) {
      const owner = findPlayer(room, cell.owner);
      const rent = calculateRent(room, cell, dice);
      player.money -= rent;
      owner.money += rent;
      markBankruptIfNeeded(player);
      room.lastAction = `${player.name} заплатил аренду ${rent}₽ игроку ${owner.name}`;
      advanceTurn(room);
      return true;
    }
  }

  return false;
}

function ensureOwnProperty(cell, playerId) {
  if (!cell || !isPurchasable(cell)) throw new Error('Это не собственность');
  if (cell.owner !== playerId) throw new Error('Вы не владелец');
}

function ensureOwnStreet(cell, playerId) {
  ensureOwnProperty(cell, playerId);
  if (cell.type !== 'street') throw new Error('Дома строятся только на улицах');
}

function groupCells(room, cell) {
  return room.board.filter(c => c.type === 'street' && c.colorGroup === cell.colorGroup);
}

function ensureFullGroup(room, cell, playerId) {
  if (!groupCells(room, cell).every(c => c.owner === playerId && !c.mortgaged)) {
    throw new Error('Нужна вся цветовая группа без залога');
  }
}

function ensureEvenBuild(room, cell) {
  const group = groupCells(room, cell);
  const minHouses = Math.min(...group.map(c => c.houses || 0));
  if ((cell.houses || 0) > minHouses && cell.houses < 4) {
    throw new Error('Строить нужно равномерно');
  }
  if (cell.houses === 4 && group.some(c => c.houses < 4)) {
    throw new Error('Отель можно строить только после 4 домов на всей группе');
  }
}

function calculateRent(room, cell, dice) {
  if (cell.type === 'street') return cell.rent[cell.houses || 0];
  if (cell.type === 'railroad') {
    const count = room.board.filter(c => c.type === 'railroad' && c.owner === cell.owner).length;
    return cell.rentRailroad[Math.max(0, count - 1)];
  }
  if (cell.type === 'utility') {
    const count = room.board.filter(c => c.type === 'utility' && c.owner === cell.owner).length;
    return (count === 2 ? 10 : 4) * (dice[0] + dice[1]);
  }
  return 0;
}

function isPurchasable(cell) {
  return cell.type === 'street' || cell.type === 'railroad' || cell.type === 'utility';
}

function ensurePendingPurchase(room, playerId) {
  if (!room.pendingPurchase) throw new Error('Нет ожидающей покупки');
  if (room.pendingPurchase.playerId !== playerId) throw new Error('Не ваша покупка');
}

function findPlayer(room, playerId) {
  const player = room.players.find(p => p.id === playerId);
  if (!player) throw new Error('Игрок не найден');
  return player;
}

function markBankruptIfNeeded(player) {
  if (player.money < 0) player.bankrupt = true;
}

function sendToJail(room, player) {
  player.position = 10;
  player.inJail = true;
  player.jailTurns = 0;
  room.doublesCount = 0;
  room.pendingPurchase = null;
  room.turnPhase = 'roll';
}

function randomDice() {
  return [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
}

function advanceTurn(room) {
  const active = room.players.filter(p => !p.bankrupt);
  const currentIndex = active.findIndex(p => p.id === room.currentPlayerId);
  const nextIndex = (currentIndex + 1) % active.length;
  room.currentPlayerId = active[nextIndex].id;
  room.turnPhase = 'roll';
}

module.exports = {
  startRoomGame,
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
  respondTrade,
  calculateRent
};
