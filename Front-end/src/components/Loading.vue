<script setup>
const props = defineProps(["isLoading"]);
</script>

<template>
  <div v-if="props.isLoading === true" class="fixed inset-0 flex items-center justify-center" >
    <div class="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" ></div>
  </div>
</template>

<style scoped></style>
