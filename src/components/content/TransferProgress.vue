<template>
  <div class="space-y-4">
    <!-- 进度条 -->
    <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div
        class="h-full bg-[#7277cc] transition-all duration-300 rounded-full"
        :style="{ width: `${progress}%` }"
      ></div>
    </div>

    <!-- 传输信息 -->
    <div class="flex justify-between text-sm">
      <div class="space-y-1">
        <div class="text-gray-500">{{ msg }}</div>
        <div class="text-gray-500">
          已传输: {{ formatSize(transferred) }} / {{ formatSize(total) }}
          <span class="ml-2">速度: {{ formatSpeed(speed) }}</span>
        </div>
      </div>
      <span class="text-gray-500">{{ progress }}%</span>
    </div>
    <!-- 完成按钮 -->
    <div v-if="isDone" class="flex justify-center">
      <button
        class="w-[150px] px-4 py-3 text-[16px] rounded-lg bg-[#7277cc] text-[#fff]"
        @click="done"
      >
        完成
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";

interface Props {
  progress: number;
  transferred: number;
  total: number;
  speed: number;
  msg: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "done"): void;
}>();

const isDone = ref(false);
watch(
  () => props.progress,
  (newVal) => {
    if (newVal === 100) {
      isDone.value = true;
    }
  }
);

const done = () => {
  emit("done");
};

// 添加格式化函数
const formatSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const formatSpeed = (bytesPerSecond: number): string => {
  return `${formatSize(bytesPerSecond)}/s`;
};
</script>
