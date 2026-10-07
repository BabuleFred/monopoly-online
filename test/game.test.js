const test = require('node:test');
const assert = require('node:assert');
const {
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
  respondTrade
} = require('../server/game');

function roomWithPlayers() {
  return {
    code: 'ABC123',
    state: 'lobby',
    players: [
      { id: 'p1', name: 'Ваня', token: 'hat', isHost: true, online: true, color: '#e74c3c' },
      { id: 'p2', name: 'Маша', token: 'car', isHost: false, online: true, color: '#2ecc71' }
    ],
    board: null,
    currentPlayerId: null,
    turnPhase: null,
    log: []
  };
}

test('startRoomGame initializes full game state', () => {
  const room = roomWithPlayers();
  startRoomGame(room);

  assert.equal(room.state, 'playing');
  assert.equal(room.board.length, 40);
  assert.equal(room.currentPlayerId, 'p1');
  assert.equal(room.turnPhase, 'roll');
  assert.equal(room.dice, null);
  assert.equal(room.doublesCount, 0);
  assert.equal(room.bankHouses, 32);
  assert.equal(room.bankHotels, 12);
  assert.equal(room.auction, null);
  assert.equal(room.pendingPurchase, null);

  room.players.forEach(player => {
    assert.equal(player.money, 1500);
    assert.equal(player.position, 0);
    assert.equal(player.inJail, false);
    assert.equal(player.jailTurns, 0);
    assert.equal(player.getOutOfJailCards, 0);
    assert.equal(player.bankrupt, false);
  });
});

test('rollDiceForPlayer moves current player by dice sum and advances turn on non-action cell', () => {
  const room = roomWithPlayers();
  startRoomGame(room);

  const result = rollDiceForPlayer(room, 'p1', () => [3, 4]);

  assert.deepEqual(result.dice, [3, 4]);
  assert.equal(room.players[0].position, 7);
  assert.equal(room.dice[0], 3);
  assert.equal(room.dice[1], 4);
  assert.equal(room.currentPlayerId, 'p2');
  assert.equal(room.turnPhase, 'roll');
});

test('rollDiceForPlayer rejects non-current player', () => {
  const room = roomWithPlayers();
  startRoomGame(room);

  assert.throws(() => rollDiceForPlayer(room, 'p2', () => [1, 1]), /не ваш ход/i);
});

test('rollDiceForPlayer gives 200 when passing Start', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.players[0].position = 38;

  rollDiceForPlayer(room, 'p1', () => [1, 2]);

  assert.equal(room.players[0].position, 1);
  assert.equal(room.players[0].money, 1700);
});

test('rollDiceForPlayer sends player to jail when landing on cell 30', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.players[0].position = 28;

  rollDiceForPlayer(room, 'p1', () => [1, 1]);

  assert.equal(room.players[0].position, 10);
  assert.equal(room.players[0].inJail, true);
  assert.equal(room.players[0].jailTurns, 0);
  assert.equal(room.currentPlayerId, 'p2');
});

test('landing on unowned property creates pending purchase and action phase', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.players[0].position = 38;

  rollDiceForPlayer(room, 'p1', () => [1, 2]);

  assert.equal(room.players[0].position, 1);
  assert.equal(room.pendingPurchase.pos, 1);
  assert.equal(room.pendingPurchase.playerId, 'p1');
  assert.equal(room.turnPhase, 'action');
  assert.equal(room.currentPlayerId, 'p1');
});

test('buyProperty subtracts money, assigns owner, clears pending purchase, and advances turn', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.players[0].position = 38;
  rollDiceForPlayer(room, 'p1', () => [1, 2]);

  buyProperty(room, 'p1');

  assert.equal(room.board[1].owner, 'p1');
  assert.equal(room.players[0].money, 1640); // 1500 + 200 за Старт - 60 цена
  assert.equal(room.pendingPurchase, null);
  assert.equal(room.turnPhase, 'roll');
  assert.equal(room.currentPlayerId, 'p2');
});

test('declinePurchase starts auction for declined property', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.players[0].position = 38;
  rollDiceForPlayer(room, 'p1', () => [1, 2]);

  declinePurchase(room, 'p1');

  assert.equal(room.board[1].owner, null);
  assert.equal(room.pendingPurchase, null);
  assert.equal(room.turnPhase, 'auction');
  assert.equal(room.auction.propertyPos, 1);
  assert.deepEqual(room.auction.activePlayers, ['p1', 'p2']);
});

test('bidAuction and passAuction award property to highest bidder', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.players[0].position = 38;
  rollDiceForPlayer(room, 'p1', () => [1, 2]);
  declinePurchase(room, 'p1');

  bidAuction(room, 'p2', 70);
  passAuction(room, 'p1');

  assert.equal(room.board[1].owner, 'p2');
  assert.equal(room.players[1].money, 1430);
  assert.equal(room.auction, null);
  assert.equal(room.turnPhase, 'roll');
  assert.equal(room.currentPlayerId, 'p2');
});

test('tax cells subtract tax amount and advance turn', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.players[0].position = 1;

  rollDiceForPlayer(room, 'p1', () => [1, 2]);

  assert.equal(room.players[0].position, 4);
  assert.equal(room.players[0].money, 1300);
  assert.equal(room.currentPlayerId, 'p2');
  assert.equal(room.turnPhase, 'roll');
});

