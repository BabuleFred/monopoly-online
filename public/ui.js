// ui.js — переключение экранов, обработка лобби и игрового экрана.
import { drawBoard, getCellAtCoordinates } from './board.js';

const TOKENS = ['hat', 'car', 'dog', 'ship', 'boot', 'thimble', 'cat', 'wheelbarrow'];
const TOKEN_NAMES = {
  hat: 'Шляпа',
  car: 'Машина',
  dog: 'Собака',
  ship: 'Корабль',
  boot: 'Башмак',
  thimble: 'Напёрсток',
  cat: 'Кот',
  wheelbarrow: 'Тачка'
};

const $ = (id) => document.getElementById(id);
let currentRoom = null;
let tooltipElement = null;

function fillTokens(select) {
  TOKENS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = TOKEN_NAMES[t];
    select.appendChild(opt);
  });
}
fillTokens($('create-token'));
fillTokens($('join-token'));

function showScreen(id) {
  ['screen-entry', 'screen-lobby', 'screen-game'].forEach(s => $(s).classList.add('hidden'));
  $(id).classList.remove('hidden');
}

// Табы входа
$('tab-create').onclick = () => {
  $('tab-create').classList.add('active');
  $('tab-join').classList.remove('active');
  $('form-create').classList.remove('hidden');
  $('form-join').classList.add('hidden');
  $('entry-error').classList.add('hidden');
};
$('tab-join').onclick = () => {
  $('tab-join').classList.add('active');
  $('tab-create').classList.remove('active');
  $('form-join').classList.remove('hidden');
  $('form-create').classList.add('hidden');
  $('entry-error').classList.add('hidden');
};

