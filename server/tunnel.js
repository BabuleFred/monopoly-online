function buildTunnelCommand({ tool = 'ngrok', port = 3000 } = {}) {
  if (tool === 'cloudflared') return `cloudflared tunnel --protocol http2 --url http://localhost:${port}`;
  return `ngrok http ${port}`;
}

module.exports = { buildTunnelCommand };
