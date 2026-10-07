// net.js — WebSocket-клиент. Хранит code/playerId в localStorage, переподключается.
const Net = {
  ws: null,
  handlers: {},
  connect() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    this.ws = new WebSocket(`${proto}://${location.host}`);
    this.ws.onopen = () => {
      const session = loadSession();
      if (session && session.code && session.playerId) {
        this.send('reconnect', { code: session.code, playerId: session.playerId });
      }
    };
    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      (this.handlers[msg.type] || []).forEach(h => h(msg.payload));
    };
    this.ws.onclose = () => {
      setTimeout(() => this.connect(), 1500);
    };
  },
  send(type, payload) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ type, payload }));
  },
  on(type, fn) {
    (this.handlers[type] = this.handlers[type] || []).push(fn);
  }
};

function saveSession(s) {
  localStorage.setItem('monopoly', JSON.stringify(s));
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem('monopoly'));
  } catch {
    return null;
  }
}

Net.connect();
