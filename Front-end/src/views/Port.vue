<script setup>
import { ref } from 'vue';
import stockApi from '../composable/FetchStock';
import { RouterLink,useRouter } from "vue-router";

const searchResult = ref([])
const searchModel = ref()

const search = async (param) => {
    searchResult.value = await stockApi.searchTicker(param);
    if(searchResult.value.length === 0){searchResult.value = false}
    console.log(searchResult.value);
}
</script>
 
<template>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

<div class="all">
<label class="input input-bordered flex items-center gap-2 bg-white border border-zinc-400 border-solid rounded-2xl text-zinc-800 w-80 h-12 p-2">
  <input 
  type="text" 
  class="grow" 
  placeholder="What are you looking for ?" 
  v-model="searchModel"
  @change="search(searchModel)"
  />
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    class="h-4 w-4 opacity-70">
    <path
      fill-rule="evenodd"
      d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
      clip-rule="evenodd" />
  </svg>
</label>

<div class="result-container mt-5 flex flex-row flex-wrap gap-5 w-screen">
  <div v-for="(res, index) in searchResult" :key="index" class="result w-1/4">
    <div class="block space-y-2">
      <p class="text-3xl font-bold text-yellow-400">{{ res.ticker }}</p>
      <p><span class="highlight">Name:</span> {{ res.name }}</p>
      <p>
        <span class="highlight">Type:</span>
        {{ res.type === "CS" ? "Common Stock" : res.type }}
      </p>
      <RouterLink :to="{name:'StockView'}" 
      class="mt-3 float-right bg-yellow-400 text-zinc-800 p-1 rounded-lg border border-solid border-yellow-400 hover:bg-slate-900 hover:text-yellow-400 hover:border-yellow-400 hover:border hover:border-solid transition duration-300">
      View
    </RouterLink>
    </div>
  </div>
</div>
<div v-if="searchResult === false" class="text-center">Not Found.</div>

</div>
</template>
 
<style scoped>
.all{
  font-family: "Kanit", sans-serif;
  font-style: normal;
}

.result {
  border: 2px solid #161616;
  color: white;
  position: relative;
  padding: 10px;
  border-radius: 10px;
  align-items: center;
  background-color: #161616;
}
</style>