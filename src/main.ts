/* Non-SSL is simply App() */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import uWebSockets, { DISABLED } from 'uWebSockets.js';
import devcert from 'devcert';
import { setInterval } from 'timers';
import { fstat } from 'fs';
import { fileURLToPath } from 'url';
import { Room } from './room.js';
import { TextDecoder } from 'util';

const port = process.env.PORT ? +process.env.PORT : 80;
const host = process.env.HOST ?? '0.0.0.0';

// (async () => {
//   const array = await storedArray('mememe');
//   // await array.push('2e2e');

//   for (let index = 0; index < 100; index++) {
//     array.push(`${index}`);
//   }

//   console.log('done');

//   for (let index = 0; index < 700; index++) {
//     ///console.log(index, await array.at(index + 100));
//     const res = await array.at(index);
//     //console.log(res);
//   }
//   console.log('done 2');
// })();
console.log(1);

const app = uWebSockets.App();
const idleTimeout = 8000;
const pingInterval = 4000;

setInterval(() => {
  app.publish('ping', '', true);
}, pingInterval);

interface UserData {
  reconnectTimeout: ReturnType<typeof setTimeout>;
  closed: boolean;
  room: string;
}

const rooms = new Map<string, Room>();

app.ws<UserData>('/*', {
  /* There are many common helper features */
  idleTimeout: 0,
  maxBackpressure: 1024,
  maxPayloadLength: 512,
  compression: DISABLED,
  sendPingsAutomatically: false,
  maxLifetime: 0,

  /* For brevity we skip the other events (upgrade, open, ping, pong, close) */
  message: (ws, message, isBinary) => {
    clearTimeout(ws.getUserData().reconnectTimeout);
    ws.getUserData().reconnectTimeout = setTimeout(() => {
      if (ws.getUserData().closed) {
        return;
      }
      ws.close();
    }, idleTimeout);

    if (message.byteLength === 0) {
      return;
    }

    const room = rooms.get(ws.getUserData().room);
    room?.message(new TextDecoder('utf8').decode(message));
    app.publish(ws.getUserData().room, message, true);
  },
  open(ws) {
    ws.subscribe('ping');
    const name = ws.getUserData().room;
    ws.subscribe(name);

    if (!rooms.has(name)) {
      rooms.set(name, new Room(name));
    }

    clearTimeout(ws.getUserData().reconnectTimeout);
    ws.getUserData().reconnectTimeout = setTimeout(() => {
      if (ws.getUserData().closed) {
        return;
      }
      ws.close();
    }, idleTimeout);
  },
  close(ws, code, message) {
    clearTimeout(ws.getUserData().reconnectTimeout);
    ws.getUserData().closed = true;
    console.log('numSubscribers', app.numSubscribers(ws.getUserData().room));

    console.log('close');
  },
  ping(ws, message) {
    console.log('ping');
  },
  pong(ws, message) {
    console.log('pong');
  },
  drain(ws) {
    console.log('drain');
  },
  subscription(ws, topic, newCount, oldCount) {
    console.log('subscription');
  },
  upgrade: (res, req, context) => {
    console.log(
      'An Http connection wants to become WebSocket, URL: ' + req.getUrl() + '!'
    );

    const url = req.getUrl();
    const room = url.slice(1) || 'default';

    if (room.length > 50 || !/^[a-zA-Z]*$/.test(room)) {
      res.writeStatus('400 Bad Request').endWithoutBody();
      return;
    }

    /* This immediately calls open handler, you must not use res after this call */
    res.upgrade(
      {
        room: `room-${room}`,
        url /* First argument is UserData (see WebSocket.getUserData()) */,
      },
      /* Spell these correctly */
      req.getHeader('sec-websocket-key'),
      req.getHeader('sec-websocket-protocol'),
      req.getHeader('sec-websocket-extensions'),
      context
    );
  },
  // upgrade(res, req, context) {
  //   console.log('upgrade');
  // },
});

app.get('/*', (res, req) => {
  /* Can't return or yield from here without responding or attaching an abort handler */
  res.onAborted(() => {
    res.aborted = true;
  });

  res.cork(() => {
    if (res.aborted) {
      return;
    }
    res
      .writeStatus('404 Not Found')
      .writeHeader('Content-Type', 'text/html; charset=utf-8')
      .end('404 Not Found');
  });
});

const server = app.listen(host, port, listenSocket => {
  console.log({ listenSocket });

  if (listenSocket) {
    console.log(`'Listening to http://${host}:${port}'`);
  }
});
