<script setup>
import { ref, onMounted, computed  } from "vue";
import { useRoute, RouterLink } from "vue-router";
import Chart from "chart.js/auto"; // Import Chart.js
import stockApi from "../composable/FetchStock";

const { params } = useRoute();
let chartInstance = null; // Store the chart instance globally
let intervalId = null;
const currentDate = ref(new Date().toISOString().split("T")[0]);
const result = JSON.parse(params.details);
const growthValueArr = ref([]);
const growthValue = ref();
const activeButton = ref(7);
const marketOpen = ref(false);
const numOfDay = ref(0);
const dayToShowGraph = ref(0)
const portsList = ref();
const showModal = ref(false);
const lastUpdatedDate = ref()
// const start = ref()
// const end = ref()
const currentMaketPrice = ref()
const selectedPortfolio = ref()
const amount = ref()
let marketPriceInterval

const isFormValid = computed(() => {
  return amount.value > 0 && selectedPortfolio.value; // Valid if both fields are filled
});

const buyStockintoPort = async()=>{
  const obj = {
    portfolio_name: selectedPortfolio.value,
    symbol: result.ticker,
    quantity: amount.value/currentMaketPrice.value[0].close,
    current_mkt_price: currentMaketPrice.value[0].close
  }
  // console.log(obj)
  // await stockApi.buyStock(obj)
  try {
    const response = await stockApi.buyStock(obj);
    console.log("API Response:", response);

    // Adjust the success condition based on the response structure
    if (response.message === "เพิ่มหุ้นสำเร็จ") {
      console.log("Stock purchased successfully:", response);
      showModal.value = false; // Close the modal
    } else {
      console.error("Failed to purchase stock:", response.message || "Unknown error");
      alert(response.message || "Failed to purchase stock. Please try again.");
    }
  } catch (error) {
    console.error("Error purchasing stock:", error);
    alert("An error occurred while processing your request. Please try again.");
  }
}

const openModal = async () => {
  const getMarketPrice = async (tic) => {
    try {
      const res = await fetch(
        `https://api.twelvedata.com/time_series?apikey=a812690526f24184b0347c0ce8899b8b&interval=1min&timezone=Asia/Bangkok&format=JSON&symbol=${tic}`
      );
      if (res.ok) {
        const data = await res.json();
        return data.values; // Return the results
      }
    } catch (error) {
      console.error(`ERROR: Cannot read data: ${error}`);
    }
  };

  const updateMarketPrice = async () => {
    currentMaketPrice.value = await getMarketPrice(result.ticker)
    // console.log(currentMaketPrice.value)
  };

  // Initial update
  await updateMarketPrice();

  // Clear any existing interval before setting a new one
  if (marketPriceInterval) {
    clearInterval(marketPriceInterval);
  }

  // Set a new interval to update every 1 minute
  marketPriceInterval = setInterval(updateMarketPrice, 60000);

  // Show the modal
  showModal.value = true;
}

const closeModal = () => {
  // Clear the interval when closing the modal
  if (marketPriceInterval) {
    clearInterval(marketPriceInterval);
    marketPriceInterval = null; // Reset the interval ID
  }

  // Hide the modal
  showModal.value = false;
};

const setActiveButton = (buttonValue, ticker) => {
  activeButton.value = buttonValue; // Update the active button state
  createNewChart(buttonValue, ticker); // Trigger the chart update
};

