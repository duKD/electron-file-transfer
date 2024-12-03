<template>
  <div class="receiver-content flex items-center justify-center">
    <div class="bg-white p-8 rounded-xl shadow-lg w-[480px]">
      <template v-if="!hasClient">
        <h2 class="text-[24px] font-medium text-gray-700 mb-6 text-center">
          文件接收
        </h2>
        <div class="text-[16px] text-gray-500 mb-4">
          <div class="flex items-center justify-between">
            <span>接收目录：</span>
            <div class="flex items-center flex-1 ml-2">
              <input
                :value="defaultPath"
                readonly
                :title="defaultPath"
                class="flex-1 px-3 py-2 bg-gray-50 rounded-l border border-gray-200 focus:outline-none truncate"
              />
              <div
                @click="handleSelectPath"
                class="px-4 py-2 text-blue-600 cursor-pointer"
              >
                修改
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="text-[16px] text-gray-500">请输入发送方提供的口令：</div>
          <div class="text-[12px] text-red-500">口令由发送方生成</div>
        </div>

        <div class="flex flex-col items-center mt-6">
          <input
            v-model="code"
            type="text"
            placeholder="请输入口令"
            class="w-full px-4 py-3 text-[16px] rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7277cc] focus:border-transparent placeholder:text-gray-400 transition-all duration-300 hover:border-[#7277cc]"
          />
          <button
            v-if="!!code"
            class="mt-4 w-[150px] px-4 py-3 text-[16px] rounded-lg bg-[#7277cc] text-[#fff]"
            @click="handleStartLink"
          >
            开启链接
          </button>
        </div>
      </template>
      <template v-else>
        <div class="space-y-4">
          <div class="text-[16px] text-gray-500">文件接收中...</div>
          <TransferProgress
            :progress="progress"
            :msg="msg"
            :transferred="transferred"
            :total="total"
            :speed="speed"
            @done="handleDone"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import TransferProgress from "@/components/content/TransferProgress.vue";
import { showToast } from "@/utils/toast";
import { ref, onMounted } from "vue";

const code = ref("");

const hasClient = ref(false);
const defaultPath = ref("");
const handleStartLink = async () => {
  try {
    const res = await window.electronAPI.startClient(code.value);
    console.log(res);
    hasClient.value = true;
  } catch (error) {
    showToast("口令错误");
  }
};

onMounted(async () => {
  const path = await window.electronAPI.getDefaultPath();
  defaultPath.value = path;
});
// 新增的状态
const progress = ref(0);
const msg = ref("");
const transferred = ref(0);
const total = ref(0);
const speed = ref(0);

window.electronAPI.onTransferClientProgress(
  (data: {
    progress: number;
    msg: string;
    transferred: number;
    total: number;
    speed: number;
  }) => {
    progress.value = data.progress;
    msg.value = data.msg;
    transferred.value = data.transferred;
    total.value = data.total;
    speed.value = data.speed;
  }
);

const handleDone = () => {
  progress.value = 0;
  msg.value = "";
  code.value = "";
  transferred.value = 0;
  total.value = 0;
  speed.value = 0;
  hasClient.value = false;
};

const handleSelectPath = async () => {
  try {
    const result = await window.electronAPI.selectFolder();
    if (!result.canceled && result.filePaths.length > 0) {
      defaultPath.value = result.filePaths[0];
      await window.electronAPI.setReceiveDir(defaultPath.value);
    }
  } catch (error) {
    showToast("选择目录失败");
  }
};
</script>

<style lang="less" scoped>
.receiver-content {
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
}
</style>
