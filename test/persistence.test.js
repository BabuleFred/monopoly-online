const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { saveRooms, loadRooms } = require('../server/persistence');

test('saveRooms and loadRooms persist room map', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'monopoly-'));
  const file = path.join(dir, 'game-state.json');
  const store = new Map();
  store.set('ABC123', {
    code: 'ABC123',
    state: 'playing',
    players: [{ id: 'p1', name: 'Ваня', money: 1500 }],
    board: [{ pos: 0, name: 'Старт' }]
  });

  saveRooms(file, store);
  const loaded = loadRooms(file);

  assert.equal(loaded.size, 1);
  assert.equal(loaded.get('ABC123').players[0].name, 'Ваня');
  assert.equal(loaded.get('ABC123').state, 'playing');
});

test('loadRooms returns empty map when file is missing', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'monopoly-'));
  const file = path.join(dir, 'missing.json');

  const loaded = loadRooms(file);

  assert.equal(loaded.size, 0);
});
