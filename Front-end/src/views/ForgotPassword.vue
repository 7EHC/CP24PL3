<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const API_ROOT = import.meta.env.VITE_ROOT_API;
const router = useRouter();
const email = ref("");
const successMessage = ref("");
const errorMessage = ref("");

const sendResetLink = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const res = await fetch(`${API_ROOT}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.value }),
    });

    if (res.ok) {
      successMessage.value = "Please check your email for reset instructions.";
    } else {
      errorMessage.value = "Email not found or invalid.";
    }
  } catch (error) {
    errorMessage.value = "An error occurred. Please try again later.";
  }
};
</script>

<template>
    <div class="all -ml-24 w-full h-screen fixed flex justify-center">
      <div class="sub h-4/6 w-4/6 -ml-10 mt-14 rounded-xl">
        <div class="flex items-center justify-center h-full">
          <div class="login w-5/6 h-5/6 flex bg-white rounded-2xl shadow-lg overflow-hidden">
            <div class="w-2/5 bg-zinc-900 flex flex-col justify-center items-center">
              <div class="bg-sit-image bg-cover bg-no-repeat w-72 h-10 mb-6"></div>
              <div class="relative w-20 h-2 bg-yellow-400 rounded-full mb-2"></div>
              <div class="relative w-14 h-2 bg-white rounded-full"></div>
            </div>
  
            <div class="w-3/5 bg-yellow-400 flex flex-col justify-center px-8">
              <p class="text-black text-3xl font-extrabold mb-2 text-center">
                Forgot Password
              </p>
              <p class="text-black text-sm text-center mb-4">
                Enter your email to receive reset instructions.
              </p>
  
              <input
                v-model="email"
                type="email"
                placeholder="Enter the email used for account registration."
                class="bg-white h-10 w-full mt-1 rounded-full pl-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black transition duration-300 ease-out"
                required
              />
              <p v-if="successMessage" class="text-green-500 text-center text-xs mt-2">
                {{ successMessage }}
              </p>
              <p v-if="errorMessage" class="text-red-500 text-center text-xs mt-2">
                {{ errorMessage }}
              </p>
              
              <div class="flex justify-center items-center mt-4">
                <button
                  @click="sendResetLink"
                  class="relative flex items-center justify-center w-1/3 h-10 bg-white text-black font-semibold rounded-full transition-all duration-500 ease-in-out hover:bg-gray-100"
                  >
                  Send Reset Link
                </button>
              </div>
  
  
              <p class="text-black pt-5 text-center text-xs">
                Remember your password?
                <span
                  class="text-blue-600 hover:underline cursor-pointer"
                  @click="router.push('/login')"
                >
                  Back to Login
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
