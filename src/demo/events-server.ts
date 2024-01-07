import { off } from 'process';

const idleTimeout = 8000;
const pingInterval = 4000;

const ESCAPE_CODE = '\\'.charCodeAt(0);
const N_CODE = 'n'.charCodeAt(0);
const NEW_LINE_CHUNK = new Uint8Array([ESCAPE_CODE, N_CODE]);
const ESCAPED_CHUNK = new Uint8Array([ESCAPE_CODE, N_CODE]);

const META_SIZE = NEW_LINE_CHUNK.byteLength + Uint32Array.BYTES_PER_ELEMENT;
const DATA_ROW_SIZE = META_SIZE + Uint32Array.BYTES_PER_ELEMENT * 4;
// parse floats stream
class DataParser {
  fromX;
  fromY;
  toX;
  toY;
  dataIndex = 0;
  ondata?: (...params) => void;
  ref;
  data: number[] = [];

  constructor() {
    this.ref = this.escapedByte;
  }

  flushRowData = () => {
    const data = new Float32Array(new Uint8Array(this.data).buffer);

    this.ondata?.(data);
  };

  escapedByte = callback => (byte: number) => {
    if (byte === N_CODE) {
      this.ref = this.readRowData;
      return this.flushRowData();
    }
    if (byte === ESCAPE_CODE) {
      this.ref = callback;
      return callback(ESCAPE_CODE, true);
    }
    throw new Error('not valid escaped byte');
  };

  readRowData = (byte: number, escaped = false) => {
    if (!escaped && byte === ESCAPE_CODE) {
      this.ref = this.escapedByte(this.readRowData);
      return false;
    }

    this.data.push(byte);
    return false;
  };

  parse = (chunk: Uint8Array) => {
    for (const byte of chunk) {
      this.ref(byte);
    }
  };
}

export class Sending {
  receivedCount = 0;
  sent: any[] = [];

  constructor(
    private readonly socket: WebSocket,
    private queue: any[] = []
  ) {}

  open = () => {
    while (this.queue.length) {
      const data = this.queue.shift();
      this.socket.send(data);
      this.sent.push(data);
    }
  };

  send = data => {
    if (this.socket.readyState !== WebSocket.OPEN) {
      this.queue.push(data);
      return;
    }

    this.socket.send(data);
    this.sent.push(data);
  };

  setReceivedOnServerCount = value => {
    this.receivedCount = value;
  };

  destroy = () => {
    const recent = this.sent.slice(this.receivedCount);
    return [...recent, ...this.queue];
  };
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

  reconnect = () => {
    this.ws?.close();
    this.connect();
  };

  setupTimeout = () => {
    return setTimeout(this.reconnect, idleTimeout);
  };

  private connect = () => {
    this.reconnectTimeout = this.setupTimeout();
    this.ws = new WebSocket('wss://' + location.host, [
      'events-server',
      'room1',
    ]);
    this.ws.onmessage = this.message;
    this.ws.onopen = this.open;
    this.dataParser = new DataParser();
    this.dataParser.ondata = this.data;
    this.sending = new Sending(this.ws, this.sending?.destroy());
  };

  data = data => {
    this.events.message.forEach(callback => {
      callback(data);
    });
  };

  open = () => {
    this.sending.open();
  };

  send = data => {
    this.sending.send(data);
  };

  private pending = Promise.resolve();
  private message = (event: MessageEvent<Blob>) => {
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = this.setupTimeout();

    if (event.data.size === 0) {
      this.ws.send(event.data);

      return;
    }

    this.pending = this.pending.then(() => this.parse(event.data));
  };

  parse = async (data: Blob) => {
    for await (const chunk of data.stream() as any) {
      this.dataParser.parse(chunk);
    }
  };

  on = (event: 'message', callback: (data: Blob) => void) => {
    if (event === 'message') {
      this.events.message.push(callback);
    }
  };

  off = (callback: () => void) => {
    const index = this.events.message.indexOf(callback);
    if (index === -1) {
      throw new Error('callback not found');
    }
    this.events.message.splice(index, 1);
  };

  destroy = () => {
    clearTimeout(this.reconnectTimeout);
    this.ws?.close();
  };
}
