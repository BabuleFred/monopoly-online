const os = require('os');

function getAccessUrls(port, interfaces = os.networkInterfaces()) {
  const urls = [`http://localhost:${port}`];
  for (const entries of Object.values(interfaces)) {
    for (const info of entries || []) {
      if (info.family === 'IPv4' && !info.internal) {
        urls.push(`http://${info.address}:${port}`);
      }
    }
  }
  return urls;
}

function classifyAddress(url) {
  if (url.includes('localhost')) return 'этот ПК';
  if (url.includes('192.168.') || url.includes('10.') || url.match(/http:\/\/172\.(1[6-9]|2\d|3[0-1])\./)) {
    return 'локальная сеть/WiFi';
  }
  return 'виртуальный/VPN адаптер — обычно не нужен';
}

module.exports = { getAccessUrls, classifyAddress };
