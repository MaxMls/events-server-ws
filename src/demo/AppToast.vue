<template>
  <!-- Remove 'active' class, this is just to show in Codepen thumbnail -->
  <div ref="toast" class="toast" :class="{ active }">
    <div class="toast-content">
      <i class="fas fa-solid fa-check check"></i>

      <div class="message">
        <span ref="text1" class="text text-1">{{ text1 }}</span>
        <span ref="text2" class="text text-2">{{ text2 }}</span>
      </div>
    </div>
    <i ref="closeIcon" class="fa-solid fa-xmark close"></i>

    <!-- Remove 'active' class, this is just to show in Codepen thumbnail -->
    <div ref="progress" class="progress" :class="{ active }">
      <div v-if="!closed" class="progress-line"></div>
    </div>
  </div>

  <!-- <button>Show Toast</button> -->

  <!-- <small style="position: absolute; bottom: 40px"
    >Remove 'active' classes, this is just to show in Codepen thumbnail</small
  > -->
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
export default defineComponent({
  name: 'AppToast',
  components: {},
  props: {
    text1: { type: String, required: true },
    text2: { type: String, required: true },
  },
  data() {
    return {
      active: false,
      closed: false,
      style: null,
    };
  },
  mounted() {
    requestAnimationFrame(() => {
      this.active = true;
    });
    this.timer2 = setTimeout(() => {
      this.active = false;
      this.closed = true;
    }, 4000);
  },
  beforeUnmount() {
    clearTimeout(this.timer1);
    clearTimeout(this.timer2);
  },
});
</script>
<style scoped>
/* * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Poppins', sans-serif;
}

body {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f4f7ff;
  overflow: hidden;
} */

.toast {
  /* position: absolute; */
  top: 25px;
  right: 30px;
  border-radius: 12px;
  background: #fff;
  padding: 20px 35px 20px 25px;
  box-shadow: 0 6px 20px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transform: translateX(calc(100% + 30px));
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.35);
}

.toast.active {
  transform: translateX(0%);
}

.toast .toast-content {
  display: flex;
  align-items: center;
}

.toast-content .check {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 35px;
  min-width: 35px;
  background-color: #2770ff;
  color: #fff;
  font-size: 20px;
  border-radius: 50%;
}

.toast-content .message {
  display: flex;
  flex-direction: column;
  margin: 0 20px;
}

.message .text {
  font-size: 16px;
  font-weight: 400;
  color: #666666;
}

.message .text.text-1 {
  font-weight: 600;
  color: #333;
}

.toast .close {
  position: absolute;
  top: 10px;
  right: 15px;
  padding: 5px;
  cursor: pointer;
  opacity: 0.7;
}

.toast .close:hover {
  opacity: 1;
}

.toast .progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
}

.toast .progress-line {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  height: 100%;
  width: 100%;
  background-color: #2770ff;
}

.progress.active .progress-line {
  animation: progress 4s linear forwards;
}

@keyframes progress {
  100% {
    right: 100%;
  }
}

/* 
button {
  padding: 12px 20px;
  font-size: 20px;
  outline: none;
  border: none;
  background-color: #2770ff;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
}

button:hover {
  background-color: #2770ff;
} */
/* 
.toast.active ~ button {
  pointer-events: none;
} */
</style>