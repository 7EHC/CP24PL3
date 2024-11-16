<script setup>
import { ref, onMounted, onBeforeMount } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import Chart from "chart.js/auto"; // Import Chart.js

const { params } = useRoute()
let chartInstance = null // Store the chart instance globally
const currentDate = ref(new Date().toISOString().split("T")[0])
const result = JSON.parse(params.details) 
const growthValueArr = ref([])
const growthValue = ref()
const activeButton = ref(7)

const setActiveButton = (buttonValue, ticker) => {
  activeButton.value = buttonValue; // Update the active button state
  createNewChart(buttonValue, ticker); // Trigger the chart update
};

const isActiveButton = (buttonValue) => activeButton.value === buttonValue; // Check if a button is active


const getStockAgg = async (tic, timeFrame, from, to) => {
  try {
    const res = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${tic}/range/1/${timeFrame}/${from}/${to}?adjusted=true&sort=asc&apiKey=30mHX3fZfxe_ievjRkBlJJCjv6DvmpdU`
    );
    if (res.ok) {
      const data = await res.json();
      return data.results; // Return the results
    }
  } catch (error) {
    console.error(`ERROR: Cannot read data: ${error}`);
  }
}

const getPreviousDate = (dateString, daysAgo) => {
  const date = new Date(dateString); // Convert the input string to a Date object
  date.setDate(date.getDate() - daysAgo); // Subtract the number of days
  return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD and return
};

const createChart = (dates, closePrices) => {
  const ctx = document.getElementById("stockChart").getContext("2d");

  // If a chart already exists, destroy it before creating a new one
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates, // X-axis labels (dates)
      datasets: [
        {
          label: "Closing Prices", // Dataset label
          data: closePrices, // Y-axis data (closing prices)
          borderColor: "rgb(75, 192, 192)", // Line color
          tension: 0.1, // Smooth the curve
          borderColor: "#FFD700", // Yellow line color
          backgroundColor: "#9b9b9b",
        },
      ],
    },
    options: {
      responsive: true, // Enable responsiveness
      maintainAspectRatio: true, // Allow the chart to fill the container
      scales: {
        x: {
          title: {
            display: true,
            text: "Date", // X-axis title
          },
          ticks: {
            autoSkip: true, // Automatically skip ticks to avoid overlap
            maxTicksLimit: 12, // Limit the number of ticks
          },
        },
        y: {
          title: {
            display: true,
            text: "Closing Price (USD)", // Y-axis title
          },
        },
      },
    },
  });
};

const createNewChart = async (days, tic) => {
  const toDate = currentDate.value; // Set the end date
  let fromDate; // Declare fromDate variable
  let timeFrame = 'day'

  // Determine the fromDate based on the selected days using a switch statement
  switch (days) {
    case 1: // 1 Day
      fromDate = getPreviousDate(toDate, 1);
      break;
    case 7: // 1 Week
      fromDate = getPreviousDate(toDate, 7);
      timeFrame =  'hour'
      break;
    case 30: // 1 Month
      fromDate = getPreviousDate(toDate, 30);
      break;
    case 90: // 3 Months
      fromDate = getPreviousDate(toDate, 90);
      break;
    case 180: // 6 Months
      fromDate = getPreviousDate(toDate, 180);
      break;
    case 365: // 1 Year
      fromDate = getPreviousDate(toDate, 365);
      break;
    case 1095: // 3 Years
      fromDate = getPreviousDate(toDate, 1095);
      break;
    case 1825: // 5 Years
      fromDate = getPreviousDate(toDate, 1825);
      break;
    case 0: // All Time
      fromDate = "1980-01-01"; // Starting from a very old date
      break;
    case "YTD": // Year-to-Date
      const currentYear = new Date().getFullYear(); // Get the current year
      fromDate = `${currentYear}-01-01`; // Set the fromDate as the first of January of the current year
      break;
    default:
      console.warn("Invalid timeframe selected");
      return; // Exit if invalid days
  }

  // Fetch the stock data
  const results = await getStockAgg(tic, timeFrame, fromDate, toDate)
  // console.log(results)
  
  if (results) {
    // Extracting dates and closing prices
    if(results.length >= 75 && results.length <= 85){
      const dates = results.map((result) => {
      const date = new Date(result.t); // Convert timestamp to Date object
      date.setHours(date.getHours() + 7); // Adjust timezone by adding 7 hours

      const day = String(date.getDate()).padStart(2, "0") // Get the day with leading zero
      const month = date.toLocaleString("en-US", { month: "short" }) // Get the abbreviated month (e.g., Jan)
      const year = date.getFullYear(); // Get the full year
      const hours = String(date.getHours()).padStart(2, "0") // Get hours with leading zero
      const minutes = String(date.getMinutes()).padStart(2, "0") // Get minutes with leading zero

      return `${day} ${month} ${year}, ${hours}:${minutes}` // Return formatted date
    })

      const closePrices = results.map((result) => parseFloat(result.c)); // Extract and convert the close prices

      createChart(dates, closePrices); // Create the chart with the extracted data
      growthValueArr.value = []
      growthValueArr.value.push(results[0].c)
      growthValueArr.value.push(results[results.length - 1].c)
      // console.log(growthValueArr.value)
      growthValue.value = (((growthValueArr.value[1]-growthValueArr.value[0])/growthValueArr.value[0])*100).toFixed(2)
    }
    else{
      const dates = results.map((result) => {
      const date = new Date(result.t); // Convert timestamp to Date object
      date.setHours(date.getHours() + 7); // Adjust timezone by adding 7 hours

      const day = String(date.getDate()).padStart(2, "0"); // Get the day with leading zero
      const month = date.toLocaleString("en-US", { month: "short" }); // Get the abbreviated month (e.g., Jan)
      const year = date.getFullYear(); // Get the full year

      return `${day} ${month} ${year}`; // Return formatted date without time
    })

      const closePrices = results.map((result) => parseFloat(result.c)); // Extract and convert the close prices

      createChart(dates, closePrices); // Create the chart with the extracted data
      growthValueArr.value = []
      growthValueArr.value.push(results[0].c)
      growthValueArr.value.push(results[results.length - 1].c)
      // console.log(growthValueArr.value)
      growthValue.value = (((growthValueArr.value[1]-growthValueArr.value[0])/growthValueArr.value[0])*100).toFixed(2)
    }
  }
}

onMounted(async () => {
    // console.log("This is answer: "+params.details)
    // console.log(result)

    const toDate = currentDate.value; // Set the end date
    const fromDate = getPreviousDate(currentDate.value, 7); // Get the date for one week ago
    const results = await getStockAgg(result.ticker, 'hour', fromDate, toDate); // Fetch the stock data
    console.log(results)

    growthValueArr.value.push(results[0].c)
    growthValueArr.value.push(results[results.length - 1].c)
    // console.log(growthValueArr.value)
    growthValue.value = (((growthValueArr.value[1]-growthValueArr.value[0])/growthValueArr.value[0])*100).toFixed(2)
    // console.log(growthValue.value)

    if (results) {
    // Extracting dates and closing prices
    const dates = results.map((result) => {
      const date = new Date(result.t); // Convert timestamp to Date object
      date.setHours(date.getHours() + 7); // Adjust timezone by adding 7 hours

      const day = String(date.getDate()).padStart(2, "0") // Get the day with leading zero
      const month = date.toLocaleString("en-US", { month: "short" }) // Get the abbreviated month (e.g., Jan)
      const year = date.getFullYear(); // Get the full year
      const hours = String(date.getHours()).padStart(2, "0") // Get hours with leading zero
      const minutes = String(date.getMinutes()).padStart(2, "0") // Get minutes with leading zero

      return `${day} ${month} ${year}, ${hours}:${minutes}` // Return formatted date
    })

        const closePrices = results.map(result => parseFloat(result.c)); // Extract and convert the close prices

        createChart(dates, closePrices); // Create the chart with the extracted data
    }
})



</script>
 
<template>
<div class="-my-6">

    <RouterLink :to="{name: 'Port'}"
    class="
    back-but fixed top-20 left-24 font-bold text-lg bg-zinc-800  text-yellow-400 p-2 rounded-2xl hover:bg-yellow-400 hover:text-zinc-800 duration-300
    ">
      BACK
    </RouterLink>
    <button class="
    buy-sell-button fixed top-20 right-24 font-bold text-lg p-1 rounded-2xl 
    text-green-600 border border-solid border-green-600 
    hover:bg-green-600 hover:text-white
    w-1/12 duration-300
    ">
      BUY
    </button>
    <!-- <button>

    </button> -->

    <p class="text-xl font-bold text-zinc-400">{{ result.name }}</p>
    <p class="text-4xl font-bold text-zinc-800">{{ result.ticker }}</p>
    <!-- <p class="text-xl font-bold">{{ growthValue }}</p> -->
    <p 
  class="text-xl font-bold"
  :style="{
    color: growthValue > 0 ? '#23d000' : growthValue < 0 ? '#e44b4b' : 'black'
  }">
  {{ growthValue > 0 ? `+${growthValue} %` : growthValue < 0 ? `${growthValue} %` : growthValue }}
</p>
<div class="graph">
  <canvas id="stockChart" class="h-1/2 w-1/3"></canvas>
  <div class="button flex flex-row flex-wrap gap-5 w-full justify-center mt-2">
    <button
      class="graph-but"
      :class="{ 'bg-zinc-800 text-white': isActiveButton(1) }"
      @click="setActiveButton(1, result.ticker)"
    >
      1D
    </button>
    <button
      class="graph-but"
      :class="{ 'bg-zinc-800 text-white': isActiveButton(7) }"
      @click="setActiveButton(7, result.ticker)"
    >
      1W
    </button>
    <button
      class="graph-but"
      :class="{ 'bg-zinc-800 text-white': isActiveButton(30) }"
      @click="setActiveButton(30, result.ticker)"
    >
      1M
    </button>
    <button
      class="graph-but"
      :class="{ 'bg-zinc-800 text-white': isActiveButton(90) }"
      @click="setActiveButton(90, result.ticker)"
    >
      3M
    </button>
    <button
      class="graph-but"
      :class="{ 'bg-zinc-800 text-white': isActiveButton(180) }"
      @click="setActiveButton(180, result.ticker)"
    >
      6M
    </button>
    <button
      class="graph-but"
      :class="{ 'bg-zinc-800 text-white': isActiveButton('YTD') }"
      @click="setActiveButton('YTD', result.ticker)"
    >
      YTD
    </button>
    <button
      class="graph-but"
      :class="{ 'bg-zinc-800 text-white': isActiveButton(365) }"
      @click="setActiveButton(365, result.ticker)"
    >
      1Y
    </button>
    <button
      class="graph-but"
      :class="{ 'bg-zinc-800 text-white': isActiveButton(0) }"
      @click="setActiveButton(0, result.ticker)"
    >
      ALL TIME
    </button>
  </div>
</div>
</div>
</template>
 
<style scoped>
.graph-but{
    padding: 3px;
    transition: background-color 0.3s, color 0.3s; /* Smooth transition */
    border-radius: 10px;
    width: 75px;
}

.graph-but:hover{
    background-color: rgb(35, 35, 35);
    padding: 3px;
    color: white;
    border-radius: 10px;
}
@media (max-width: 1279px) {
    .back-but{
      left: 30px;
    }
    .buy-sell-button{
      right: 30px;
    }
}
@media (max-width: 639px) {
    .back-but{
      left: 5px;
      font-size: 10px;
      padding: 3px;
    }
    .buy-sell-button{
      right: 5px;
      font-size: 10px;
      padding: 3px;
    }
}
</style>