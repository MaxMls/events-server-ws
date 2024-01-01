<template>
  <AppToasts ref="toasts" />
  <!-- <div>222222</div> -->
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
    this.eventsServer.on('message', console.log);
  },
  beforeUnmount() {
    this.eventsServer.destroy();
  },
});
</script>

