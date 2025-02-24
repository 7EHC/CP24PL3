<script setup>
import { onMounted, ref, watchEffect, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { decodeToken } from "../composable/Auth";

const router = useRouter();
const route = useRoute();

const token = ref(localStorage.getItem("token"));
const userData = ref("");
const showLogout = ref(false);
const protectedRoutes = ["/port", "/history"];

const logout = () => {
  localStorage.removeItem("token");
  token.value = "";
  userData.value = "";
  showLogout.value = false;

  if (protectedRoutes.includes(route.path)) {
    router.push("/login");
  }
};

window.addEventListener("storage", () => {
  token.value = localStorage.getItem("token");
});

watch(
  token,
  (newToken) => {
    if (newToken) {
      userData.value = decodeToken(newToken);
    }
  },
  { immediate: true }
);
</script>

<template>
  <div
    class="all w-screen h-16 bg-zinc-900 flex items-center justify-between px-7 z-50"
  >
    <RouterLink :to="{ name: 'Home' }"
      ><div class="bg-sit-image bg-cover bg-no-repeat w-64 h-11"></div
    ></RouterLink>

    <!-- Menu Section -->
    <div class="space-x-12 text-white font-medium text-base">
      <RouterLink
        :to="{ name: 'Home' }"
        class="hover:text-yellow-500 duration-200"
        >HOME</RouterLink
      >
      <RouterLink
        :to="{ name: 'NEWS' }"
        class="hover:text-yellow-500 duration-200"
        >NEWS</RouterLink
      >
      <RouterLink
        :to="{ name: 'Calculator' }"
        class="hover:text-yellow-500 duration-200"
        >DCA CALCULATOR</RouterLink
      >
      <RouterLink
        :to="{ name: 'Port' }"
        class="hover:text-yellow-500 duration-200"
        >PORTFOLIO</RouterLink
      >
      <RouterLink
        :to="{ name: 'History' }"
        class="hover:text-yellow-500 duration-200"
        v-if="token"
        >HISTORY</RouterLink
      >

      <RouterLink
        v-if="!token"
        :to="{ name: 'Login' }"
        class="ml-10 border border-yellow-500 text-white px-4 py-1 rounded-full hover:bg-yellow-500 hover:text-black transition-colors duration-200"
      >
        LOGIN
      </RouterLink>
      <!-- <p
        v-else
        class="flex items-center gap-2 ml-10 border border-yellow-500 text-white px-4 py-1 rounded-full"
      >
        <img src="../assets/user.png" alt="user" class="w-5 h-5" />
        {{ userData.username }}
      </p> -->

      <div class="relative ml-auto">
        <!-- กดแล้ว dropdown แสดง -->
        <button
          v-if="token"
          @click="showLogout = !showLogout"
          class="flex items-center gap-2 border border-yellow-500 text-white px-4 py-1 rounded-full"
        >
          <img src="../assets/user.png" alt="user" class="w-5 h-5" />
          <span>{{ userData.username }}</span>
          <svg
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': showLogout }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <div
          v-show="showLogout"
          class="absolute right-0 mt-2 w-40 bg-white text-black rounded-lg shadow-lg overflow-hidden"
        >
          <button
            @click="logout"
            class="w-full text-left px-4 py-2 hover:bg-gray-100 transition duration-150"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
