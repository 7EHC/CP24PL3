<script setup>
import { RouterLink,useRouter } from "vue-router";
</script>
 
<template>
<div class="all w-screen h-16 bg-zinc-900 flex items-center justify-between px-7">
    <RouterLink :to="{name: 'Home'}"><div class=" bg-sit-image bg-cover bg-no-repeat w-64 h-11"></div></RouterLink>

   <!-- Menu Section -->
    <div class=" space-x-16 text-white font-medium text-base">
      <RouterLink :to="{name:'Home'}" class="hover:text-yellow-500 duration-200">HOME</RouterLink>
      <RouterLink :to="{name:'NEWS'}" class="hover:text-yellow-500 duration-200">NEWS</RouterLink>
      <RouterLink :to="{name:'Calculator'}" class="hover:text-yellow-500 duration-200">DCA CALCULATOR</RouterLink>
      <RouterLink :to="{name:'Port'}" class="hover:text-yellow-500 duration-200">PORTFOLIO</RouterLink>

        <RouterLink :to="{name:'Login'}" class="ml-10 border border-yellow-500 text-white px-4 py-1 rounded-full hover:bg-yellow-500 hover:text-black transition-colors duration-200">
            LOGIN 
        </RouterLink>
    </div>
</div>
</template>
 
<style scoped>
</style>