import { off } from 'process';

const idleTimeout = 8000;
const pingInterval = 4000;

// parse floats stream
class DataParser {
  fromX;
  fromY;
  toX;
  toY;
  numberString = '';
  numberIndex = 0;
  numberStart = 0;
  ondata?: (...params) => void;

  constructor() {}

  parse(string: Uint8Array) {
    // const string = await data.text();

    for (let index = 0; index < string.length; index++) {
      if (string[index] !== ','.charCodeAt(0)) {
        this.numberString += String.fromCharCode(string[index]);
        continue;
      }

      const number = parseFloat(this.numberString);

      switch (this.numberIndex % 4) {
        case 0:
          this.fromX = number;
          break;
        case 1:
          this.fromY = number;
          break;
        case 2:
          this.toX = number;
          break;
        case 3:
          this.toY = number;
          this.ondata?.([this.fromX, this.fromY, this.toX, this.toY]);
          break;
      }
      this.numberString = '';
      this.numberIndex++;
    }
  }
}

export class Sending {
  receivedCount = 0;
  sent: any[] = [];

  constructor(
    private readonly socket: WebSocket,
    private queue: any[] = []
  ) {}

  open() {
    while (this.queue.length) {
      const data = this.queue.shift();
      this.socket.send(data);
      this.sent.push(data);
    }
  }

  send(data) {
    if (this.socket.readyState !== WebSocket.OPEN) {
      this.queue.push(data);
      return;
    }

    this.socket.send(data);
    this.sent.push(data);
  }

  setReceivedOnServerCount(value) {
    this.receivedCount = value;
  }

  destroy() {
    const recent = this.sent.slice(this.receivedCount);
    return [...recent, ...this.queue];
  }
}

export class EventsServer {
  ws!: WebSocket;
  dataParser!: DataParser;
  sending!: Sending;
  reconnectTimeout?: NodeJS.Timeout;
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
    this.ws = new WebSocket('wss://' + location.host, [
      'events-server',
      'room1',
    ]);
    this.ws.onmessage = this.message.bind(this);
    this.ws.onopen = this.open.bind(this);
    this.dataParser = new DataParser();
    this.dataParser.ondata = this.data.bind(this);
    this.sending = new Sending(this.ws, this.sending?.destroy());
  }
  data(data) {
    this.events.message.forEach(callback => {
      callback(data);
    });
  }
  open() {
    this.sending.open();
  }

  send(data) {
    this.sending.send(data);
  }

  private pending = Promise.resolve();
  private message(event: MessageEvent<Blob>) {
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = this.setupTimeout();

    if (event.data.size === 0) {
      this.ws.send(event.data);

      return;
    }

    this.pending = this.pending.then(() => this.parse(event.data));
  }

  async parse(data: Blob) {
    for await (const chunk of data.stream()) {
      this.dataParser.parse(chunk);
    }
  }

  on(event: 'message', callback: (data: Blob) => void) {
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
