<template>
  <div class="grid">
    <AppView />
    <AppView />
    <AppView />
    <AppView />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppView from './AppView.vue';
export default defineComponent({
  name: 'App',
  components: {
    AppView,
  },
});
</script>
<style>
* {
  margin: 0;
  padding: 0;
}

#app {
  height: 100dvh;
}
</style>

<style scoped>
.grid {
  display: grid;

  height: 100%;
  grid-template-columns: 50% 50%;
  grid-template-rows: 50% 50%;

  gap: 1px;

  background: #eee;
  @media (prefers-color-scheme: dark) {
    background: #333;
  }
}
</style>
