// reverse proxy to combine the demo client dev-server and websocket dev-server
import https from 'https';
import http from 'http';
import { certificateFor } from 'devcert';
import httpProxy  from 'http-proxy';

const ssl = await certificateFor('localhost');

let proxy;
if(process.env.SSL === 'true'){
    proxy = new httpProxy.createProxyServer({
        ssl: process.env.SSL === 'true' ? {
            key: ssl.key,
            cert: ssl.cert,
        } : undefined,
    });
}else{
    proxy = new httpProxy.createProxyServer();
}


const middleware = (req, res) => {
    console.log('request');
    proxy.web(req, res, {
        target: process.env.TARGET_DEMO
    });
}

let proxyServer;
if (process.env.SSL === 'true') {
    proxyServer =https.createServer({
        key: ssl.key,
        cert: ssl.cert,
    }, middleware );
} else {
    proxyServer=http.createServer(middleware );
}

//
// Listen to the `upgrade` event and proxy the
// WebSocket requests as well.
//
proxyServer.on('upgrade', function (req, socket, head) {
    
    if(req.headers['sec-websocket-protocol']  === 'vite-hmr'){
        proxy.ws(req, socket, head, {
            target: process.env.TARGET_DEMO
        });
    }else{
         proxy.ws(req, socket, head, {
        target: process.env.TARGET_SERVER
    });
    }
    
   
});

proxyServer.listen(process.env.PORT, process.env.HOST, ()=>{
    console.log('listen', process.env.HOST, process.env.PORT);
});



