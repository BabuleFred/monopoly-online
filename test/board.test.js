const test = require('node:test');
const assert = require('node:assert');
const { createBoard } = require('../server/board');

test('board has 40 cells with positions 0-39', () => {
  const board = createBoard();
  assert.equal(board.length, 40);
  board.forEach((cell, index) => assert.equal(cell.pos, index));
});

test('board contains key Russian Monopoly cells', () => {
  const board = createBoard();
  assert.deepEqual({ name: board[0].name, type: board[0].type }, { name: 'Старт', type: 'go' });
  assert.deepEqual({ name: board[5].name, type: board[5].type }, { name: 'Рижский вокзал', type: 'railroad' });
  assert.deepEqual({ name: board[12].name, type: board[12].type }, { name: 'Электростанция', type: 'utility' });
  assert.deepEqual({ name: board[28].name, type: board[28].type }, { name: 'Водопроводная станция', type: 'utility' });
  assert.deepEqual({ name: board[29].name, type: board[29].type }, { name: 'ул. Мира', type: 'street' });
  assert.deepEqual({ name: board[30].name, type: board[30].type }, { name: 'Арест', type: 'gotojail' });
  assert.deepEqual({ name: board[38].name, type: board[38].type }, { name: 'Налог на роскошь', type: 'tax' });
});

test('board has classic purchasable groups', () => {
  const board = createBoard();
  assert.equal(board.filter(c => c.type === 'street').length, 22);
  assert.equal(board.filter(c => c.type === 'railroad').length, 4);
  assert.equal(board.filter(c => c.type === 'utility').length, 2);
  assert.equal(board.filter(c => c.type === 'chance').length, 3);
  assert.equal(board.filter(c => c.type === 'chest').length, 3);
});
