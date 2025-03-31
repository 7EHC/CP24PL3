<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, RouterLink } from "vue-router";
import Chart from "chart.js/auto"; // Import Chart.js
import stockApi from "../composable/FetchStock";
import { decodeToken } from "../composable/Auth";
import { useUserStore } from "../stores/userStore";
import {
  getTwelveDataRandomkey,
  getPolygonRandomKey,
} from "../composable/FetchStock";

const userStore = useUserStore();
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
const dayToShowGraph = ref(0);
const portsList = ref();
const showModal = ref(false);
const lastUpdatedDate = ref();
const currentMaketPrice = ref();
const selectedPortfolio = ref();
const amount = ref(0);
const shares = ref(0);
const modalValue = ref(null);
const portDetails = ref(null);
const selectedOption = ref("usd"); // zตั้งค่า default เป็น USD Amount
const isLimit = ref(false);
const bidPrice = ref(null);
const token = ref(localStorage.getItem("token"));
const userData = ref("");
let marketPriceInterval;
const buySellAlert = ref("default");
const buySellMsg = ref("");
const checkBalance = ref()

const checkToken = localStorage.getItem("token");

const setMarket = () => {
  isLimit.value = false;
};

const setLimit = () => {
  isLimit.value = true;
};

const sellAll = () => {
  amount.value = portDetails.value;
};
const setAmount = (value) => {
  amount.value = value;
};

const getPortDetails = async (id) => {
  try {
    const res = await stockApi.getPortDetails(id);
    const asset = res.assets.find((asset) => asset.name === result.ticker);

    portDetails.value = asset ? asset.quantity : null; // Set to quantity if found, otherwise null
    console.log(portDetails.value);
  } catch (error) {
    console.error("Error fetching portfolio details:", error);
  }
};

const isFormValid = computed(() => {
  if (!selectedPortfolio.value) return false;

  if (modalValue.value === "buy") {
    if (selectedOption.value === "usd") {
      // ✅ เช็กว่าใส่เงินถูกต้อง และเงินในกระเป๋าพอ
      return amount.value > 0 && amount.value <= Number(userStore.balance.replace(/,/g, ""));
    }  else if(selectedOption.value === "shares") {
      if(isLimit.value === true){
        // console.log('heyy')
        return Number(userStore.balance.replace(/,/g, "")) >= shares.value * bidPrice.value
      }else{
        return Number(userStore.balance.replace(/,/g, "")) >= shares.value * Number(currentMaketPrice.value[0].close).toFixed(2)
      }
      return shares.value > 0 && (!isLimit.value || bidPrice.value > 0)
      // console.log('hey')
    }
  }

  if (modalValue.value === "sell") {
    if (amount.value > portDetails.value) return false;
    return selectedOption.value === "usd"
      ? amount.value > 0
      : amount.value > 0 && (!isLimit.value || bidPrice.value > 0);
  }

  return false;
});

const getMarketPrice = async (tic) => {
  try {
    let key = getTwelveDataRandomkey();
    const res = await fetch(
      `https://api.twelvedata.com/time_series?apikey=${key}&interval=1min&timezone=Asia/Bangkok&format=JSON&symbol=${tic}`
    );
    if (res.ok) {
      const data = await res.json();
      return data.values; // Return the results
    }
  } catch (error) {
    console.error(`ERROR: Cannot read data: ${error}`);
  }
};

