<script setup>
import { ref, onMounted } from 'vue';
import stockApi from '../composable/FetchStock';
import { getPolygonRandomKey } from '../composable/FetchStock'
import { useRouter } from 'vue-router';

const search = ref(false)
const searchQuery = ref("")
const searchResult = ref([])
const changeArr = ref([])
const top20 = ref([])
const mag7 = ref([])
const router = useRouter()

const searchStock = async (param) => {
  if (searchQuery.value.trim().length === 0) {
    searchResult.value = [];
    return;
  }
  
  // ดึงข้อมูลหุ้นจาก API และจำกัดที่ 20 รายการ
  const results = await stockApi.searchTicker(searchQuery.value)
  searchResult.value = results.slice(0, 18);
}

const searchModal = ()=>{
  search.value = !search.value
}

const selectStock = (stock) => {
  // searchQuery.value = stock; // ตั้งค่าชื่อหุ้นที่เลือกไปที่ช่องค้นหา
  // searchResult.value = []; // ล้างผลลัพธ์หลังเลือก

  router.push({ 
    name: 'StockView', 
    params: { details: JSON.stringify(stock) }
  })
}

onMounted(async () => {
  const getPreviousBusinessDay = ()=>{
    const date = new Date();
    date.setDate(date.getDate() - 1); // ถอยไป 1 วันก่อน

    // ถ้าวันที่เป็นวันเสาร์ (6) -> ถอยกลับไปวันศุกร์ (1 วัน)
    // ถ้าวันที่เป็นวันอาทิตย์ (0) -> ถอยกลับไปวันศุกร์ (2 วัน)
    if (date.getDay() === 6) date.setDate(date.getDate() - 1);
    if (date.getDay() === 0) date.setDate(date.getDate() - 2);

    return date.toLocaleDateString('en-CA'); // ใช้ en-CA เพื่อให้ได้ YYYY-MM-DD
  }
  // console.log(getPreviousBusinessDay())

  const getChangeStock = async (tic) => {
        try {
          let key = getPolygonRandomKey()
          let day = getPreviousBusinessDay()
          const res = await fetch(
            `https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/${day}?adjusted=true&apiKey=${key}`
          );
          if (res.ok) {
            const data = await res.json();
            // Assuming the latest price is the first value in `data.values`
            return data.results
          } else {
            console.error(`Failed to fetch data for ${tic}`);
            return null; // Handle API failures gracefully
          }
        } catch (error) {
          console.error(`ERROR: Cannot read data for ${tic}: ${error}`);
          return null; // Handle errors gracefully
        }
      };
  
  changeArr.value = await getChangeStock()  
  // console.log(changeArr.value)
  const getTop20Stocks = (stocks) => {
    if (!stocks || !Array.isArray(stocks)) return [];

    return stocks
      .map(stock => {
        const changePercent = ((stock.c - stock.o) / stock.o) * 100;
        return { T: stock.T, change: `${changePercent.toFixed(2)}%` }; // แปลงค่าเป็น string พร้อม %
      })
      .sort((a, b) => parseFloat(b.change) - parseFloat(a.change)) // เรียงจากมากไปน้อย
      .slice(0, 20);
  }
  const getMagnificent7Stocks = (stocks) => {
    if (!stocks || !Array.isArray(stocks)) return [];

    // รายชื่อหุ้นที่ต้องการคัดเลือก
    const magnificent7 = ["META", "NVDA", "GOOGL", "TSLA", "AAPL", "AMZN", "MSFT"];

    return stocks
      .filter(stock => magnificent7.includes(stock.T)) // เลือกเฉพาะหุ้นที่อยู่ใน Magnificent 7
      .map(stock => ({
        T: stock.T, 
        change: ((stock.c - stock.o) / stock.o) * 100 // เปลี่ยนเป็นตัวเลขที่ติดลบได้
      }));
  }

  top20.value = getTop20Stocks(changeArr.value)
  mag7.value = getMagnificent7Stocks(changeArr.value)
  // console.log(top20.value)

})
</script>
 
