<template>
  <div class="main-content">
    <ReceiverContent v-show="selectedMenu === 'receive'" />
    <SendContent v-show="selectedMenu === 'send'" />
  </div>
</template>

<script setup lang="ts">
import ReceiverContent from "@/components/content/ReceiverContent.vue";
import SendContent from "@/components/content/SendContent.vue";
import { ref } from "vue";
defineProps<{
  selectedMenu: "receive" | "send";
}>();
</script>

<style scoped lang="less"></style>
