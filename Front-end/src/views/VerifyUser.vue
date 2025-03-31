<script setup>
import { CheckCircleIcon, XCircleIcon } from "@heroicons/vue/outline"
import { RouterLink, useRoute } from "vue-router"
import { jwtDecode } from "jwt-decode"
import { onMounted, ref } from "vue"
import Auth from "../composable/Auth"

const route = useRoute()
const token = ref(null)
const decodedToken = ref(null)
const tokenAuthen = ref(false)
const errMsg = ref()
const response = ref()

onMounted(async () => {
  token.value = route.params.token; // ดึง token จาก URL

  try {
    // console.log(token.value)
    // console.log(jwtDecode(token.value))
    decodedToken.value = jwtDecode(token.value)
    if(decodedToken.value.email && decodedToken.value.token){
      const res = await Auth.verify(decodedToken.value.token)
      response.value = res
      console.log(res)
      if (res.message === "Email verified successfully! You can now log in.") {
          tokenAuthen.value = true
          errMsg.value = "" // ✅ เคลียร์ error message ถ้า verify สำเร็จ
        } else {
          tokenAuthen.value = false
          // ✅ แสดงข้อความ error จาก API
          const err = JSON.parse(res)
          errMsg.value = err.message || "Verification failed."
        }
    }else{ tokenAuthen.value = false}
    // console.log("Decoded Token:", decodedToken.value)
  } catch (error) {
    console.error("Invalid token:", error)
  }
})
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-gray-100 z-50">
    <div v-if="response">
    <div v-if="tokenAuthen === true" class="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
      <CheckCircleIcon class="text-green-500 w-16 h-16 mx-auto mb-4" />
      <h1 class="text-2xl font-semibold text-gray-800">Email Verified!</h1>
      <p class="text-gray-600 mt-2">
        Your email <span v-if="decodedToken" class="font-semibold text-green-500">{{ decodedToken.email }}</span> has been successfully verified. You can now log in and start
        using our platform.
      </p>
      <RouterLink
        :to="{ name: 'Login' }"
        class="mt-6 inline-block bg-green-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-400 transition"
      >
        Go to Login
      </RouterLink>
    </div>

    <!-- Box for Unauthorized Access -->
    <div v-else class="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
      <XCircleIcon class="text-red-500 w-16 h-16 mx-auto mb-4" />
      <h1 class="text-2xl font-semibold text-gray-800">Access Denied</h1>
      <h1 v-if="errMsg" class="text-lg font-semibold text-red-600">{{ errMsg }}</h1>
      <p class="text-gray-600 mt-2">
        You are not authorized to visit this page. Please ensure you have verified your email and try again.
      </p>
      <RouterLink
        :to="{ name: 'Home' }"
        class="mt-6 inline-block bg-red-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-red-400 transition"
      >
        Go to Home
      </RouterLink>
    </div>
  </div>
  <div v-else>
    <div class="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
      <XCircleIcon class="text-red-500 w-16 h-16 mx-auto mb-4" />
      <h1 class="text-2xl font-semibold text-gray-800">Access Denied</h1>
      <p class="text-gray-600 mt-2">
        You are not authorized to visit this page. Please ensure you have verified your email and try again.
      </p>
      <RouterLink
        :to="{ name: 'Home' }"
        class="mt-6 inline-block bg-red-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-red-400 transition"
      >
        Go to Home
      </RouterLink>
    </div>
  </div>
  </div>
</template>

<style scoped></style>
