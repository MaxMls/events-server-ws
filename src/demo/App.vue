<template>
  <div>
    <AppView />
    <div></div>
    app
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