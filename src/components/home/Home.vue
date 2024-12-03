<template>
  <div class="home flex">
    <HomeMenu class="w-[170px]" :selectedMenu="menu" @click="handleMenuClick" />
    <MainContent class="flex-1" :selectedMenu="menu" />
  </div>
</template>

<script setup lang="ts">
import HomeMenu from "./HomeMenu.vue";
import MainContent from "./MainContent.vue";
import { ref } from "vue";
const menu = ref<"receive" | "send">("receive");

const handleMenuClick = (type: "receive" | "send") => {
  menu.value = type;
};
</script>

<style scoped lang="less">
.home {
  height: 100vh;
  width: 100vw;
}
</style>
