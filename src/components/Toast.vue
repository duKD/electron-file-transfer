<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="transform  opacity-0"
    enter-to-class="transform  opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="transform opacity-100"
    leave-to-class="transform  opacity-0"
  >
    <div
      v-show="visible"
      class="fixed left-1/2 top-1/2 px-6 py-3 bg-gray-800/90 text-white rounded-lg shadow-lg text-sm z-50 backdrop-blur-sm"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from "vue";

const visible = ref(false);
const message = ref("");

const show = (msg: string, duration = 2000) => {
  message.value = msg;
  visible.value = true;
  setTimeout(() => {
    visible.value = false;
  }, duration);
};

defineExpose({
  show,
});
</script>
