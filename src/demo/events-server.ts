import { off } from 'process';

const idleTimeout = 8000;
const pingInterval = 4000;

export class EventsServer {
  ws!: WebSocket;
  reconnectTimeout?: NodeJS.Timeout;
  messages = [];
  events = {
    message: [] as any[],
  };

  constructor() {
    this.connect();
  }

  reconnect() {
    this.ws?.close();
    this.connect();
  }

  setupTimeout() {
    return setTimeout(this.reconnect.bind(this), idleTimeout);
  }

  private connect() {
    this.reconnectTimeout = this.setupTimeout();
    this.ws = new WebSocket('wss://' + location.host);

    this.ws.onmessage = this.message.bind(this);
  }

  send(data) {
    this.ws.send(JSON.stringify(data));
  }

  private message(event: MessageEvent<Blob>) {
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = this.setupTimeout();

    if (event.data.size === 0) {
      this.ws.send(event.data);
      // console.count('ping');
      return;
    }

    this.events.message.forEach(callback => {
      callback(event.data);
    });
  }

  on(event: 'message', callback: () => void) {
    if (event === 'message') {
      this.events.message.push(callback);
    }
  }

  off(callback: () => void) {
    const index = this.events.message.indexOf(callback);
    if (index === -1) {
      throw new Error('callback not found');
    }
    this.events.message.splice(index, 1);
  }

  destroy() {
    clearTimeout(this.reconnectTimeout);
    this.ws?.close();
  }
}
