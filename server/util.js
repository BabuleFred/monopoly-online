const crypto = require('crypto');

function randomCode(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function makePlayerId() {
  return 'p' + crypto.randomBytes(3).toString('hex');
}

module.exports = { randomCode, makePlayerId };
