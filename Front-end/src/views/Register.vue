<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import authApi from "../composable/Auth";

const API_ROOT = import.meta.env.VITE_ROOT_API;
const router = useRouter();
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
const errors = ref({ username: "", password: "", confirmPassword: "" });
const success = ref(false)

const validate = () => {
  username.value = username.value.trim()
  password.value = password.value.trim()
  confirmPassword.value = confirmPassword.value.trim()
  errors.value = { username: "", password: "", confirmPassword: "" };
  let valid = true;

  if (!username.value) {
    errors.value.username = "Username is required.";
    valid = false;
  }
    if (!password.value || password.value.length < 8) {
    errors.value.password = "Password must be at least 8 characters long.";
    valid = false;
  }
  // if (!password.value || !regex.test(password.value)) {
  //   errors.value.password = "Password must be at least 8 characters long.";
  //   valid = false;
  // }
  if (confirmPassword.value !== password.value) {
    errors.value.confirmPassword = "Passwords do not match.";
    valid = false;
  }
  return valid;
};

const register = async () => {
  errors.value = { username: "", password: "", confirmPassword: "" };
  if (validate()) {
    try {
      const res = await fetch(`${API_ROOT}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.value,
          password: password.value,
        }),
      });

      if (res.ok) {
        success.value = true
      } else if (res.status === 409) {
        errors.value.username = await res.text();
        return errors.value.username;
      }
    } catch (err) {
      success.value = false
      console.error("Registration Error:", err);
      throw err;
    }
  } else {
    success.value = false
    console.log("Invalid input");
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
            <p class="text-black text-3xl font-extrabold mb-3 text-center">
              Register
            </p>
            <form v-if="!success" @submit.prevent="register">
              <label class="text-black text-sm font-semibold" for="username"
                >Username<span class="text-red-500"> *</span>
                <span class="text-red-500 text-xs float-right">{{
                  errors.username
                }}</span>
              </label>
              <input
                v-model="username"
                type="text"
                id="username"
                placeholder="Username"
                class="bg-white h-10 w-full mb-2 mt-1 rounded-full pl-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black transition duration-300 ease-out"
                required
              />

              <label
                class="text-black text-sm font-semibold mb-2 mt-4"
                for="password"
                >Password<span class="text-red-500"> *</span>
                <span class="text-red-500 text-xs float-right">{{
                  errors.password
                }}</span>
              </label>
              <input
                v-model="password"
                type="password"
                id="password"
                placeholder="Password"
                class="bg-white h-10 w-full mb-2 mt-1 rounded-full pl-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black transition duration-300 ease-out"
                required
              />

              <label
                class="text-black text-sm font-semibold mb-2 mt-4"
                for="confirmPassword"
                >Confirm Password<span class="text-red-500"> *</span>
                <span class="text-red-500 text-xs float-right">{{
                  errors.confirmPassword
                }}</span>
              </label>
              <input
                v-model="confirmPassword"
                type="password"
                id="confirmPassword"
                placeholder="Confirm Password"
                class="bg-white h-10 w-full mb-2 mt-1 rounded-full pl-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black transition duration-300 ease-out"
                required
              />

              <div class="flex justify-center items-center">
                <button
                  type="submit"
                  class="w-1/5 h-10 bg-white text-black font-semibold rounded-full hover:bg-gray-100 mt-3"
                >
                  Sign up
                </button>
              </div>
            </form>

            <div v-if="success" class="flex flex-col justify-center items-center py-10">
              <i class="fas fa-check-circle text-green-500 text-5xl"></i>
              <p class="text-black font-bold mt-2">Sign Up Successful!</p>
            </div>

            <p v-if="success" class="text-black pt-5 text-center text-xs">
              Thank you for your registration!
              <span class="text-blue-600 hover:underline cursor-pointer" @click="router.push('/login')">
                Login here
              </span>
            </p>

            <p v-if="!success" class="text-black pt-5 text-center text-xs">
              Already have an account?
              <span
                class="text-blue-600 hover:underline cursor-pointer"
                @click="router.push('/login')"
                >Login here</span
              >
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
