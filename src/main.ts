/* Non-SSL is simply App() */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import uWebSockets, { DISABLED } from 'uWebSockets.js';
import devcert from 'devcert';
import { setInterval } from 'timers';
import { fstat } from 'fs';
import { fileURLToPath } from 'url';

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
}

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
  },
  open(ws) {
    ws.subscribe('ping');

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
  // upgrade(res, req, context) {
  //   console.log('upgrade');
  // },
});

app.get('/*', async (res, req) => {
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
