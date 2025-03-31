<script setup>
import { jwtDecode } from "jwt-decode";
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";

const API_ROOT = import.meta.env.VITE_ROOT_API;
const router = useRouter();
const route = useRoute();
const token = ref(null);
const newPassword = ref("");
const confirmPassword = ref("");
const successMessage = ref("");
const errorMessage = ref("");
const regex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_!@#$%^&*(),.?":{}|<>]).{8,}$/;

const resetPassword = async () => {
  if (
    !newPassword.value ||
    newPassword.value.length < 8 ||
    newPassword.value.length > 15 ||
    !regex.test(newPassword.value)
  ) {
    errorMessage.value =
      "Password must be 8-15 characters with a mix of cases, a number, and a special character.";
    valid = false;
  } else if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match.";
    return;
  }
  try {
    const path = window.location.pathname;

    const token = path.split("/").pop();

    console.log(token);

    if (!token) {
      errorMessage.value = "Invalid or missing token.";
      return;
    }

    const response = await fetch(`${API_ROOT}/api/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
        newPassword: newPassword.value,
      }),
    });

    if (response.ok) {
      successMessage.value =
        "Password reset successful! You can now log in with your new password.";
    } else {
      const errorData = await response.json();
      errorMessage.value = errorData.message || "Something went wrong.";
    }
  } catch (error) {
    console.error("Error during password reset:", error);
    errorMessage.value = "Error resetting password. Please try again.";
  }
};

onMounted(() => {
  token.value = route.params.token;
  const decodedToken = jwtDecode(token.value);
  const dateNow = new Date().getTime();
  const dateExp = decodedToken.exp * 1000;
  if (dateNow > dateExp) {
    alert("Link expired. Please request a new password reset link.");
    // router.push("/forgot-password");
    window.close();
  }
});
</script>

<template>
  <div class="all -ml-24 w-full h-screen fixed flex justify-center">
    <div class="sub h-4/6 w-4/6 -ml-10 mt-14 rounded-xl">
      <div class="flex items-center justify-center h-full">
        <div
          class="login w-5/6 h-5/6 flex bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <div
            class="w-2/5 bg-zinc-900 flex flex-col justify-center items-center"
          >
            <div
              class="bg-sit-image bg-cover bg-no-repeat w-72 h-10 mb-6"
            ></div>
            <div
              class="relative w-20 h-2 bg-yellow-400 rounded-full mb-2"
            ></div>
            <div class="relative w-14 h-2 bg-white rounded-full"></div>
          </div>

          <div class="w-3/5 bg-yellow-400 flex flex-col justify-center px-8">
            <p class="text-black text-3xl font-extrabold mb-2 text-center">
              Reset Password
            </p>
            <p class="text-black text-sm text-center mb-4">
              Enter your new password to reset.
            </p>

            <input
              v-model="newPassword"
              type="password"
              placeholder="New password"
              class="bg-white h-10 w-full mb-2 mt-1 rounded-full pl-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black transition duration-300 ease-out"
              required
            />
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              class="bg-white h-10 w-full mt-2 rounded-full pl-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black transition duration-300 ease-out"
              required
            />

            <p
              v-if="successMessage"
              class="text-green-500 text-center text-xs mt-2"
            >
              {{ successMessage }}
            </p>
            <p
              v-if="errorMessage"
              class="text-red-500 text-center text-xs mt-2"
            >
              {{ errorMessage }}
            </p>

            <div class="flex justify-center items-center mt-4">
              <button
                @click="resetPassword"
                class="relative flex items-center justify-center w-1/3 h-10 bg-white text-black font-semibold rounded-full transition-all duration-500 ease-in-out hover:bg-gray-100"
              >
                Reset Password
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