function err(msg) {
  const e = $('entry-error');
  e.textContent = msg;
  e.classList.remove('hidden');
}

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
  const ul = $('lobby-players');
  ul.innerHTML = '';
  p.players.forEach(pl => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${pl.name} <span class="hint">(${TOKEN_NAMES[pl.token] || pl.token})</span></span>${pl.isHost ? '<b>хост</b>' : ''}`;
    ul.appendChild(li);
  });
  $('btn-start').disabled = !p.canStart;
  $('lobby-hint').classList.toggle('hidden', p.canStart);
});
Net.on('error', (p) => err(p.message));
Net.on('diceResult', (p) => {
  $('dice-value').textContent = p.dice.join(' + ');
});
Net.on('gameState', (p) => renderGame(p.room));

$('btn-start').onclick = () => {
  Net.send('startGame', {});
};

$('btn-roll').onclick = () => {
  Net.send('rollDice', {});
};

$('btn-buy').onclick = () => {
  Net.send('buyProperty', {});
};

$('btn-decline').onclick = () => {
  Net.send('declineBuy', {});
};

$('btn-pay-jail').onclick = () => {
  Net.send('payJailFine', {});
};

$('btn-use-jail-card').onclick = () => {
  Net.send('useJailCard', {});
};

$('btn-bid').onclick = () => {
  const amount = Number($('auction-bid').value);
  if (amount > 0) Net.send('bid', { amount });
};

$('btn-pass-bid').onclick = () => {
  Net.send('passBid', {});
};

function renderGame(room) {
  currentRoom = room;
  showScreen('screen-game');

  const session = loadSession() || {};
  const current = room.players.find(x => x.id === room.currentPlayerId);
  const me = room.players.find(x => x.id === session.playerId);
  $('game-state-info').textContent = `Ходит: ${current ? current.name : '?'}${me ? ` | Вы: ${me.name}` : ''}`;
  $('game-last-action').textContent = room.lastAction || '';
  $('dice-value').textContent = room.dice ? room.dice.join(' + ') : '—';
  $('btn-roll').disabled = room.state !== 'playing' || room.currentPlayerId !== session.playerId || room.turnPhase !== 'roll';

  renderPropertyActions(room, session.playerId);
  renderJailActions(room, session.playerId);
  renderAuctionActions(room, session.playerId);

  const ul = $('game-players');
  ul.innerHTML = '';
  room.players.forEach(player => {
    const space = room.board[player.position];
    const li = document.createElement('li');
    li.classList.toggle('current-player', player.id === room.currentPlayerId);
    // Hide money for other players
    const moneyText = (player.id === session.playerId) ? 
      `${player.money}₽` : 
      '???';
    li.innerHTML = `
      <span>
        <strong style="color:${player.color}">${player.name}</strong>
        <span class="player-pos">${space ? space.name : 'Старт'}${player.inJail ? ' (в тюрьме)' : ''}</span>
      </span>
      <span class="player-money">${moneyText}</span>`;
    ul.appendChild(li);
  });

  renderOwnedProperties(room, session.playerId);
  renderTrades(room, session.playerId);
  drawBoard($('board-canvas'), room);
  
  // Add mouse event listeners to canvas for tooltips
  const canvas = $('board-canvas');
  canvas.removeEventListener('mousemove', handleCanvasMouseMove);
  canvas.removeEventListener('mouseout', handleCanvasMouseOut);
  canvas.addEventListener('mousemove', handleCanvasMouseMove);
  canvas.addEventListener('mouseout', handleCanvasMouseOut);
}

// Mouse event handlers for canvas tooltips
function handleCanvasMouseMove(event) {
  if (!currentRoom) return;
  
  const canvas = $('board-canvas');
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Find the cell under the mouse
  const size = Math.min(canvas.clientWidth || 720, 720);
  const cellSize = size / 11;
  
  // Use the new function from board.js
  const pos = getCellAtCoordinates(x, y, cellSize);
  
  if (pos >= 0 && pos < currentRoom.board.length) {
    const cell = currentRoom.board[pos];
    if (cell && (cell.type === 'street' || cell.type === 'railroad' || cell.type === 'utility')) {
      showTooltip(event, cell, currentRoom);
      return;
    }
  }
  
  // Hide tooltip if not over a property cell
  hideTooltip();
}

function handleCanvasMouseOut() {
  hideTooltip();
}

function renderTrades(room, myPlayerId) {
  const ul = $('trade-list');
  ul.innerHTML = '';
  const trades = (room.trades || []).filter(t => t.status === 'pending' && (t.fromPlayerId === myPlayerId || t.toPlayerId === myPlayerId));
  if (!trades.length) {
    const li = document.createElement('li');
    li.textContent = 'Нет активных предложений';
    ul.appendChild(li);
    return;
  }
  trades.forEach(trade => {
    const from = room.players.find(p => p.id === trade.fromPlayerId)?.name || '?';
    const to = room.players.find(p => p.id === trade.toPlayerId)?.name || '?';
    const li = document.createElement('li');
    const text = document.createElement('span');
    text.textContent = `${from} → ${to}: отдаёт ${trade.give.money}₽/${trade.give.properties.length} объектов, получает ${trade.receive.money}₽/${trade.receive.properties.length} объектов`;
    li.appendChild(text);
    if (trade.toPlayerId === myPlayerId) {
      const buttons = document.createElement('span');
      buttons.className = 'property-buttons';
      buttons.appendChild(actionButton('принять', () => Net.send('respondTrade', { tradeId: trade.id, accept: true })));
      buttons.appendChild(actionButton('отклонить', () => Net.send('respondTrade', { tradeId: trade.id, accept: false })));
      li.appendChild(buttons);
    }
    ul.appendChild(li);
  });
}

function renderOwnedProperties(room, myPlayerId) {
  const ul = $('owned-properties');
  ul.innerHTML = '';
  const owned = room.board.filter(cell => cell.owner === myPlayerId);
  if (!owned.length) {
    const li = document.createElement('li');
    li.textContent = 'Пока ничего нет';
    ul.appendChild(li);
    return;
  }

  // Group properties by color
  const propertyGroups = {};
  room.board.forEach(cell => {
    if (cell.type === 'street' && cell.colorGroup) {
      if (!propertyGroups[cell.colorGroup]) {
        propertyGroups[cell.colorGroup] = [];
      }
      propertyGroups[cell.colorGroup].push(cell);
    }
  });

  // Find monopolies (all properties in a group owned by the same player)
  const monopolies = {};
  Object.keys(propertyGroups).forEach(color => {
    const group = propertyGroups[color];
    const owners = [...new Set(group.map(cell => cell.owner))];
    // If all properties in the group have the same owner (and that owner is not null)
    if (owners.length === 1 && owners[0] !== undefined) {
      monopolies[color] = owners[0];
    }
  });

  owned.forEach(cell => {
    const li = document.createElement('li');
    
    // Check if this property is part of a monopoly
    let monopolyInfo = '';
    if (cell.type === 'street' && cell.colorGroup && monopolies[cell.colorGroup] === myPlayerId) {
      monopolyInfo = ' <span style="color:#2ecc71;">★ монополия</span>';
    }
    
    const title = document.createElement('span');
    title.innerHTML = `<strong>${cell.name}</strong>${monopolyInfo}<br><span class="player-pos">${cell.mortgaged ? 'заложено' : 'активно'}${cell.type === 'street' ? `, строений: ${cell.houses}` : ''}</span>`;
    const buttons = document.createElement('span');
    buttons.className = 'property-buttons';

    if (cell.type === 'street') {
      buttons.appendChild(actionButton('+дом', () => Net.send('buildHouse', { pos: cell.pos })));
      buttons.appendChild(actionButton('-дом', () => Net.send('sellHouse', { pos: cell.pos })));
    }
    buttons.appendChild(actionButton(cell.mortgaged ? 'выкуп' : 'залог', () => {
      Net.send(cell.mortgaged ? 'unmortgage' : 'mortgage', { pos: cell.pos });
    }));

    li.appendChild(title);
    li.appendChild(buttons);
    ul.appendChild(li);
  });
}

function actionButton(text, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.onclick = onClick;
  return button;
}

function renderAuctionActions(room, myPlayerId) {
  const box = $('auction-actions');
  if (!room.auction) {
    box.classList.add('hidden');
    return;
  }
  const cell = room.board[room.auction.propertyPos];
  const highest = room.auction.highestBidderId
    ? room.players.find(p => p.id === room.auction.highestBidderId)?.name
    : 'нет';
  $('auction-info').textContent = `Аукцион: ${cell.name}. Текущая ставка ${room.auction.highestBid}₽ (${highest})`;
  $('auction-bid').value = Math.max(10, room.auction.highestBid + 10);
  const active = room.auction.activePlayers.includes(myPlayerId);
  $('btn-bid').disabled = !active;
  $('btn-pass-bid').disabled = !active;
  box.classList.remove('hidden');
}

function renderJailActions(room, myPlayerId) {
  const box = $('jail-actions');
  const me = room.players.find(p => p.id === myPlayerId);
  if (!me || !me.inJail || room.currentPlayerId !== myPlayerId) {
    box.classList.add('hidden');
    return;
  }
  box.classList.remove('hidden');
  $('btn-pay-jail').disabled = me.money < 50;
  $('btn-use-jail-card').disabled = me.getOutOfJailCards <= 0;
}

function renderPropertyActions(room, myPlayerId) {
  const box = $('property-actions');
  const offer = $('property-offer');
  const pending = room.pendingPurchase;
  if (!pending || pending.playerId !== myPlayerId) {
    box.classList.add('hidden');
    return;
  }

  const cell = room.board[pending.pos];
  const me = room.players.find(p => p.id === myPlayerId);
  box.classList.remove('hidden');
  offer.textContent = `${cell.name}: купить за ${cell.price}₽? У вас ${me ? me.money : 0}₽.`;
  $('btn-buy').disabled = !me || me.money < cell.price;
}

window.addEventListener('resize', () => {
  if (currentRoom) drawBoard($('board-canvas'), currentRoom);
});

// Create tooltip element
function createTooltip() {
  if (tooltipElement) return;
  tooltipElement = document.createElement('div');
  tooltipElement.style.position = 'fixed';
  tooltipElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  tooltipElement.style.color = 'white';
  tooltipElement.style.padding = '8px 12px';
  tooltipElement.style.borderRadius = '4px';
  tooltipElement.style.fontSize = '14px';
  tooltipElement.style.zIndex = '1000';
  tooltipElement.style.pointerEvents = 'none';
  tooltipElement.style.display = 'none';
  tooltipElement.style.maxWidth = '300px';
  document.body.appendChild(tooltipElement);
}

// Show tooltip with property info
function showTooltip(event, cell, room) {
  if (!tooltipElement) createTooltip();
  
  // Get owner name if exists
  let ownerName = 'никто';
  if (cell.owner) {
    const owner = room.players.find(p => p.id === cell.owner);
    ownerName = owner ? owner.name : 'неизвестный игрок';
  }
  
  let content = `<strong>${cell.name}</strong><br>`;
  
  if (cell.type === 'street') {
    content += `Аренда: ${cell.rent}₽<br>`;
    if (cell.houseRents) {
      for (let i = 0; i < cell.houseRents.length; i++) {
        content += `Аренда с ${i+1} домом: ${cell.houseRents[i]}₽<br>`;
      }
    }
    content += `Аренда при монополии: ${cell.monopolyRent}₽<br>`;
    content += `Цена дома: ${cell.housePrice}₽<br>`;
  } else if (cell.type === 'railroad') {
    content += `Аренда: ${cell.rent}₽<br>`;
  } else if (cell.type === 'utility') {
    content += `Аренда: 4x или 10x ставка кубиков<br>`;
  }
  
  content += `Собственник: ${ownerName}<br>`;
  if (cell.mortgaged) {
    content += 'Заложено<br>';
  }
  
  tooltipElement.innerHTML = content;
  tooltipElement.style.display = 'block';
  tooltipElement.style.left = (event.pageX + 10) + 'px';
  tooltipElement.style.top = (event.pageY + 10) + 'px';
}

// Hide tooltip
function hideTooltip() {
  if (tooltipElement) {
    tooltipElement.style.display = 'none';
  }
}