const stockTransaction = async (value) => {
  try {
    if (value === "buy") {
      let obj = {
        userId: userData.value.user_id,
        portId: selectedPortfolio.value,
        symbol: result.ticker,
        action: modalValue.value,
        totalAmount: amount.value,
      };

      if (selectedOption.value === "usd") {
        obj = {
          ...obj,
          status: "match",
          bidPrice: Number(currentMaketPrice.value[0].close).toFixed(2),
          actualPrice: Number(currentMaketPrice.value[0].close).toFixed(2),
          quantity: amount.value / Number(currentMaketPrice.value[0].close),
        };
        // console.log(obj)
      } else if (selectedOption.value === "shares") {
        if (isLimit.value === true) {
          obj = {
            ...obj,
            status: "pending",
            bidPrice:
              bidPrice.value >
              Number(currentMaketPrice.value[0].close).toFixed(2)
                ? Number(currentMaketPrice.value[0].close).toFixed(2)
                : bidPrice.value,
            totalAmount:
              bidPrice.value >
              Number(currentMaketPrice.value[0].close).toFixed(2)
                ? Number(currentMaketPrice.value[0].close).toFixed(2) *
                  shares.value
                : shares.value * bidPrice.value,
            actualPrice: "matching",
            quantity: shares.value,
          };
        } else {
          obj = {
            ...obj,
            status: "match",
            bidPrice: Number(currentMaketPrice.value[0].close).toFixed(2),
            totalAmount:
              shares.value *
              Number(currentMaketPrice.value[0].close).toFixed(2),
            actualPrice: Number(currentMaketPrice.value[0].close).toFixed(2),
            quantity: shares.value,
          };
        }
      }
      // console.log(obj)
      const response = await stockApi.createTransaction(obj);
      console.log("API Response:", response);

      if (response.message === "Transaction created successfully.") {
        showModal.value = false;
        // alert(`Successfully bought ${obj.symbol} at ${obj.bidPrice} USD.`);
        buySellAlert.value = "buy";
        buySellMsg.value = `Successfully bought ${obj.symbol} at ${obj.bidPrice} USD.`;
        clearFieldForSellandBuy();
        userStore.fetchBalance(userData.value.user_id);
        // ตั้งเวลา 3 วินาที (3000 มิลลิวินาที) แล้วเปลี่ยนเป็น "default"
        setTimeout(() => {
          buySellAlert.value = "default";
        }, 5000);
      } else {
        alert(response.message || "Failed to buy stock. Please try again.");
      }
    } else if (value === "sell") {
      // ตรวจสอบก่อนว่า amount.value ที่จะขายต้องไม่เกิน portDetails.value
      if (amount.value > portDetails.value) {
        alert(`You cannot sell more than ${portDetails.value} shares.`);
        return;
      }

      let obj = {
        userId: userData.value.user_id,
        portId: selectedPortfolio.value,
        symbol: result.ticker,
        action: modalValue.value,
      };

      if (isLimit.value === false) {
        obj = {
          ...obj,
          status: "match",
          bidPrice: Number(currentMaketPrice.value[0].close).toFixed(2),
          totalAmount:
            Number(currentMaketPrice.value[0].close).toFixed(2) * amount.value,
          actualPrice: Number(currentMaketPrice.value[0].close).toFixed(2),
          quantity: amount.value,
        };
      } else if (isLimit.value === true) {
        obj = {
          ...obj,
          status: "pending",
          bidPrice:
            bidPrice.value < Number(currentMaketPrice.value[0].close).toFixed(2)
              ? Number(currentMaketPrice.value[0].close).toFixed(2)
              : bidPrice.value,
          totalAmount:
            bidPrice.value < Number(currentMaketPrice.value[0].close).toFixed(2)
              ? amount.value *
                Number(currentMaketPrice.value[0].close).toFixed(2)
              : amount.value * bidPrice.value,
          actualPrice: "matching",
          quantity: amount.value,
        };
      }

      const response = await stockApi.createTransaction(obj);
      console.log("API Response:", response);

      if (response.message === "Transaction created successfully.") {
        showModal.value = false;
        // alert(`Successfully added sold ${obj.symbol} transaction at ${obj.totalAmount} USD.`);
        buySellAlert.value = "sell";
        buySellMsg.value = `Successfully added sold ${obj.symbol} transaction at ${obj.totalAmount} USD.`;
        clearFieldForSellandBuy();
        userStore.fetchBalance(userData.value.user_id);
        // ตั้งเวลา 3 วินาที (3000 มิลลิวินาที) แล้วเปลี่ยนเป็น "default"
        setTimeout(() => {
          buySellAlert.value = "default";
        }, 5000);
      } else {
        alert(response.message || "Failed to sell stock. Please try again.");
      }
    } else {
      throw new Error("Invalid operation. Value must be 'buy' or 'sell'.");
    }
  } catch (error) {
    console.error(`Error during stock ${value}:`, error);
    alert(
      `An error occurred while trying to ${value} stock. Please try again.`
    );
  }
};
const updateMarketPrice = async () => {
  currentMaketPrice.value = await getMarketPrice(result.ticker);
  // console.log(currentMaketPrice.value)
};

