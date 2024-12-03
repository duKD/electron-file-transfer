<template>
  <div class="bg-[#ececec] flex flex-col items-center">
    <div class="text-[30px] h-[120px] leading-[120px] text-center">快传</div>
    <div
      class="flex flex-col w-[96px] h-[96px] justify-center items-center rounded-lg text-[#888] fill-[#888] menu cursor-pointer"
      @click="handleMenuClick('receive')"
      :class="{
        'no-active': selectedMenu !== 'receive',
        'bg-[#7277cc] !text-[#fff] fill-[#fff]': selectedMenu === 'receive',
      }"
    >
      <Receive class="w-[32px] h-[32px]" />
      <div class="text-[16px] mt-[10px]">接收</div>
    </div>
    <div
      class="flex w-[96px] h-[96px] flex-col justify-center items-center rounded-lg menu text-[#888] fill-[#888] cursor-pointer"
      @click="handleMenuClick('send')"
      :class="{
        'no-active': selectedMenu !== 'send',
        'bg-[#7277cc] !text-[#fff] fill-[#fff]': selectedMenu === 'send',
      }"
    >
      <Send class="w-[32px] h-[32px]" />
      <div class="text-[16px] mt-[10px]">发送</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Receive from "@/assets/icon/receive.svg";
import Send from "@/assets/icon/send.svg";

defineProps<{
  selectedMenu: "receive" | "send";
}>();

const emit = defineEmits<{
  (e: "click", type: "receive" | "send"): void;
}>();
const handleMenuClick = (type: "receive" | "send") => {
  emit("click", type);
};
</script>

<style scoped lang="less">
.menu {
  margin-top: 50px;
}
.no-active {
  &:hover {
    background-color: #dcdcdc;
  }
}
</style>
