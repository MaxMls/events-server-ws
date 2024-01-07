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
    } as unknown as {
      eventsServer: EventsServer;
      context: CanvasRenderingContext2D;
      animationFrame: number;
      $refs: {
        canvas: HTMLCanvasElement;
        ctn: HTMLDivElement;
      };
    };
  },
  mounted() {
    this.eventsServer.on('message', this.message);
    window.addEventListener('resize', this.resize);
    this.$refs.canvas.addEventListener('pointermove', this.move);
    this.context = this.$refs.canvas.getContext(
      '2d'
    ) as CanvasRenderingContext2D;
    this.context.lineWidth = 1;

    const animationFrame = () => {
      this.animationFrame = requestAnimationFrame(animationFrame);

      this.context.stroke();
      this.context.beginPath();
    };
    animationFrame();
    this.resize();
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resize);
    this.eventsServer.destroy();
    cancelAnimationFrame(this.animationFrame);
  },
  methods: {
    message(data: number[]) {
      const [fromX, fromY, toX, toY] = data;
      const { offsetWidth: width, offsetHeight: height } = this.$refs.ctn;

      this.context.moveTo(fromX * width, fromY * height);
      this.context.lineTo(toX * width, toY * height);
    },
    resize() {
      const imageData = this.context.getImageData(
        0,
        0,
        this.context.canvas.width,
        this.context.canvas.height
      );

      this.context.canvas.width = this.$refs.ctn.offsetWidth;
      this.context.canvas.height = this.$refs.ctn.offsetHeight;

      this.context.putImageData(imageData, 0, 0);

      this.context.drawImage(
        this.context.canvas,
        0,
        0,
        this.context.canvas.width,
        this.context.canvas.height,
        0,
        0,
        this.$refs.ctn.offsetWidth,
        this.$refs.ctn.offsetHeight
      );
    },
    move(event) {
      const { offsetX, offsetY, movementX, movementY } = event;

      this.eventsServer.send(
        new Float32Array([
          (offsetX - movementX) / this.$refs.ctn.offsetWidth,
          (offsetY - movementY) / this.$refs.ctn.offsetHeight,
          offsetX / this.$refs.ctn.offsetWidth,
          offsetY / this.$refs.ctn.offsetHeight,
        ]).buffer
      );
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
