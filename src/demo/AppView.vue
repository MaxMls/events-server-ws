<template>
  <div>222222</div>
</template>
<script>
const idleTimeout = 8000;
const pingInterval = 4000;

export default {
  name: 'AppView',
  // mounted(){
  //     console.log('mounted');
  // }
  mounted() {
    const setupTimeout = () => {
      return setTimeout(() => {
        this.ws.close();
        connect();
      }, idleTimeout);
    };

    const connect = () => {
      this.reconnectTimeout = setupTimeout();
      this.ws = new WebSocket('wss://' + location.host);
      this.ws.onmessage = (e) => {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setupTimeout();
        console.log(e.data);

        if (e.data.size === 0) {
          this.ws.send(e.data);
        }
      };
      this.ws.onopen = (e) => this.ws.send('Hello all connected clients');
    };

    connect();
  },
};
</script>