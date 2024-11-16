<script setup>
import { ref, onMounted } from "vue";
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
const portsList = ref();
const showModal = ref(false);

const openModal = async () => {
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const setActiveButton = (buttonValue, ticker) => {
  activeButton.value = buttonValue; // Update the active button state
  createNewChart(buttonValue, ticker); // Trigger the chart update
};

const isMarketOpen = () => {
  const currDateTime = new Date();
  const days = currDateTime.toLocaleString("en-US", { weekday: "short" });
  const hours = currDateTime.getHours();
  const minutes = currDateTime.getMinutes();
  if (days[0] !== "S" && ((hours >= 20 && minutes >= 30) || hours < 4)) {
    marketOpen.value = true;
  } else {
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

const getStockRealtime = async (tic) => {
  try {
    if (marketOpen.value === true) {
      const res = await fetch(
        `https://api.twelvedata.com/time_series?apikey=a812690526f24184b0347c0ce8899b8b&interval=1min&timezone=Asia/Bangkok&format=JSON&symbol=${tic}`
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
      intervalId = setInterval(() => getStockRealtime(tic), 60000);
    }
  } else {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
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
      fromDate = getPreviousDate(toDate, 1);
      timeFrame = "hour";
      isMarketOpen();
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
    <!-- <button>

    </button> -->

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
            <!-- <p><strong>Market Price:</strong> {{ stockDetails.marketPrice || 'Loading...' }}</p> -->
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
            />
            <label
              for="buyAmount"
              class="block text-sm font-medium text-gray-700 mt-2"
            >
              Which port to enter?
            </label>
            <select
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
            <button
              class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 duration-300"
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
