// reverse proxy to combine the demo client dev-server and websocket dev-server
import https from 'https';
import http from 'http';
import { certificateFor } from 'devcert';
import httpProxy from 'http-proxy';

const ssl = await certificateFor('localhost');

/** @type  httpProxy<TIncomingMessage, TServerResponse>*/
let proxyServer;
if (process.env.SSL === 'true') {
  proxyServer = new httpProxy.createProxyServer({
    ssl:
      process.env.SSL === 'true'
        ? {
            key: ssl.key,
            cert: ssl.cert,
          }
        : undefined,
  });
} else {
  proxyServer = new httpProxy.createProxyServer();
}

const middleware = (request, response) => {
  console.log('request');
  proxyServer.web(request, response, {
    target: process.env.TARGET_DEMO,
  });
};

let server;
if (process.env.SSL === 'true') {
  server = https.createServer(
    {
      key: ssl.key,
      cert: ssl.cert,
    },
    middleware
  );
} else {
  server = http.createServer(middleware);
}

proxyServer.on('error', error => {
  console.error('proxyServer on error', error);
});

proxyServer.on('econnreset', error => {
  console.error('proxyServer on econnreset', error);
});

server.on('error', error => {
  console.error('server on error', error);
});

server.on('clientError', (error, socket) => {
  console.error('server on clientError', error);
});

//
// Listen to the `upgrade` event and proxyServer the
// WebSocket requests as well.
//
server.on('upgrade', (request, socket, head) => {
  try {
    request.on('error', error => {
      console.error('server on upgrade request error', error);
    });

    socket.on('error', error => {
      console.error('server on upgrade socket error', error);
    });

    if (request.headers['sec-websocket-protocol'] === 'vite-hmr') {
      proxyServer.ws(request, socket, head, {
        target: process.env.TARGET_DEMO,
      });
    } else {
      proxyServer.ws(request, socket, head, {
        target: process.env.TARGET_SERVER,
      });
    }
  } catch (error) {
    console.error(error);
  }
});

server.listen(process.env.PORT, process.env.HOST, () => {
  console.log('listen', process.env.HOST, process.env.PORT);
});
