const test = require('node:test');
const assert = require('node:assert');
const { getAccessUrls, classifyAddress } = require('../server/network');

test('getAccessUrls includes localhost and non-internal IPv4 addresses', () => {
  const urls = getAccessUrls(3000, {
    WiFi: [
      { family: 'IPv4', internal: false, address: '192.168.1.50' },
      { family: 'IPv6', internal: false, address: 'fe80::1' }
    ],
    Loopback: [
      { family: 'IPv4', internal: true, address: '127.0.0.1' }
    ]
  });

  assert.deepEqual(urls, [
    'http://localhost:3000',
    'http://192.168.1.50:3000'
  ]);
});

test('classifyAddress labels likely useful WiFi addresses', () => {
  assert.equal(classifyAddress('http://localhost:3000'), 'этот ПК');
  assert.equal(classifyAddress('http://192.168.1.50:3000'), 'локальная сеть/WiFi');
  assert.equal(classifyAddress('http://172.20.1.5:3000'), 'локальная сеть/WiFi');
  assert.equal(classifyAddress('http://198.18.0.1:3000'), 'виртуальный/VPN адаптер — обычно не нужен');
});
