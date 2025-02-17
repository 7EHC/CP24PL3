<script setup></script>

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
        <!--add bg-colr here to see the margin area-->
        <div
          class="login w-5/6 h-5/6 flex bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          <!-- Left Section -->
          <div
            class="w-2/5 bg-zinc-900 flex flex-col justify-center items-center"
          >
            <!-- SIT INVEST Logo -->
            <div
              class="bg-sit-image bg-cover bg-no-repeat w-72 h-10 mb-6"
            ></div>
            <div
              class="relative w-20 h-2 bg-yellow-400 rounded-full mb-2"
            ></div>
            <div class="relative w-14 h-2 bg-white rounded-full"></div>
          </div>

          <!-- Right Section -->
          <div class="w-3/5 bg-yellow-400 flex flex-col justify-center px-8">
            <p class="text-black text-3xl font-bold mb-8 text-center">Login</p>

            <!-- Username Input -->
            <label class="text-black text-sm font-semibold mb-2" for="username"
              >Username</label
            >
            <input
              type="text"
              id="username"
              placeholder="Username"
              class="bg-white h-12 w-full mb-6 rounded-full pl-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
            />

            <!-- Password Input -->
            <label class="text-black text-sm font-semibold mb-2" for="password"
              >Password</label
            >
            <input
              type="password"
              id="password"
              placeholder="Password"
              class="bg-white h-12 w-full mb-6 rounded-full pl-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
            />

            <!-- Remember Me and Forgot Password -->
            <div class="flex items-center justify-between mb-6 text-sm">
              <label class="flex items-center text-black">
                <input type="checkbox" class="mr-2" />
                Remember me
              </label>
              <a href="#" class="text-blue-600 hover:underline"
                >Forgot password?</a
              >
            </div>

            <!-- Login Button -->
            <button
              class="w-full h-12 bg-white text-black font-semibold rounded-full hover:bg-gray-100"
            >
              Login
            </button>

            <div class="flex w-full justify-center mt-14">
              <a class="text-black">Don't have an account?<span class="text-blue-600 hover:underline cursor-pointer"> Sign-up now</span></a>
            </div>
            
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
