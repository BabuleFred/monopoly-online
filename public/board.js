// board.js — отрисовка квадратного поля и фишек игроков на Canvas.
const GROUP_COLORS = {
  brown: '#8b4513',
  lightblue: '#8fd3ff',
  pink: '#d65a9e',
  orange: '#f39c12',
  red: '#d63031',
  yellow: '#f9e79f',
  green: '#27ae60',
  darkblue: '#34495e'
};

function drawBoard(canvas, room) {
  if (!canvas || !room || !room.board) return;
  const ctx = canvas.getContext('2d');
  const size = Math.min(canvas.clientWidth || 720, 720);
  canvas.width = size;
  canvas.height = size;
  const cell = size / 11;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#f7f1df';
  ctx.fillRect(0, 0, size, size);

  room.board.forEach(space => drawCell(ctx, space, cell));
  drawCenter(ctx, size);
  drawPlayers(ctx, room.players, cell);
}

function drawCell(ctx, space, cell) {
  const { x, y } = cellPosition(space.pos, cell);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#fff8e7';
  ctx.fillRect(x, y, cell, cell);
  ctx.strokeRect(x, y, cell, cell);

  if (space.colorGroup) {
    ctx.fillStyle = GROUP_COLORS[space.colorGroup] || '#ccc';
    ctx.fillRect(x + 2, y + 2, cell - 4, Math.max(6, cell * 0.16));
  } else if (space.type === 'railroad') {
    ctx.fillStyle = '#333';
    ctx.fillRect(x + 2, y + 2, cell - 4, Math.max(6, cell * 0.16));
  } else if (space.type === 'chance') {
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(x + 2, y + 2, cell - 4, Math.max(6, cell * 0.16));
  } else if (space.type === 'chest') {
    ctx.fillStyle = '#3498db';
    ctx.fillRect(x + 2, y + 2, cell - 4, Math.max(6, cell * 0.16));
  } else if (space.type === 'gotojail' || space.type === 'tax') {
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x + 2, y + 2, cell - 4, Math.max(6, cell * 0.16));
  }

  ctx.save();
  ctx.fillStyle = '#111';
  ctx.font = `${Math.max(8, cell * 0.12)}px system-ui, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = shortName(space.name);
  wrapText(ctx, label, x + cell / 2, y + cell * 0.55, cell - 8, cell * 0.15);
  ctx.restore();
}

function drawCenter(ctx, size) {
  ctx.fillStyle = '#1b1b2b';
  ctx.fillRect(size / 11, size / 11, size * 9 / 11, size * 9 / 11);
  ctx.fillStyle = '#e74c3c';
  ctx.font = `${size * 0.07}px system-ui, Arial`;
  ctx.textAlign = 'center';
  ctx.fillText('МОНОПОЛИЯ', size / 2, size / 2);
}

function drawPlayers(ctx, players, cell) {
  players.forEach((player, idx) => {
    const { x, y } = cellPosition(player.position || 0, cell);
    const offsetX = (idx % 3) * cell * 0.22 + cell * 0.2;
    const offsetY = Math.floor(idx / 3) * cell * 0.22 + cell * 0.72;
    ctx.beginPath();
    ctx.fillStyle = player.color || '#e74c3c';
    ctx.arc(x + offsetX, y + offsetY, cell * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.stroke();
  });
}

function cellPosition(pos, cell) {
  if (pos === 0) return { x: cell * 10, y: cell * 10 };
  if (pos < 10) return { x: cell * (10 - pos), y: cell * 10 };
  if (pos === 10) return { x: 0, y: cell * 10 };
  if (pos < 20) return { x: 0, y: cell * (20 - pos) };
  if (pos === 20) return { x: 0, y: 0 };
  if (pos < 30) return { x: cell * (pos - 20), y: 0 };
  if (pos === 30) return { x: cell * 10, y: 0 };
  return { x: cell * 10, y: cell * (pos - 30) };
}

// Function to get cell position from coordinates
function getCellAtCoordinates(x, y, cellSize) {
  // Convert coordinates to grid position
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  
  // Determine cell position based on Monopoly board layout
  let pos = -1;
  if (row === 0) {
    // Top row (right to left)
    pos = 20 - col;
  } else if (row === 10) {
    // Bottom row (left to right)
    pos = 21 + col;
  } else if (col === 0) {
    // Left column (bottom to top)
    pos = 41 - row;
  } else if (col === 10) {
    // Right column (top to bottom)
    pos = 1 + row;
  }
  
  return pos;
}

function shortName(name) {
  return name.replace('Общественная казна', 'Казна').replace('Водопроводная станция', 'Водопровод');
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach(word => {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, x, y + (i - 1) * lineHeight));
}
