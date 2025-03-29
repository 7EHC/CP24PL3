<script setup>
import { ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import { decodeToken } from "../composable/Auth";

const API_ROOT = import.meta.env.VITE_ROOT_API;
const router = useRouter();
const username = ref("");
const password = ref("");
const failedMsg = ref("");
const isSuccess = ref(false)
const isLoading = ref(false)

const handleLogin = async () => {
  isSuccess.value = false;
  // await new Promise(resolve => setTimeout(resolve, 500));
  isSuccess.value = true;
};

const login = async () => {
  username.value = username.value.trim()
  password.value = password.value.trim()
  failedMsg.value = "";
  isLoading.value = true
  if(username.value.length !== 0 && password.value.length !== 0) {

    try {
      const res = await fetch(`${API_ROOT}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.value.toLowerCase(),
        password: password.value,
      }),
    });
    
    if (res.ok) {
      const data = await res.json();
      const token = data.token;
      localStorage.setItem("token", token);
      window.dispatchEvent(new Event("storage"));
      handleLogin()
      setTimeout(() => {
        router.push("/port");
      }, 1800);
    } else if (res.status === 400) {
      failedMsg.value = "Incorrect username or password.";
    }
  } catch (err) {
    console.error("Login Error:", err);
    throw err;
  }finally{
    isLoading.value = false
  }
}
};
</script>

<template>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
    rel="stylesheet"
  />
  <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
    rel="stylesheet"
  />

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
              Login
            </p>
            <form @submit.prevent="login">
              <label class="text-black text-sm font-semibold" for="username"
                >Username<span class="text-red-500"> *</span>
              </label>
              <!-- <span class="text-red-500 text-xs float-right pt-1">{{
                errors.username
              }}</span> -->
              <input
                v-model="username"
                type="text"
                id="username"
                placeholder="Username"
                :class="{
                  'ring-2 ring-red-500': failedMsg.length !== 0,
                }"
                class="bg-white h-10 w-full mb-2 mt-1 rounded-full pl-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black transition duration-300 ease-out"
                required
              />
              <label
                class="text-black text-sm font-semibold mb-2 mt-4"
                for="password"
                >Password<span class="text-red-500"> *</span>
              </label>
              <!-- <span class="text-red-500 text-xs float-right">{{
                errors.password
              }}</span> -->
              <input
                v-model="password"
                type="password"
                id="password"
                placeholder="Password"
                :class="{
                  'ring-2 ring-red-500': failedMsg.length !== 0,
                }"
                class="bg-white h-10 w-full mt-1 rounded-full pl-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black transition duration-300 ease-out"
                required
              />
              <div class="mt-2 text-xs flex items-center justify-between">
                <label class="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" />
                  <span class="text-black">Remember me</span>
                </label>
                <span class="text-blue-600">Forgot password?</span>
              </div>
              <div v-if="failedMsg.length != 0">
                <span class="text-red-500 text-xs">{{ failedMsg }}</span>
              </div>
              <div class="flex justify-center items-center">
                <button
                  type="submit"
                  class="relative flex items-center justify-center w-1/5 h-10 bg-white text-black font-semibold rounded-full transition-all duration-500 ease-in-out hover:bg-gray-100 mt-3"
                  :class="{ 'w-1/3 px-6': isSuccess }"
                >
                  <transition name="fade">
                    <i
                      v-if="isSuccess"
                      class="fas fa-check-circle text-green-500 mr-2 text-lg"
                    ></i>
                  </transition>
                  <p v-if="isLoading === false">Login</p>
                  <div v-if="isLoading === true" class="flex items-center justify-center" >
                    <div class="w-6 h-6 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" ></div>
                    <p class="font-light ml-2 text-xs">Logging in...</p>
                  </div>
                </button>
              </div>
            </form>
            <p class="text-black pt-5 text-center text-xs">
              Don't have an account?
              <span
                class="text-blue-600 hover:underline cursor-pointer"
                @click="router.push('/register')"
                >Sign up now</span
              >
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* เอฟเฟกต์ให้ไอคอน ✓ ค่อย ๆ ปรากฏ */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease-out;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
p {
  font-family: "Kanit", sans-serif;
  font-style: normal;
}

/* Desktop---------------------------------- */
@media (max-width: 1279px) {
  .all {
    margin-left: -90px;
  }
}
@media (max-width: 880px) {
  .login {
    height: 300px;
  }
}
@media (max-width: 639px) {
  .all {
    margin-left: -30px;
  }
}
@media (max-height: 487px) {
  .sub {
    height: 300px;
  }
}
@media (max-height: 400px) {
  .sub {
    height: 200px;
  }
}
@media (max-height: 300px) {
  .sub {
    height: 150px;
  }
  .all {
    margin-top: -20px;
  }
}
@media (max-height: 200px) {
  .all {
    margin-top: -20px;
  }
  .sub {
    height: 100px;
  }
}
/* Desktop---------------------------------- */
/* iPad Pro---------------------------------- */
@media (width: 1024px) and (height: 1366px) {
  .sub {
    margin-top: 20%;
    height: 50%;
    width: 700px;
    margin-left: -5%;
  }
}
@media (width: 1366px) and (height: 1024px) {
  .sub {
    margin-top: 10%;
    height: 50%;
    width: 900px;
    margin-left: 10px;
  }
}
/* iPad Pro---------------------------------- */
/* iPhone Pro Max------------------------------ */
@media (width: 430px) and (height: 932px) {
  .sub {
    margin-top: 20px;
    height: 70%;
    width: 410px;
    margin-left: -40px;
  }
}
/* iPhone Pro Max---------------------------------*/
/* iPhone Pro----------------------------------- */
@media (width: 390px) and (height: 844px) {
  .sub {
    margin-top: 40px;
    height: 70%;
    width: 370px;
    margin-left: -40px;
  }
}
</style>