const isMarketOpen = () => {
  const currDateTime = new Date();
  const days = currDateTime.toLocaleString("en-US", { weekday: "short" });
  const months = currDateTime.toLocaleString("en-US", { month: "short"})
  const year = currDateTime.getFullYear()
  const hours = currDateTime.getHours();
  const minutes = currDateTime.getMinutes();
  lastUpdatedDate.value = `${currDateTime.getDate()} ${months} ${year} ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  if (days[0] !== "S" && ((hours > 21 ||(hours === 21 && minutes >= 30) || hours < 4))) {
    marketOpen.value = true;
  } else {
    if(days === "Sun") {
      dayToShowGraph.value = 2
    } else if (days === "Mon") {
      dayToShowGraph.value = 3
    } else {
      dayToShowGraph.value = 1
    }
    marketOpen.value = false;
  }
};

const isActiveButton = (buttonValue) => activeButton.value === buttonValue; // Check if a button is active

const getStockAgg = async (tic, timeFrame, from, to) => {
  marketOpen.value = false;
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
};

// const formatDate = (date) => {
//   const year = date.getFullYear();
//   const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
//   const day = String(date.getDate()).padStart(2, '0');
//   const hours = String(date.getHours()).padStart(2, '0');
//   const minutes = String(date.getMinutes()).padStart(2, '0');
//   const seconds = String(date.getSeconds()).padStart(2, '0');

//   return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
// }

// const getMarketTimes = () => {
//   const currentDate = new Date();

//   // Set market open time to today's date at 20:30 (8:30 PM)
//   const startTime = new Date(currentDate); // Get the current date and time
//   startTime.setDate(currentDate.getDate() - 1); // Set to next day
//   startTime.setHours(20, 30, 0, 0); // Set to 8:30 PM today
//   // console.log(startTime before formatting = ${startTime});
//   const startFormatted = formatDate(startTime); // Format start time to "YYYY-MM-DD HH:mm:ss"
//   // console.log(startFormatted after formatting = ${startFormatted});

//   // Set market close time to tomorrow's date at 04:00 (4:00 AM)
//   const endTime = new Date(currentDate); // Get the current date and time
//   endTime.setDate(currentDate.getDate() + 1); // Set to next day
//   endTime.setHours(4, 0, 0, 0); // Set to 4:00 AM tomorrow
//   const endFormatted = formatDate(endTime); // Format end time to "YYYY-MM-DD HH:mm:ss"
//   // console.log(endFormatted after formatting = ${endFormatted});

//   // Assign the formatted values to the start and end
//   start.value = startFormatted;
//   end.value = endFormatted;
// }

const getStockRealtime = async (tic) => {
  // getMarketTimes()
  try {
    if (marketOpen.value === true) {
      const res = await fetch(
        `https://api.twelvedata.com/time_series?apikey=a812690526f24184b0347c0ce8899b8b&interval=1min&timezone=Asia/Bangkok&format=JSON&symbol=${tic}`
        // `https://api.twelvedata.com/time_series?apikey=984dc8de4646430c9c330fd43c045204&interval=1min&start_date=${start.value}&end_date=${end.value}&symbol=${tic}&timezone=Asia/Bangkok&format=JSON`
      );
      if (res.ok) {
        const data = await res.json();

        return data.values; // Return the results
      }
    }
  } catch (error) {
    console.error(`ERROR: Cannot read data: ${error}`);
  }
};

const getPreviousDate = (dateString, daysAgo) => {
  const date = new Date(dateString); // Convert the input string to a Date object
  date.setDate(date.getDate() - daysAgo); // Subtract the number of days
  return date.toISOString().split("T")[0]; // Format as YYYY-MM-DD and return
};

