const test = require('node:test');
const assert = require('node:assert');
const { buildTunnelCommand } = require('../server/tunnel');

test('buildTunnelCommand creates ngrok command by default', () => {
  assert.equal(buildTunnelCommand({ port: 3000 }), 'ngrok http 3000');
});

test('buildTunnelCommand supports cloudflared over http2', () => {
  assert.equal(buildTunnelCommand({ tool: 'cloudflared', port: 3001 }), 'cloudflared tunnel --protocol http2 --url http://localhost:3001');
});
