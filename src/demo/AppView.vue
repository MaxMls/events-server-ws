<template>
  <div ref="ctn" class="container">
    <canvas ref="canvas" class="canvas" />
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import AppToasts from './AppToasts.vue';
import { EventsServer } from './events-server.js';

export default defineComponent({
  name: 'AppView',
  components: { AppToasts },
  setup() {
    return {
      eventsServer: new EventsServer(),
    };
  },
  mounted() {
    this.eventsServer.on('message', this.message);
    window.addEventListener('resize', this.resize);
    this.$refs.canvas.addEventListener('pointermove', this.move);
    this.context = this.$refs.canvas.getContext('2d');

    this.resize();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resize);
    this.eventsServer.destroy();
  },
  methods: {
    message(data: Blob) {
      console.log(data);

      // this.context.moveTo(offsetX - movementX, offsetY - movementY);
      // this.context.lineTo(offsetX, offsetY);

      // this.context.lineWidth = 1;
      // this.context.stroke();
    },
    resize() {
      this.context.canvas.width = this.$refs.ctn.offsetWidth;
      this.context.canvas.height = this.$refs.ctn.offsetHeight;
    },
    move(event) {
      const { offsetX, offsetY, movementX, movementY } = event;
      // this.context.moveTo(offsetX - movementX, offsetY - movementY);
      // this.context.lineTo(offsetX, offsetY);

      this.eventsServer.send([
        (offsetX - movementX) / this.$refs.ctn.offsetWidth,
        (offsetY - movementY) / this.$refs.ctn.offsetHeight,
        offsetX / this.$refs.ctn.offsetWidth,
        offsetY / this.$refs.ctn.offsetHeight,
      ]);
    },
  },
});
</script>
<style scoped>
.canvas {
  position: absolute;
  background: #fff;

  @media (prefers-color-scheme: dark) {
    background: #555;
  }
}
</style>
