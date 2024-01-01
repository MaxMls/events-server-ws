<template>
  <div>
    <template v-for="toast in toasts" :key="toast.key">
      <AppToast :text1="toast.text1" :text2="toast.text2" />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppToast from './AppToast.vue';

export default defineComponent({
  name: 'AppToasts',
  components: { AppToast },
  data() {
    return {
      nextKey: 0,
      toasts: [],
    };
  },
  beforeUnmount() {
    this.toasts.forEach((t) => {
      clearTimeout(t.timeout);
    });
  },
  methods: {
    push(text1, text2) {
      const key = this.nextKey;
      this.nextKey = key + 1;

      const timeout = setTimeout(() => {
        const index = this.toasts.findIndex((t) => t.key === key);
        this.toasts.splice(index, 1);
      }, 4500);

      this.toasts.push({ text1, text2, key, timeout });
    },
  },
});
</script>