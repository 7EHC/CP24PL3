<script setup>
import Navbar from './components/Navbar.vue';
import NavbarDropDown from './components/NavbarDropDown.vue';
import Home from './views/Home.vue';
import Port from './views/Port.vue';
import { RouterView } from 'vue-router';
</script>
 
<template>
    <Navbar class=" navbar
    2xl:h-16 2xl:flex
    lg:h-16 lg:flex
    md:hidden
    sm:hidden
    "
     />
     <NavbarDropDown class="
    2xl:hidden
    lg:hidden
    md:flex
    sm:flex
    "/>
<!-- ------------------------------------------------------------------------------------------------- -->
        <div class="all  mt-12 
        2xl:ml-64 2xl:mr-64
        xl:ml-64 xl:mr-64 
        md:ml-28 md:mr-28
        sm:ml-28 sm:mr-28 
        ">
            <!-- <Home /> -->
             <!-- <Port /> -->
              <RouterView />
        </div>
    
</template>
 
<style scoped>
/* Hide the Navbar component on screens smaller than 640px */
@media (max-width: 768px) {
  .navbar {
    display: none; /* Hides Navbar */
  }
}

@media (max-width: 639px) {
  .all {
    margin-left: 50px;
    margin-right: 50px;
  }
}
</style>