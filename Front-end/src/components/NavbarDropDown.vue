<script setup>
import { ref } from 'vue'
import { RouterLink,useRouter } from "vue-router";

// State to track whether the dropdown is open or closed
const isOpen = ref(false)

// Function to toggle the dropdown menu
const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}
</script>
 
<template>
  <div class="flex items-center justify-between w-full h-16 bg-zinc-900 px-7">
    <!-- Smaller Logo Section -->
    <div class="bg-sit-image bg-cover bg-no-repeat w-48 h-8"></div>

    <!-- Hamburger Button -->
    <button @click="toggleDropdown" 
    class="text-white focus:outline-none hover:bg-zinc-800 border border-zinc-800 rounded-full transition-colors duration-200 p-2">
      <!-- Burger Icon -->
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <!-- <transition name="fade" @before-enter="beforeEnter" @enter="enter" @leave="leave">
      <div v-if="isOpen" class="absolute top-16 right-0 w-full bg-zinc-900 text-white transition-all duration-300">
        <div class="flex flex-col items-start p-4 space-y-4">
          <button class="hover:text-yellow-500 duration-200 w-full text-left">HOME</button>
          <button class="hover:text-yellow-500 duration-200 w-full text-left">NEWS</button>
          <button class="hover:text-yellow-500 duration-200 w-full text-left">DCA CALCULATOR</button>
          <button class="hover:text-yellow-500 duration-200 w-full text-left">PORTFOLIO</button>
          <button class="border border-yellow-500 text-white px-4 py-1 rounded-full hover:bg-yellow-500 hover:text-black transition-colors duration-200 w-full text-left">
            LOGIN
          </button>
        </div>
      </div>
    </transition> -->
    <!-- <transition name="fade" @before-enter="beforeEnter" @enter="enter" @leave="leave"> -->
    <transition name="fade">
  <div v-if="isOpen" class="absolute top-16 right-0 w-full bg-zinc-900 text-white transition-all duration-300 z-50">
    <div class="flex flex-col items-start p-4 space-y-4">
      <RouterLink :to="{name:'Home'}" class="hover:text-yellow-500 duration-200">HOME</RouterLink>
      <RouterLink :to="{name:'NEWS'}" class="hover:text-yellow-500 duration-200">NEWS</RouterLink>
      <RouterLink :to="{name:'Calculator'}" class="hover:text-yellow-500 duration-200">DCA CALCULATOR</RouterLink>
      <RouterLink :to="{name:'Port'}" class="hover:text-yellow-500 duration-200">PORTFOLIO</RouterLink>
      <RouterLink :to="{name:'History'}" class="hover:text-yellow-500 duration-200">HISTORY</RouterLink>
      <RouterLink :to="{name:'Login'}" class="border border-yellow-500 text-white px-4 py-1 rounded-full hover:bg-yellow-500 hover:text-black transition-colors duration-200 w-full text-left">
        LOGIN
      </RouterLink>
    </div>
  </div>
</transition>

  </div>
</template>
 
<style scoped>
/* Transition for dropdown */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}
</style>