<template>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
<div>

  <div v-if="search === false">
    <p class="slogan text-6xl ml-3 text-yellow-400 flex flex-col gap-3 bg-zinc-900 w-1/2 p-2 md:w-2/3 sm:w-2/3 rounded-2xl">
        <span>Invest <span class="text-white">Smart</span></span>
        <span>Learn <span class="text-white">Safe</span></span>
        <span>With <span class="text-white">SIT Invest</span></span>
    </p>

    <div class="introduce flex flex-col justify-center text-center mt-40">
        <!-- <p class="text-3xl text-black">สร้างพอร์ต เทรด ออม</p> -->
    <p class="introduce p-2 text-2xl text-zinc-700 leading-10">
        <!-- ยินดีต้อนรับสู่ SIT Invest — แอปพลิเคชันที่ให้คุณสัมผัสประสบการณ์การลงทุนเสมือนจริงในตลาดหุ้นอเมริกา ไม่ว่าจะเป็นหุ้นรายตัวหรือ ETF 
        ให้คุณได้ทดสอบกลยุทธ์และสำรวจโลกการลงทุนได้อย่างปลอดภัยและง่ายดาย! ด้วยเครื่องมือที่ทันสมัยและข้อมูลที่อัปเดตแบบเรียลไทม์ คุณจะสามารถฝึกทักษะการลงทุนได้อย่างมั่นใจ -->
        Welcome to <span class="bg-zinc-900 text-yellow-400 p-1 rounded-2xl">SIT Invest</span> — your gateway to a realistic investment experience in the U.S. stock market.
         With SIT Invest, you can safely explore the world of investing, test strategies, and manage a virtual portfolio featuring individual stocks and ETFs. 
         Designed for all levels, our app offers real-time data and easy-to-use tools that empower you to develop your financial acumen in a secure environment.
    </p>
    </div>

    <div class="w-full flex flex-col mt-10 items-center">
      <button @click="searchModal" class="bg-yellow-400 text-zinc-900 text-lg p-2 px-5 font-bold rounded-2xl hover:bg-yellow-300 duration-300 mt-6">
      Let's start investing
      </button>
    </div>

  </div>

  <div class="w-full flex justify-center" v-if="search === true">
    <button @click="searchModal" class="fixed top-24 left-10 font-bold text-lg bg-zinc-800 text-yellow-400 p-2 rounded-2xl hover:bg-yellow-400 hover:text-zinc-800 duration-300">
        BACK
      </button>

      <div class="relative w-1/2">
        <!-- Magnify Icon -->
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
            d="M21 21l-4.35-4.35m0 0a7.5 7.5 0 1 0-10.61 0 7.5 7.5 0 0 0 10.61 0z" />
        </svg>

        <!-- Search Box -->
        <input 
          type="text" 
          v-model="searchQuery"
          @input="searchStock"
          class="text-zinc-800 w-full pl-10 pr-4 py-2 bg-white border-gray-300 border rounded-md focus:ring-2 focus:ring-yellow-400 focus:outline-none" 
          placeholder="Search stock here..." />

        <!-- Search Results Dropdown -->
        <ul v-if="searchResult.length > 0" class="absolute w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg z-50">
          <li 
            v-for="stock in searchResult" 
            :key="stock" 
            @mousedown.prevent="selectStock(stock)"
            class="p-2 hover:bg-gray-200 cursor-pointer text-zinc-800">
            {{ stock.ticker }} - {{ stock.name }}
          </li>
        </ul>

      </div>

</div>

<div v-if="search === true" class="w-full">

  <div v-if="top20.length === 0" class="fixed inset-0 flex items-center justify-center">
      <div class="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
  </div>

  <div v-if="mag7.length>0">
    <p class="text-3xl font-bold text-center bg-gradient-to-r bg-zinc-800 text-yellow-400 py-4 rounded-lg shadow-md mt-6">
    🔥 Magnificent 7 Stocks
    </p>
    <div class="bg-white shadow-lg rounded-xl p-5 border border-gray-200 my-6">
      <!-- <p class="text-xl font-bold text-gray-800 mb-4">🔥 Magnificent 7 Stocks</p> -->
      <ul>
        <li 
          v-for="(stock, index) in mag7" 
          :key="stock.T" 
          class="flex justify-between items-center text-lg font-semibold my-2 border-b pb-2 last:border-b-0">
          <span class="text-gray-700">{{ index + 1 }}. {{ stock.T }}</span>
          <span :class="{'text-green-500': stock.change >= 0, 'text-red-500': stock.change < 0}">
            {{ stock.change >= 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}%
          </span>
        </li>
      </ul>
    </div>
  </div>
  

  <div class="top20 mt-10 text-zinc-800" v-if="top20.length > 0">
  <p class="text-3xl font-bold text-center bg-gradient-to-r bg-zinc-800 text-yellow-400 py-4 rounded-lg shadow-md">
    🚀 Top 20 Fastest Rising Stocks Last Night
  </p>

  <div class="grid md:grid-cols-2 gap-6 my-6">
    <!-- คอลัมน์ที่ 1 (10 อันดับแรก) -->
    <ul class="bg-white shadow-lg rounded-xl p-5 border border-gray-200">
      <li 
        v-for="(stock, index) in top20.slice(0, 10)" 
        :key="'first-' + index" 
        class="flex justify-between items-center text-lg font-semibold my-2 border-b pb-2 last:border-b-0">
        <span class="text-gray-700">{{ index + 1 }}. {{ stock.T }}</span>
        <span class="text-green-500">+{{ stock.change }}</span>
      </li>
    </ul>

    <!-- คอลัมน์ที่ 2 (10 อันดับหลัง) -->
    <ul class="bg-white shadow-lg rounded-xl p-5 border border-gray-200">
      <li 
        v-for="(stock, index) in top20.slice(10, 20)" 
        :key="'second-' + index" 
        class="flex justify-between items-center text-lg font-semibold my-2 border-b pb-2 last:border-b-0">
        <span class="text-gray-700">{{ index + 11 }}. {{ stock.T }}</span>
        <span class="text-green-500">+{{ stock.change }}</span>
      </li>
    </ul>
  </div>
</div>

</div>
  
</div>

</template>
 
<style scoped>
p{
  font-family: "Kanit", sans-serif;
  font-style: normal;
}
@media (max-width: 639px) {
  .slogan {
    width: 80%;
    font-size: xx-large;
  }
  .introduce {
    font-size: small;
  }
}
</style>