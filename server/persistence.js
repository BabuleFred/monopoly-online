// persistence.js — сохранение и восстановление комнат из JSON-файла.
const fs = require('fs');
const path = require('path');

function saveRooms(filePath, store) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const rooms = Array.from(store.entries());
  fs.writeFileSync(filePath, JSON.stringify({ rooms }, null, 2), 'utf8');
}

function loadRooms(filePath) {
  if (!fs.existsSync(filePath)) return new Map();
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.trim()) return new Map();
  const data = JSON.parse(raw);
  return new Map(data.rooms || []);
}

function createPersistence(filePath, store, delayMs = 500) {
  let timer = null;

  function scheduleSave() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      saveRooms(filePath, store);
    }, delayMs);
  }

  function saveImmediately() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    saveRooms(filePath, store);
  }

  return { scheduleSave, saveImmediately };
}

module.exports = { saveRooms, loadRooms, createPersistence };