const openModal = async (value) => {
  modalValue.value = value;

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
};

const clearFieldForSellandBuy = () => {
  selectedPortfolio.value = "";
  amount.value = 0;
};

const closeModal = () => {
  // Clear the interval when closing the modal
  if (marketPriceInterval) {
    clearInterval(marketPriceInterval);
    marketPriceInterval = null; // Reset the interval ID
  }

  // Hide the modal
  showModal.value = false;
  clearFieldForSellandBuy();
};

const setActiveButton = (buttonValue, ticker) => {
  activeButton.value = buttonValue; // Update the active button state
  createNewChart(buttonValue, ticker); // Trigger the chart update
};

// const isMarketOpen = () => {
//   const currDate = new Date();
//   // currDate.setDate(currDate.getDate() + 1)
//   const months = currDate.toLocaleString("en-US", { month: "short" });
//   const year = currDate.getFullYear();
//   const hours = currDate.getHours();
//   const minutes = currDate.getMinutes();

//   lastUpdatedDate.value = `${currDate.getDate()} ${months} ${year} ${hours
//     .toString()
//     .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

//   const currDateTS = currDate.getTime();
//   // const currDateTS = new Date(currDate.setHours(5, 30, 0, 0)).getTime()
//   // console.log(currDate);

//   const openTime = new Date(currDate);
//   openTime.setHours(21, 30, 0, 0);

//   const openTime2 = new Date(currDate);
//   openTime2.setDate(openTime2.getDate() - 1);
//   openTime2.setHours(21, 30, 0, 0);

//   const closeTime = new Date(currDate);
//   closeTime.setDate(closeTime.getDate() + 1);
//   closeTime.setHours(4, 0, 0, 0);

//   const closeTime2 = new Date(currDate);
//   closeTime2.setHours(4, 0, 0, 0);

//   // console.log("ปัจจุบัน " + currDate + currDateTS);
//   // console.log("3 ครึ่งวันถัดไป " + openTime + openTime.getTime());
//   // console.log("ตี 4 วันถัดไป " + closeTime + closeTime.getTime());
//   // console.log("3 ครึ่งวันก่อนหน้า " + openTime2 + openTime2.getTime());
//   // console.log("ตี 4 วันก่อนหน้า " + closeTime2 + closeTime2.getTime());

//   if (
//     (currDateTS >= openTime.getTime() && currDateTS <= closeTime.getTime()) ||
//     (currDateTS >= openTime2.getTime() &&
//       currDateTS <= closeTime2.getTime() &&
//       currDate.getDay() != 0)
//   ) {
//     if (
//       currDateTS >= openTime2.getTime() &&
//       currDateTS <= closeTime2.getTime() &&
//       currDate.getDay() == 1
//     ) {
//       dayToShowGraph.value = 3;
//       marketOpen.value = false;
//     } else if (
//       currDateTS >= openTime.getTime() &&
//       currDateTS <= closeTime.getTime() &&
//       currDate.getDay() == 6
//     ) {
//       dayToShowGraph.value = 2;
//       marketOpen.value = false;
//     } else {
//       marketOpen.value = true;
//     }
//   } else {
//     if (currDate.getDay() == 0 || currDate.getDay() == 6) {
//       dayToShowGraph.value = 2;
//     } else if (currDate.getDay() == 1) {
//       dayToShowGraph.value = 3;
//     } else {
//       dayToShowGraph.value = 1;
//     }
//     marketOpen.value = false;
//   }
//   // console.log(marketOpen.value);
//   // console.log(dayToShowGraph.value);
// };

