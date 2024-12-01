<script setup>
import { ref, computed, onMounted } from 'vue';
import stockApi from '../composable/FetchStock';
import { RouterLink,useRoute, useRouter } from "vue-router";
import CreatePortSideBar from '../components/CreatePortSideBar.vue';

const searchResult = ref([])
const searchModel = ref()
const router = useRouter();
const details = ref({})
const latestClosePrice = ref()
//

const totalValue = computed(() => {
  const sum = details.value.assets.reduce((sum, asset) => {
    return sum + asset.quantity * asset.current_mkt_price;
  }, 0);

  // Return the sum formatted to 2 decimal places
  return sum.toFixed(2);
});

const search = async (param) => {
  if(param.length !== 0) {
    searchResult.value = await stockApi.searchTicker(param);
  }
    if(searchResult.value.length === 0){
      searchResult.value = false
    }
    console.log(searchResult.value);
}

// const searchFilter = computed(() => {
//   console.log("test");
  
//   return searchResult.value.filter(res => res.ticker.toLowerCase().includes(searchModel.value.toLowerCase()))
  
// })

const goToStockView = (details) => {
  router.push({ 
    name: 'StockView', 
    params: { details: JSON.stringify(details) }
  })
}

const handleUpdateDetails = (updatedDetails) => {
      details.value = updatedDetails; // Update the details data
      // console.log("Updated Details:", details.value);
    };

</script>
 
<template>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">

<CreatePortSideBar class="side overflow-y-auto fixed top-16 left-0 
2xl:w-60 
xl:w-60 
md:w-40
sm:w-40
"
:details="details" 
@updateDetails="handleUpdateDetails" 
/>

<div class="all
2xl:ml-0
xl:ml-0
md:ml-20
sm:ml-20
">

<div v-if="Object.keys(details).length === 0 && details.constructor === Object"
class="p-4 border border-solid border-gray-400 justify-center flex rounded-2xl w-full"
>
<p>Please Select Portfolio</p>
</div>

<div v-if="Object.keys(details).length > 0 && details.constructor === Object"
class="p-3 border border-solid border-gray-400 rounded-2xl w-full"
>

<p class="text-zinc-800 ">
  <span class="text-zinc-500 text-lg">Port's Name:</span> {{ details.portfolio_name }}
</p>
<p class="text-zinc-800">
    <!-- Value: 
    <span v-for="asset in details.assets" :key="asset.id">
      &nbsp;{{ asset.quantity * asset.current_mkt_price }}&nbsp;USD
    </span>
    <br /> -->
    <span class="text-zinc-500 text-lg">Total Value:</span> {{ totalValue }} USD
  </p>
<p class="text-zinc-800 flex">
  <span class="text-zinc-500 text-lg">Assets:</span> 
  <div class="flex flex-col">
    <span v-for="asset in details.growth" @click="search(asset.name)" class="border border-solid border-zinc-800 p-2 m-2 cursor-default hover:text-yellow-500 transition duration-300">
     &nbsp;{{ asset.name }}&nbsp;{{ (asset.quantity * asset.latestPrice).toFixed(2) }} USD 
     ({{ ((asset.latestPrice - asset.current_mkt_price)/asset.current_mkt_price)*100 }} %)
      ({{ (asset.quantity).toFixed(8) }} shares)
    </span>
  </div>
</p>
</div>

<p class="text-zinc-800 m-1 mt-6 text-xl">Search stocks here</p>
<label class="search-box input input-bordered flex items-center gap-2 bg-white border border-zinc-400 border-solid rounded-2xl text-zinc-800 w-80 h-12 p-2">
  <input 
  type="text" 
  class="grow" 
  placeholder="What are you looking for ?" 
  v-model="searchModel"
  @keyup.enter = "search(searchModel)"
  />
  <!-- @input = "search(searchModel)" -->
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

<!-- <div class="result-container mt-5 flex flex-row flex-wrap gap-5 w-screen">
  <div v-for="(res, index) in searchResult" :key="index" class="result w-1/4">
    <div class="block space-y-2">
      <p class="text-3xl font-bold text-yellow-400">{{ res.ticker }}</p>
      <p><span class="highlight">Name:</span> {{ res.name }}</p>
      <p>
        <span class="highlight">Type:</span>
        {{ res.type === "CS" ? "Common Stock" : res.type }}
      </p>
      <RouterLink :to="{name:'StockView'}" 
      class="mt-3 float-right bg-yellow-400 text-zinc-800 p-1 rounded-lg border border-solid border-yellow-400 hover:bg-slate-900 hover:text-yellow-400 hover:border-yellow-400 hover:border hover:border-solid transition duration-3เ00">
      View
    </RouterLink>
    </div>
  </div>
</div>
<div v-if="searchResult === false" class="text-center">Not Found.</div> -->
<div v-if="searchResult.length > 0" class="border border-solid border-zinc-400 p-6 rounded-lg mt-4">
<div>Results: {{ searchResult.length }}</div>
<div class="result-container mt-5 flex flex-row flex-wrap gap-5 w-full overflow-y-auto ">
  <div v-for="(res, index) in searchResult" :key="index" class="result xl:w-1/3 lg:w-1/3 sm:w-3/4 md:text-lg sm:text-xs bg-zinc-800">
    <div class="block space-y-2">
      <p class="md:text-3xl sm:text-xl font-bold text-yellow-400">{{ res.ticker }}</p>
      <p><span class="highlight">Name:</span> {{ res.name }}</p>
      <p>
        <span class="highlight">Type:</span>
        {{ res.type === "CS" ? "Common Stock" : res.type }}
      </p>
      <button @click="goToStockView(res)"
      class="mt-3 float-right bg-yellow-400 text-zinc-800 p-1 rounded-lg border border-solid border-yellow-400 hover:bg-zinc-800 hover:text-yellow-400 hover:border-yellow-400 hover:border hover:border-solid transition duration-300">
        View
      </button>
    </div>
  </div>

  <!-- <div v-for="(res, index) in searchFilter" :key="index" class="result xl:w-1/3 lg:w-1/3 sm:w-3/4 md:text-lg sm:text-xs bg-zinc-800">
    <div class="block space-y-2">
      <p class="md:text-3xl sm:text-xl font-bold text-yellow-400">{{ res.ticker }}</p>
      <p><span class="highlight">Name:</span> {{ res.name }}</p>
      <p>
        <span class="highlight">Type:</span>
        {{ res.type === "CS" ? "Common Stock" : res.type }}
      </p>
      <button @click="goToStockView(res)"
      class="mt-3 float-right bg-yellow-400 text-zinc-800 p-1 rounded-lg border border-solid border-yellow-400 hover:bg-zinc-800 hover:text-yellow-400 hover:border-yellow-400 hover:border hover:border-solid transition duration-300">
        View
      </button>
    </div>
  </div> -->

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
  /* background-color: #161616; */
}

.result-container{
  max-height: 500px;
}

@media (max-width: 639px) {
  .side {
    width: 100px;
    /* margin-right: 50px; */
  }

  .all{
    margin-left: 55px;
  }

  .search-box{
    width: 275px;
  }
}
</style>