test('player becomes bankrupt when money drops below zero', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.players[0].money = 50;
  room.players[0].position = 1;

  rollDiceForPlayer(room, 'p1', () => [1, 2]);

  assert.equal(room.players[0].money, -150);
  assert.equal(room.players[0].bankrupt, true);
});

test('owned street charges base rent to owner and advances turn', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.board[1].owner = 'p2';
  room.players[0].position = 38;

  rollDiceForPlayer(room, 'p1', () => [1, 2]);

  assert.equal(room.players[0].position, 1);
  assert.equal(room.players[0].money, 1698); // +200 Старт - 2 аренда
  assert.equal(room.players[1].money, 1502);
  assert.equal(room.currentPlayerId, 'p2');
  assert.equal(room.turnPhase, 'roll');
});

test('endTurn can finish current player when no pending purchase exists', () => {
  const room = roomWithPlayers();
  startRoomGame(room);

  endTurn(room, 'p1');

  assert.equal(room.currentPlayerId, 'p2');
  assert.equal(room.turnPhase, 'roll');
});

test('buildHouse requires full color group and uses bank houses', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.board[1].owner = 'p1';
  room.board[3].owner = 'p1';

  buildHouse(room, 'p1', 1);

  assert.equal(room.board[1].houses, 1);
  assert.equal(room.players[0].money, 1450);
  assert.equal(room.bankHouses, 31);
  assert.throws(() => buildHouse(room, 'p1', 1), /равномер/i);
});

test('buildHouse upgrades four houses to hotel using bank hotel and returning houses', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.board[1].owner = 'p1';
  room.board[3].owner = 'p1';
  room.board[1].houses = 4;
  room.board[3].houses = 4;
  room.bankHouses = 24;

  buildHouse(room, 'p1', 1);

  assert.equal(room.board[1].houses, 5);
  assert.equal(room.players[0].money, 1450);
  assert.equal(room.bankHouses, 28);
  assert.equal(room.bankHotels, 11);
});

test('sellHouse sells one house for half price and returns it to bank', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.board[1].owner = 'p1';
  room.board[3].owner = 'p1';
  room.board[1].houses = 1;
  room.bankHouses = 31;

  sellHouse(room, 'p1', 1);

  assert.equal(room.board[1].houses, 0);
  assert.equal(room.players[0].money, 1525);
  assert.equal(room.bankHouses, 32);
});

test('mortgage and unmortgage property updates money and mortgaged flag', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.board[1].owner = 'p1';

  mortgageProperty(room, 'p1', 1);
  assert.equal(room.board[1].mortgaged, true);
  assert.equal(room.players[0].money, 1530);

  unmortgageProperty(room, 'p1', 1);
  assert.equal(room.board[1].mortgaged, false);
  assert.equal(room.players[0].money, 1497);
});

test('startRoomGame initializes chance and chest decks', () => {
  const room = roomWithPlayers();
  startRoomGame(room);

  assert.equal(room.chanceDeck.length, 16);
  assert.equal(room.chestDeck.length, 16);
});

test('landing on chance applies money card and advances turn', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.players[0].position = 4;
  room.chanceDeck = [{ text: 'Банк платит вам 50₽', effect: 'money', amount: 50 }];

  rollDiceForPlayer(room, 'p1', () => [1, 2]);

  assert.equal(room.players[0].position, 7);
  assert.equal(room.players[0].money, 1550);
  assert.equal(room.currentPlayerId, 'p2');
});

test('landing on chance gotoJail sends player to jail', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.players[0].position = 4;
  room.chanceDeck = [{ text: 'Отправляйтесь в тюрьму', effect: 'gotoJail' }];

  rollDiceForPlayer(room, 'p1', () => [1, 2]);

  assert.equal(room.players[0].position, 10);
  assert.equal(room.players[0].inJail, true);
  assert.equal(room.currentPlayerId, 'p2');
});

test('payJailFine releases player from jail', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.players[0].inJail = true;
  room.players[0].position = 10;

  payJailFine(room, 'p1');

  assert.equal(room.players[0].inJail, false);
  assert.equal(room.players[0].money, 1450);
  assert.equal(room.currentPlayerId, 'p1');
});

test('useJailCard releases player and consumes a card', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.players[0].inJail = true;
  room.players[0].position = 10;
  room.players[0].getOutOfJailCards = 1;

  useJailCard(room, 'p1');

  assert.equal(room.players[0].inJail, false);
  assert.equal(room.players[0].getOutOfJailCards, 0);
});

test('proposeTrade stores a pending trade', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.board[1].owner = 'p1';

  const trade = proposeTrade(room, 'p1', {
    toPlayerId: 'p2',
    give: { properties: [1], money: 100 },
    receive: { properties: [], money: 200 }
  });

  assert.equal(room.trades.length, 1);
  assert.equal(trade.fromPlayerId, 'p1');
  assert.equal(trade.status, 'pending');
});

test('respondTrade accept transfers money and properties', () => {
  const room = roomWithPlayers();
  startRoomGame(room);
  room.board[1].owner = 'p1';
  const trade = proposeTrade(room, 'p1', {
    toPlayerId: 'p2',
    give: { properties: [1], money: 100 },
    receive: { properties: [], money: 200 }
  });

  respondTrade(room, 'p2', trade.id, true);

  assert.equal(room.board[1].owner, 'p2');
  assert.equal(room.players[0].money, 1600);
  assert.equal(room.players[1].money, 1400);
  assert.equal(trade.status, 'accepted');
});