const getMarketStatus = async () => {
  const currDate = new Date();
  // currDate.setDate(currDate.getDate() + 1)
  const months = currDate.toLocaleString("en-US", { month: "short" });
  const year = currDate.getFullYear();
  const hours = currDate.getHours();
  const minutes = currDate.getMinutes();

  lastUpdatedDate.value = `${currDate.getDate()} ${months} ${year} ${hours
    .toString()
    .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

  if (currDate.getDay() == 0) {
    dayToShowGraph.value = 2;
  } else if (currDate.getDay() == 1) {
    dayToShowGraph.value = 3;
  } else {
    dayToShowGraph.value = 1;
  }
  try {
    let key = getPolygonRandomKey();
    const res = await fetch(
      `https://api.polygon.io/v1/marketstatus/now?apiKey=${key}`
    );
    if (res.ok) {
      const data = await res.json();
      // console.log(data.market);
      marketOpen.value =
        data.market === "open" || data.market === "extended hours";
    }
  } catch (error) {
    console.error(`ERROR: Cannot read data: ${error}`);
  }
};

const isActiveButton = (buttonValue) => activeButton.value === buttonValue; // Check if a button is active

const getStockAgg = async (tic, timeFrame, from, to) => {
  marketOpen.value = false;
  try {
    let key = getPolygonRandomKey();
    const res = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${tic}/range/1/${timeFrame}/${from}/${to}?adjusted=true&sort=asc&apiKey=${key}`
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
      intervalId = setInterval(() => {
        getStockRealtime(tic);
        // isMarketOpen();
        getMarketStatus();
        createNewChart(1, tic);
        updateMarketPrice();
      }, 60000);
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
      // isMarketOpen();
      getMarketStatus();
      console.log(dayToShowGraph.value);

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
  console.log(marketOpen.value);

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
  token.value && (userData.value = decodeToken(token.value));
  currentMaketPrice.value = await getMarketPrice(result.ticker);
  const test = decodeToken(token.value)
  // console.log(test.user_id)
  await userStore.fetchBalance(test.user_id)
  checkBalance.value = Number(userStore.balance.replace(/,/g, ""))
  // checkBalance.value = userStore.balance
  // console.log(checkBalance.value)
  // console.log(currentMaketPrice.value)
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
  <div class="-my-6 ml-14 mr-36">
    <transition name="fade">
      <div
        v-if="buySellAlert !== 'default'"
        class="p-4 fixed right-12 z-50 border-l-4"
        role="alert"
        :class="{
          'bg-green-100 border-green-500 text-green-700':
            buySellAlert === 'buy',
          'bg-red-100 border-red-500 text-red-700': buySellAlert === 'sell',
        }"
      >
        <p class="font-bold">Successfully</p>
        <p>{{ buySellMsg }}</p>
      </div>
    </transition>

    <RouterLink
      v-if="token"
      :to="{ name: 'Port' }"
      class="back-but fixed top-20 left-24 font-bold text-lg bg-zinc-800 text-yellow-400 p-2 rounded-2xl hover:bg-yellow-400 hover:text-zinc-800 duration-300"
    >
      BACK
    </RouterLink>
    <RouterLink
      v-if="!token"
      :to="{ name: 'Home' }"
      class="back-but fixed top-20 left-24 font-bold text-lg bg-zinc-800 text-yellow-400 p-2 rounded-2xl hover:bg-yellow-400 hover:text-zinc-800 duration-300"
    >
      BACK
    </RouterLink>

    <button
      v-if="token"
      class="buy-sell-button fixed top-20 right-24 font-bold text-lg p-1 rounded-2xl text-green-600 border border-solid border-green-600 hover:bg-green-600 hover:text-white w-1/12 duration-300"
      @click="openModal('buy')"
    >
      BUY
    </button>
    <button
      v-if="token"
      class="buy-sell-button fixed top-32 right-24 font-bold text-lg p-1 rounded-2xl text-red-600 border border-solid border-red-600 hover:bg-red-600 hover:text-white w-1/12 duration-300"
      @click="openModal('sell')"
    >
      SELL
    </button>

    <p
      class="text-xs font-semibold text-zinc-400 fixed mr-10 mt-5 right-14 sm:right-28 md:right-36 lg:right-40 xl:right-64 2xl:right-72"
      v-if="marketOpen"
    >
      Last updated: {{ lastUpdatedDate }}
    </p>
    <p class="text-xl font-bold text-zinc-400">{{ result.name }}</p>
    <p class="text-4xl font-bold text-zinc-800">{{ result.ticker }}</p>
    <!-- <p v-if="currentMaketPrice !== undefined" class="text-xl font-bold text-zinc-800">{{ Number(currentMaketPrice[0].close).toFixed(2) }}</p> -->
    <!-- <p class="text-xl font-bold">{{ growthValue }}</p> -->
    <p
      v-if="currentMaketPrice !== undefined"
      class="text-xl font-bold text-zinc-800"
    >
      {{ Number(currentMaketPrice[0].close).toFixed(2) }}
      <span
        class="text-lg font-bold"
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
      </span>
    </p>
    <div
      class="justify-center flex flex-row gap-6 text-zinc-800 -mt-7"
      v-if="currentMaketPrice !== undefined"
    >
      <p>Volume: {{ Number(currentMaketPrice[0].volume).toFixed(2) }}</p>
      <p>Open: {{ Number(currentMaketPrice[0].open).toFixed(2) }}</p>
      <p>High: {{ Number(currentMaketPrice[0].high).toFixed(2) }}</p>
      <p>Low: {{ Number(currentMaketPrice[0].low).toFixed(2) }}</p>
      <p>Close: {{ Number(currentMaketPrice[0].close).toFixed(2) }}</p>
    </div>
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
        <!-- buy section ------------------------------------------------------------------------------------>
        <div
          class="buy-modal bg-white p-6 rounded-lg w-96 shadow-lg"
          v-if="modalValue === 'buy'"
        >
          <h3 class="text-xl font-bold mb-4">Buy Stock</h3>

          <!-- Stock Details -->
          <div class="mb-4">
            <p class="text-gray-700 text-3xl font-bold">
              {{ result.ticker || "Loading..." }}
            </p>
            <p v-if="currentMaketPrice !== undefined">
              Latest price: {{ Number(currentMaketPrice[0].close).toFixed(2) }}
            </p>
          </div>

          <!-- Buy Amount -->
          <div class="mb-4">
            <div class="amount">
              <div class="buyChoice w-full flex flex-row justify-center">
                <button
                  @click="selectedOption = 'usd'"
                  class="mx-2 mb-2 border rounded-md p-1 w-1/2 text-zinc-600 hover:bg-gray-200 hover:transition-all"
                  :class="{
                    'font-bold': selectedOption === 'usd',
                    'bg-gray-200': selectedOption === 'usd',
                  }"
                >
                  USD Amount
                </button>
                <button
                  @click="selectedOption = 'shares'"
                  class="mx-2 mb-2 border rounded-md p-1 w-1/2 text-zinc-600 hover:bg-gray-200 hover:transition-all"
                  :class="{
                    'font-bold': selectedOption === 'shares',
                    'bg-gray-200': selectedOption === 'shares',
                  }"
                >
                  Shares
                </button>
              </div>

              <div class="amountUsd mt-3" v-if="selectedOption === 'usd'">
                <label
                  for="buyAmount"
                  class="block text-sm font-medium text-gray-700"
                >
                  Amount (USD) <span class="text-red-600">* required</span>
                </label>
                <div class="flex flex-row gap-4 my-2">
                  <button
                    @click="setAmount(50)"
                    class="border p-1 w-1/4 rounded-2xl cursor-default hover:bg-gray-200 text-zinc-600 duration-300 transition"
                  >
                    50
                  </button>
                  <button
                    @click="setAmount(100)"
                    class="border p-1 w-1/4 rounded-2xl cursor-default hover:bg-gray-200 text-zinc-600 duration-300 transition"
                  >
                    100
                  </button>
                  <button
                    @click="setAmount(250)"
                    class="border p-1 w-1/4 rounded-2xl cursor-default hover:bg-gray-200 text-zinc-600 duration-300 transition"
                  >
                    250
                  </button>
                  <button
                    @click="setAmount(500)"
                    class="border p-1 w-1/4 rounded-2xl cursor-default hover:bg-gray-200 text-zinc-600 duration-300 transition"
                  >
                    500
                  </button>
                </div>
                <div
                  class="flex items-center border border-gray-300 rounded-md bg-white px-3"
                >
                  <input
                    type="number"
                    id="buyAmount"
                    class="w-full px-2 py-2 focus:outline-none focus:ring-0 bg-white"
                    placeholder="Enter amount"
                    v-model="amount"
                    min="0"
                  />
                  <span class="text-zinc-600">USD</span>
                </div>
              </div>

              <div class="shares" v-if="selectedOption === 'shares'">
                <label
                  for="buyAmount"
                  class="block text-sm font-medium text-gray-700"
                >
                  Number of Shares <span class="text-red-600">* required</span>
                </label>
                <div
                  class="flex items-center border border-gray-300 rounded-md bg-white px-3"
                >
                  <input
                    type="number"
                    id="buyAmount"
                    class="w-full px-2 py-2 focus:outline-none focus:ring-0 bg-white"
                    placeholder="Enter amount"
                    v-model="shares"
                    min="0"
                  />
                  <span class="text-zinc-600">Shares</span>
                </div>

                <p class="mt-2">
                  Type of Buy Order
                  <span class="float-right mb-0">
                    <div class="flex items-center justify-center p-0">
                      <div
                        class="relative w-36 h-10 bg-gray-200 rounded-full flex items-center p-1"
                      >
                        <div
                          class="absolute top-1 left-1 h-8 w-16 bg-white rounded-full shadow-md transition-transform"
                          :class="{ 'translate-x-[110%]': isLimit }"
                        ></div>
                        <button
                          class="relative z-10 flex-1 text-center text-sm font-medium"
                          :class="isLimit ? 'text-gray-500' : 'text-black'"
                          @click="setMarket"
                        >
                          Market
                        </button>
                        <button
                          class="relative z-10 flex-1 text-center text-sm font-medium"
                          :class="isLimit ? 'text-black' : 'text-gray-500'"
                          @click="setLimit"
                        >
                          Limit
                        </button>
                      </div>
                    </div>
                  </span>
                </p>

                <div
                  class="flex items-center border border-gray-300 rounded-md bg-white px-3 mt-6"
                  v-if="isLimit === true"
                >
                  <input
                    type="number"
                    id="buyAmount"
                    class="w-full px-2 py-2 focus:outline-none focus:ring-0 bg-white"
                    placeholder="Limit price"
                    v-model="bidPrice"
                    min="0"
                  />
                  <span class="text-zinc-600">USD</span>
                </div>

                <p class="p-4 float-right m-0">
                  Estimate cost
                  <span class="font-semibold text-zinc-600"
                    >{{
                      isLimit === false
                        ? (shares * Number(currentMaketPrice[0].close)).toFixed(
                            2
                          )
                        : (bidPrice * shares).toFixed(2)
                    }}
                    USD</span
                  ><br/>
                </p>
              </div>
            </div>

            <label
              for="portfolioDropdown"
              class="block text-sm font-medium text-gray-700 mt-20"
            >
              Which port to enter? <span class="text-red-600">* required</span>
            </label>
            <select
              v-model="selectedPortfolio"
              id="portfolioDropdown"
              class="block w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-0 bg-white"
            >
              <option value="" disabled>Select a portfolio</option>
              <option
                v-for="port in portsList"
                :key="port._id"
                :value="port._id"
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
              @click="stockTransaction('buy')"
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
          <span v-if="isLimit === false && shares * currentMaketPrice[0].close > checkBalance" class="float-right text-red-600 font-medium text-sm mt-4">* Not enough money.</span>
          <span v-if="isLimit === true && shares * bidPrice > checkBalance" class="float-right text-red-600 font-medium text-sm mt-4">* Not enough money.</span>
          <span v-if="selectedOption === 'usd' && amount > checkBalance" class="float-right text-red-600 font-medium text-sm mt-4">* Not enough money.</span>
        </div>
        <!-- sell section ---------------------------------------------------------------------------------------------->
        <div
          class="buy-modal bg-white p-6 rounded-lg w-96 shadow-lg"
          v-if="modalValue === 'sell'"
        >
          <h3 class="text-xl font-bold mb-4">Sell Stock</h3>

          <!-- Stock Details -->
          <div class="mb-4">
            <p class="text-gray-700 text-3xl font-bold">
              {{ result.ticker || "Loading..." }}
            </p>
            <p v-if="currentMaketPrice !== undefined">
              Latest price: {{ Number(currentMaketPrice[0].close).toFixed(2) }}
            </p>
          </div>

          <!-- Buy Amount -->
          <div class="mb-4">
            <label
              for="portfolioDropdown"
              class="block text-sm font-medium text-gray-700 mt-2"
            >
              Sell from which port? <span class="text-red-600">* required</span>
            </label>
            <select
              v-model="selectedPortfolio"
              @change="getPortDetails(selectedPortfolio)"
              id="portfolioDropdown"
              class="block w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-0 bg-white"
            >
              <option value="" disabled>Select a portfolio</option>
              <option
                v-for="port in portsList"
                :key="port._id"
                :value="port._id"
              >
                {{ port.portfolio_name }}
              </option>
            </select>
            <p class="text-zinc-500" v-if="portDetails !== null">
              You have
              <span class="font-bold text-black">{{ portDetails }}</span> shares
            </p>
            <p class="text-red-500" v-if="portDetails === null">
              This port doesn't have
              <span class="font-semibold">{{ result.ticker }}</span>
            </p>

            <label
              for="buyAmount"
              class="block text-sm font-medium text-gray-700 mt-5"
            >
              Shares of stock to sell
              <span class="text-red-600">* required at least 1</span>
            </label>

            <button
              @click="sellAll"
              class="border p-1 w-1/4 rounded-2xl cursor-default hover:bg-gray-200 text-zinc-600 duration-300 transition my-2"
            >
              Sell All
            </button>
            <div
              class="flex items-center border border-gray-300 rounded-md bg-white px-3"
            >
              <input
                type="number"
                id="buyAmount"
                class="w-full px-2 py-2 focus:outline-none focus:ring-0 bg-white"
                placeholder="Share"
                v-model="amount"
                min="0"
              />
              <span class="text-zinc-600">Shares</span>
            </div>
            <!-- <p>≈ {{ Number(amount*currentMaketPrice[0].close).toFixed(2) }} USD</p> -->
            <p class="mt-2 mb-8">
              Type of Sell Order
              <span class="float-right mb-0">
                <div class="flex items-center justify-center p-0">
                  <div
                    class="relative w-36 h-10 bg-gray-200 rounded-full flex items-center p-1"
                  >
                    <div
                      class="absolute top-1 left-1 h-8 w-16 bg-white rounded-full shadow-md transition-transform"
                      :class="{ 'translate-x-[110%]': isLimit }"
                    ></div>
                    <button
                      class="relative z-10 flex-1 text-center text-sm font-medium"
                      :class="isLimit ? 'text-gray-500' : 'text-black'"
                      @click="setMarket"
                    >
                      Market
                    </button>
                    <button
                      class="relative z-10 flex-1 text-center text-sm font-medium"
                      :class="isLimit ? 'text-black' : 'text-gray-500'"
                      @click="setLimit"
                    >
                      Limit
                    </button>
                  </div>
                </div>
              </span>
            </p>

            <div
              class="flex items-center border border-gray-300 rounded-md bg-white px-3 mt-6"
              v-if="isLimit === true"
            >
              <input
                type="number"
                id="buyAmount"
                class="w-full px-2 py-2 focus:outline-none focus:ring-0 bg-white"
                placeholder="Limit price"
                v-model="bidPrice"
                min="0"
              />
              <span class="text-zinc-600">USD</span>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-4">
            <p v-if="marketOpen === false">Market is closed.</p>
            <button
              class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="!isFormValid"
              @click="stockTransaction('sell')"
            >
              Sell
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
/* เอฟเฟกต์ fade-in / fade-out */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
