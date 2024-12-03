<template>
  <div class="send-content p-8">
    <div class="text-[24px] font-medium text-gray-700 mb-6 text-center">
      文件发送
    </div>
    <div class="text-[16px] text-gray-500 mb-4">第一步: 选择文件</div>
    <div
      v-if="!selectedFile"
      @click="handleSelectFile"
      class="flex flex-col justify-center items-center border-2 w-[120px] h-[100px] border-gray-300 rounded-lg p-6 text-center hover:border-[#7277cc] transition-colors cursor-pointer"
    >
      <FileIcon class="w-[32px] h-[32px]" />
      <div class="text-gray-400 text-sm">文件</div>
    </div>
    <div v-else>
      <div class="text-[16px] text-gray-500 mb-4">
        已选择文件: {{ selectedFile?.path }}
      </div>
      <div class="text-[12px] text-blue-500 mb-4" @click="handleSelectFile">
        重新选择
      </div>
    </div>

    <!-- 分割线 -->
    <div class="h-[1px] w-full bg-[#e0e0e0] my-6"></div>

    <template v-if="selectedFile">
      <div class="text-[16px] text-gray-500 mb-4">
        第二步：开启传输服务 生成口令
      </div>
      <div class="text-[12px] text-red-500 mb-4">
        确保链接设备在同一个局域网
      </div>
      <!-- 开启传输服务按钮 -->
      <div
        v-if="!isOpen"
        class="w-[150px] h-[60px] bg-[#7277cc] text-[#fff] rounded-lg p-6 flex items-center justify-center cursor-pointer"
        @click="openTransferService"
      >
        <div class="text-sm">开启传输服务</div>
      </div>
      <template v-else>
        <div class="flex items-center gap-3 mb-10">
          <div class="flex items-center px-4 py-10 bg-gray-50 rounded-lg">
            <span class="text-[16px] text-gray-500">传输口令:</span>
            <span class="ml-2 text-[16px] font-medium text-gray-700">{{
              code
            }}</span>
          </div>
          <div
            class="px-3 py-2 text-sm text-[#7277cc] hover:text-[#8589d4] cursor-pointer transition-colors rounded-lg hover:bg-gray-50"
            @click="copyCode"
          >
            复制口令
          </div>
        </div>
        <div v-if="!hasClient" class="text-[16px] text-gray-500">
          等待链接...
        </div>
        <!-- 开始传输文件按钮 -->
        <div v-if="showTransfer" class="text-[16px] text-gray-500">
          <button
            v-if="!isTransfer"
            class="mb-10 w-[150px] px-4 py-3 text-[16px] rounded-lg bg-[#7277cc] text-[#fff]"
            @click="startTransfer"
          >
            开始传输文件
          </button>
          <TransferProgress
            :progress="progress"
            :msg="msg"
            :transferred="transferred"
            :total="total"
            :speed="speed"
            @done="done"
          />
        </div>
      </template>
    </template>
  </div>
</template>
<script setup lang="ts">
import TransferProgress from "@/components/content/TransferProgress.vue";
import FileIcon from "@/assets/icon/file.svg";
import { ref, onUnmounted } from "vue";
import { showToast } from "@/utils/toast";

interface FileInfo {
  path: string;
  name: string;
}

const selectedFile = ref<FileInfo | null>(null);

// 处理选择文件夹
const handleSelectFile = async () => {
  try {
    // 直接使用 window.electronAPI
    const result = await window.electronAPI.selectFile();

    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0];
      const folderName = folderPath.split(/[/\\]/).pop() || "";

      selectedFile.value = {
        path: folderPath,
        name: folderName,
      };
    }
  } catch (error) {
    console.error("选择文件失败:", error);
  }
};

const isOpen = ref(false);
const code = ref("");
const hasClient = ref(false);
const showTransfer = ref(false);
// 修改定时器的处理方式
const checkClient = async () => {
  try {
    const result = await window.electronAPI.getServerInfo();
    hasClient.value = result.hasClient;
    if (hasClient.value) {
      showTransfer.value = true;
    }
    if (isOpen.value && !showTransfer.value) {
      setTimeout(checkClient, 1000);
    }
  } catch (error) {
    console.error("检查客户端状态失败:", error);
  }
};

const copyCode = async () => {
  try {
    await window.electronAPI.copyText(code.value);
    showToast("复制成功");
  } catch (error) {
    console.error("复制失败:", error);
    showToast("复制失败");
  }
};

const openTransferService = async () => {
  try {
    const result = await window.electronAPI.startServer();
    code.value = result.code;
    isOpen.value = true;
    checkClient();
  } catch (error) {
    console.error("启动服务失败:", error);
  }
};

const isTransfer = ref(false);
const startTransfer = async () => {
  await window.electronAPI.startTransfer(selectedFile?.value?.path!);
  isTransfer.value = true;
};

const progress = ref(0);
const msg = ref("");
const transferred = ref(0);
const total = ref(0);
const speed = ref(0);

window.electronAPI.onTransferServerProgress(
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

const done = async () => {
  await window.electronAPI.stopServer();
  hasClient.value = false;
  isTransfer.value = false;
  selectedFile.value = null;
  showTransfer.value = false;
  progress.value = 0;
  transferred.value = 0;
  total.value = 0;
  speed.value = 0;
  isOpen.value = false;
  msg.value = "";
};
</script>
<style lang="less" scoped>
.receiver-content {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
}
</style>