const RealtimeApiCall = (tic) => {
  if (marketOpen.value) {
    if (!intervalId) {
      intervalId = setInterval(() => {getStockRealtime(tic); isMarketOpen(); createNewChart(1, tic)}, 60000);
    }
  } else {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
  // if (marketOpen.value) {
  //   if (!intervalId) {
  //     // Initialize interval when the market is open
  //     intervalId = setInterval(async () => {
  //       try {
  //         // Fetch real-time stock price and update currentMarketPrice
  //         const price = await getStockRealtime(tic);
  //         currentMaketPrice.value = price; // Update current price
          
  //         // Additional calls
  //         isMarketOpen();
  //         createNewChart(1, tic);
  //       } catch (error) {
  //         console.error("Error fetching stock price:", error);
  //       }
  //     }, 60000); // Run every 60 seconds
  //   }
  // } else {
  //   // Clear interval when the market is closed
  //   if (intervalId) {
  //     clearInterval(intervalId);
  //     intervalId = null;
  //   }
  // }
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
            text: numOfDay.value !== 1 ? "Date" : "Time", // X-axis title
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
  let timeFrame = "day";
  numOfDay.value = days;

  // Determine the fromDate based on the selected days using a switch statement
  switch (days) {
    case 1: // 1 Day
      isMarketOpen();
      fromDate = getPreviousDate(toDate, dayToShowGraph.value);
      timeFrame = "hour";
      RealtimeApiCall(tic);
      break;
    case 7: // 1 Week
      fromDate = getPreviousDate(toDate, 7);
      timeFrame = "hour";
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

  let results;

  if (days !== 1) {
    // Fetch the stock data
    results = await getStockAgg(tic, timeFrame, fromDate, toDate);
    RealtimeApiCall(tic);
  } else {
    if (marketOpen.value === false) {
      results = await getStockAgg(tic, timeFrame, fromDate, toDate);
    } else {
      const getStockData = await getStockRealtime(tic);
      const sortedData = getStockData.sort(
        (a, b) => new Date(a.datetime) - new Date(b.datetime)
      );
      results = sortedData;
    }
  }

  if (results) {
    if (results.length <= 85) {
      let dates;
      if (marketOpen.value) {
        dates = results.map((result) => {
          const date = new Date(result.datetime);
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${hours}:${minutes}`;
        });
      } else {
        dates = results.map((result) => {
          const date = new Date(result.t); // Convert timestamp to Date object
          date.setHours(date.getHours() + 7); // Adjust timezone by adding 7 hours
          const day = String(date.getDate()).padStart(2, "0"); // Get the day with leading zero
          const month = date.toLocaleString("en-US", { month: "short" }); // Get the abbreviated month (e.g., Jan)
          const year = date.getFullYear(); // Get the full year
          const hours = String(date.getHours()).padStart(2, "0"); // Get hours with leading zero
          const minutes = String(date.getMinutes()).padStart(2, "0"); // Get minutes with leading zero

          return numOfDay.value !== 1
            ? `${day} ${month} ${year}, ${hours}:${minutes}`
            : `${hours}:${minutes}`; // Return formatted date
        });
      }

      const closePrices = results.map((result) =>
        parseFloat(marketOpen.value === false ? result.c : result.close)
      ); // Extract and convert the close prices

      createChart(dates, closePrices); // Create the chart with the extracted data
      growthValueArr.value = [];
      growthValueArr.value.push(
        marketOpen.value === false ? results[0].c : results[0].close
      );
      growthValueArr.value.push(
        marketOpen.value === false
          ? results[results.length - 1].c
          : results[results.length - 1].close
      );
      // console.log(growthValueArr.value)
      growthValue.value = (
        ((growthValueArr.value[1] - growthValueArr.value[0]) /
          growthValueArr.value[0]) *
        100
      ).toFixed(2);
    } else {
      const dates = results.map((result) => {
        const date = new Date(result.t); // Convert timestamp to Date object
        date.setHours(date.getHours() + 7); // Adjust timezone by adding 7 hours

        const day = String(date.getDate()).padStart(2, "0"); // Get the day with leading zero
        const month = date.toLocaleString("en-US", { month: "short" }); // Get the abbreviated month (e.g., Jan)
        const year = date.getFullYear(); // Get the full year

        return `${day} ${month} ${year}`; // Return formatted date without time
      });

      const closePrices = results.map((result) => parseFloat(result.c)); // Extract and convert the close prices

      createChart(dates, closePrices); // Create the chart with the extracted data
      growthValueArr.value = [];
      growthValueArr.value.push(results[0].c);
      growthValueArr.value.push(results[results.length - 1].c);
      // console.log(growthValueArr.value)
      growthValue.value = (
        ((growthValueArr.value[1] - growthValueArr.value[0]) /
          growthValueArr.value[0]) *
        100
      ).toFixed(2);
    }
  }
};

onMounted(async () => {
  // currentMaketPrice.value = await getStockRealtime(result.ticker)
  // console.log("This is answer: "+params.details)
  // console.log(result)
  portsList.value = await stockApi.getPort();
  const toDate = currentDate.value; // Set the end date
  const fromDate = getPreviousDate(currentDate.value, 7); // Get the date for one week ago
  const results = await getStockAgg(result.ticker, "hour", fromDate, toDate); // Fetch the stock data

  growthValueArr.value.push(results[0].c);
  growthValueArr.value.push(results[results.length - 1].c);
  // console.log(growthValueArr.value)
  growthValue.value = (
    ((growthValueArr.value[1] - growthValueArr.value[0]) /
      growthValueArr.value[0]) *
    100
  ).toFixed(2);
  // console.log(growthValue.value)

  if (results) {
    // Extracting dates and closing prices
    const dates = results.map((result) => {
      const date = new Date(result.t); // Convert timestamp to Date object
      date.setHours(date.getHours() + 7); // Adjust timezone by adding 7 hours

      const day = String(date.getDate()).padStart(2, "0"); // Get the day with leading zero
      const month = date.toLocaleString("en-US", { month: "short" }); // Get the abbreviated month (e.g., Jan)
      const year = date.getFullYear(); // Get the full year
      const hours = String(date.getHours()).padStart(2, "0"); // Get hours with leading zero
      const minutes = String(date.getMinutes()).padStart(2, "0"); // Get minutes with leading zero

      return `${day} ${month} ${year}, ${hours}:${minutes}`; // Return formatted date
    });

    const closePrices = results.map((result) => parseFloat(result.c)); // Extract and convert the close prices

    createChart(dates, closePrices); // Create the chart with the extracted data
  }
});
</script>

<template>
  <div class="-my-6">
    <RouterLink
      :to="{ name: 'Port' }"
      class="back-but fixed top-20 left-24 font-bold text-lg bg-zinc-800 text-yellow-400 p-2 rounded-2xl hover:bg-yellow-400 hover:text-zinc-800 duration-300"
    >
      BACK
    </RouterLink>
    <button
      class="buy-sell-button fixed top-20 right-24 font-bold text-lg p-1 rounded-2xl text-green-600 border border-solid border-green-600 hover:bg-green-600 hover:text-white w-1/12 duration-300"
      @click="openModal()"
    >
      BUY
    </button>

    <p class="text-xs font-semibold text-zinc-400 fixed mt-5 right-14 sm:right-28 md:right-36 lg:right-40 xl:right-64 2xl:right-72" v-if="marketOpen">Last updated: {{ lastUpdatedDate }}</p>
    <p class="text-xl font-bold text-zinc-400">{{ result.name }}</p>
    <p class="text-4xl font-bold text-zinc-800">{{ result.ticker }}</p>
    <!-- <p class="text-xl font-bold">{{ growthValue }}</p> -->
    <p
      class="text-xl font-bold"
      :style="{
        color:
          growthValue > 0 ? '#23d000' : growthValue < 0 ? '#e44b4b' : 'black',
      }"
    >
      {{
        growthValue > 0
          ? `+${growthValue} %`
          : growthValue < 0
          ? `${growthValue} %`
          : growthValue
      }}
    </p>
    <div class="graph">
      <canvas id="stockChart" class="h-1/2 w-1/3"></canvas>
      <div
        class="button flex flex-row flex-wrap gap-5 w-full justify-center mt-2"
      >
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
    <teleport to="body">
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
  >
    <div class="bg-white p-6 rounded-lg w-96 shadow-lg">
      <h3 class="text-xl font-bold mb-4">Buy Stock</h3>

      <!-- Stock Details -->
      <div class="mb-4">
        <p class="text-gray-700 text-3xl font-bold">
          {{ result.ticker || "Loading..." }}
        </p>
        <p v-if="currentMaketPrice !== undefined">Latest price: {{ currentMaketPrice[0].close }}</p>
      </div>

      <!-- Buy Amount -->
      <div class="mb-4">
        <label
          for="buyAmount"
          class="block text-sm font-medium text-gray-700"
        >
          Amount (USD)
        </label>
        <input
          type="number"
          id="buyAmount"
          class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter amount"
          v-model="amount"
        />
        <label
          for="portfolioDropdown"
          class="block text-sm font-medium text-gray-700 mt-2"
        >
          Which port to enter?
        </label>
        <select
          v-model="selectedPortfolio"
          id="portfolioDropdown"
          class="block w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="" disabled>Select a portfolio</option>
          <option
            v-for="port in portsList"
            :key="port._id"
            :value="port.portfolio_name"
          >
            {{ port.portfolio_name }}
          </option>
        </select>
      </div>

      <!-- Buttons -->
      <div class="flex justify-end gap-4">
        <p v-if="marketOpen === false">Market is closed.</p>
        <button
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!isFormValid"
          @click="buyStockintoPort"
        >
          Buy
        </button>
        <button
          @click="closeModal"
          class="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 duration-300"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</teleport>
  </div>
</template>

<style scoped>
.graph-but {
  padding: 3px;
  transition: background-color 0.3s, color 0.3s; /* Smooth transition */
  border-radius: 10px;
  width: 75px;
}

.graph-but:hover {
  background-color: rgb(35, 35, 35);
  padding: 3px;
  color: white;
  border-radius: 10px;
}
@media (max-width: 1279px) {
  .back-but {
    left: 30px;
  }
  .buy-sell-button {
    right: 30px;
  }
}
@media (max-width: 639px) {
  .back-but {
    left: 5px;
    font-size: 10px;
    padding: 3px;
  }
  .buy-sell-button {
    right: 5px;
    font-size: 10px;
    padding: 3px;
  }
}
</style>
