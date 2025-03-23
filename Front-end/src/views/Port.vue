<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import stockApi from "../composable/FetchStock";
import { RouterLink, useRoute, useRouter } from "vue-router";
import CreatePortSideBar from "../components/CreatePortSideBar.vue";
import { Chart } from "chart.js/auto"; // Import Chart.js

const searchResult = ref([]);
const searchModel = ref();
const router = useRouter();
const details = ref({});
const latestClosePrice = ref();
const pieChart = ref(null); // Reference for the Chart.js instance
const chartInstance = ref(null); // Store the Chart.js instance

const totalValue = computed(() => {
  if (!details.value.assets || details.value.assets.length === 0) return 0;
  const sum = details.value.assets.reduce((sum, asset) => {
    if (!asset.quantity || !asset.current_mkt_price) return sum; // Skip invalid assets
    return sum + asset.quantity * asset.current_mkt_price;
  }, 0);
  return sum.toFixed(2);
});

const search = async (param) => {
  if (param.length !== 0) {
    searchResult.value = await stockApi.searchTicker(param);
  }
  if (searchResult.value.length === 0) {
    searchResult.value = false;
  }
  console.log(searchResult.value);
};

// const searchFilter = computed(() => {
//   console.log("test");

//   return searchResult.value.filter(res => res.ticker.toLowerCase().includes(searchModel.value.toLowerCase()))

// })

const goToStockView = (details) => {
  router.push({
    name: "StockView",
    params: { details: JSON.stringify(details) },
  });
};

const createOrUpdateChart = () => {
  nextTick(() => {
    // Ensure DOM updates are complete
    const canvas = document.getElementById("pieChart");
    if (!canvas) {
      // console.error("Canvas element not found");
      return;
    }

    const ctx = canvas.getContext("2d");

    // Ensure assets have data
    if (!details.value.assets || details.value.assets.length === 0) {
      console.error("No assets available for chart");
      // Destroy chart if no valid data
      if (chartInstance.value) {
        chartInstance.value.destroy();
        chartInstance.value = null; // Clear the chart instance
      }
      return;
    }

    const labels = details.value.assets.map((asset) => asset.name);

    // Calculate the total value of all assets
    const totalValue = details.value.assets.reduce(
      (sum, asset) =>
        sum + asset.quantity * parseFloat(asset.current_mkt_price),
      0
    );

    // Calculate the value for each asset as a percentage of total value
    const data = details.value.assets.map(
      (asset) =>
        ((asset.quantity * parseFloat(asset.current_mkt_price)) / totalValue) *
        100 // Percentage of total value
    );

    // Define yellow color palette for the pie slices
    const yellowColors = [
      "#ffd539",
      "#9f8220",
      "#daac00",
      "#dec77c",
      "#896900",
    ];

    // Destroy previous chart instance if exists
    if (chartInstance.value) {
      chartInstance.value.destroy();
    }

    chartInstance.value = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: yellowColors.slice(0, data.length), // Ensure we only use as many colors as there are slices
            hoverBackgroundColor: yellowColors.slice(0, data.length), // Hover effect with the same color palette
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              label: function (tooltipItem) {
                const assetName = labels[tooltipItem.dataIndex];
                const percentage = data[tooltipItem.dataIndex].toFixed(2); // Percentage of total value
                return `${assetName}: ${percentage}%`;
              },
            },
          },
        },
      },
    });
  });
};

// Watch for changes in `details` and call createOrUpdateChart
// watch(details, (newDetails) => {
//   if (newDetails?.assets?.length) {
//     createOrUpdateChart();
//   } else {
//     console.log("No assets found in details");
//   }
// }, { deep: true, immediate: true });
watch(
  () =>
    details.value.assets?.map(({ name, quantity, current_mkt_price }) => ({
      name,
      quantity,
      current_mkt_price,
    })),
  (newAssets, oldAssets) => {
    if (JSON.stringify(newAssets) !== JSON.stringify(oldAssets)) {
      createOrUpdateChart();
    }
  },
  { deep: true, immediate: true }
);

const handleUpdateDetails = (updatedDetails) => {
  details.value = updatedDetails; // Update the details
};
</script>

<template>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
    rel="stylesheet"
  />

  <CreatePortSideBar
    class="side overflow-y-auto fixed top-16 left-0 2xl:w-60 xl:w-60 md:w-40 sm:w-40"
    :details="details"
    @updateDetails="handleUpdateDetails"
  />

  <div class="all 2xl:ml-48 xl:ml-48 md:ml-28 sm:ml-28">
    <!-- If not select portfolio dialog -->
    <div
      v-if="Object.keys(details).length === 0 && details.constructor === Object"
      class="p-4 border border-solid border-gray-400 justify-center flex rounded-2xl w-full"
    >
      <p>Please Select Portfolio</p>
    </div>

    <div
      v-if="Object.keys(details).length > 0 && details.constructor === Object"
      class="p-6 md:p-8 border border-gray-300 rounded-2xl w-full flex flex-col md:flex-row bg-white shadow-xl"
    >
      <!-- Portfolio Info Section -->
      <div class="w-full md:w-1/2 flex flex-col gap-6 text-">
        <p class="text-gray-800">
          <span class="text-gray-500 text-lg">Port's Name: </span>
          <span class="font-semibold">{{ details.portfolio_name }}</span>
        </p>
        <p class="text-gray-800">
          <span class="text-gray-500 text-lg">Total Value: </span>
          <span class="font-semibold">{{ totalValue }} USD</span>
        </p>

        <!-- Assets List Section -->
        <div class="text-gray-800">
          <span class="text-gray-500 text-lg">Assets:</span>
          <div
            class="flex flex-col mt-4 gap-3 border border-gray-200 rounded-lg bg-gray-50 shadow-inner"
          >
            <div
              v-for="asset in details.growth"
              :key="asset.name"
              class="cursor-pointer"
            >
              <div
                @click="asset.isOpen = !asset.isOpen && search(asset.name)"
                class="p-4 flex justify-between hover:bg-gray-200 transition-all duration-300 ease-in-out"
              >
                <span class="font-medium text-gray-700">{{ asset.name }}</span>
                <span class="text-gray-600 text-sm"
                  >{{
                    (asset.quantity * asset.latestPrice).toFixed(2)
                  }}
                  USD</span
                >
                <span
                  :class="{
                    'text-green-600':
                      asset.latestPrice - asset.current_mkt_price >= 0,
                    'text-red-600':
                      asset.latestPrice - asset.current_mkt_price < 0,
                  }"
                  class="text-sm"
                >
                  {{
                    Number(
                      ((asset.latestPrice - asset.current_mkt_price) /
                        asset.current_mkt_price) *
                        100
                    ).toFixed(2)
                  }}%
                </span>
              </div>

              <!-- Asset Details -->
              <transition name="fade">
                <div
                  v-if="asset.isOpen"
                  class="p-4 border-t border-gray-200 bg-gray-100"
                >
                  <span class="text-gray-500 text-sm"
                    >{{ asset.name }} Shares:
                  </span>
                  <span class="font-medium">
                    {{
                      Number.isInteger(asset.quantity)
                        ? asset.quantity
                        : asset.quantity.toFixed(8)
                    }}
                    shares
                  </span>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>

      <!-- Portfolio Graph Section -->
      <div
        class="w-full md:w-1/2 mt-6 md:mt-0 flex justify-center items-center"
      >
        <canvas
          v-if="details.assets.length > 0"
          id="pieChart"
          class="chart-canvas w-56 h-80 md:w-96 md:h-96"
        ></canvas>
      </div>
    </div>

    <p class="text-zinc-800 m-1 mt-6 text-xl">Search stocks here</p>
    <label
      class="search-box input input-bordered flex items-center gap-2 bg-white border border-zinc-400 border-solid rounded-2xl text-zinc-800 w-80 h-12 p-2"
    >
      <input
        type="text"
        class="grow"
        placeholder="What are you looking for ?"
        v-model="searchModel"
        @keyup.enter="search(searchModel)"
      />
      <!-- @input = "search(searchModel)" -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        class="h-4 w-4 opacity-70"
      >
        <path
          fill-rule="evenodd"
          d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
          clip-rule="evenodd"
        />
      </svg>
    </label>

    <div
      v-if="searchResult.length > 0"
      class="border border-solid border-zinc-400 p-6 rounded-lg my-4"
    >
      <div>Results: {{ searchResult.length }}</div>
      <div
        class="result-container mt-5 flex flex-row flex-wrap gap-5 w-full overflow-y-auto"
      >
        <div
          v-for="(res, index) in searchResult"
          :key="index"
          class="result xl:w-1/3 lg:w-1/3 sm:w-3/4 md:text-lg sm:text-xs bg-zinc-800"
        >
          <div class="block space-y-2">
            <p class="md:text-3xl sm:text-xl font-bold text-yellow-400">
              {{ res.ticker }}
            </p>
            <p><span class="highlight">Name:</span> {{ res.name }}</p>
            <p>
              <span class="highlight">Type:</span>
              {{ res.type === "CS" ? "Common Stock" : res.type }}
            </p>
            <button
              @click="goToStockView(res)"
              class="mt-3 float-right bg-yellow-400 text-zinc-800 p-1 rounded-lg border border-solid border-yellow-400 hover:bg-zinc-800 hover:text-yellow-400 hover:border-yellow-400 hover:border hover:border-solid transition duration-300"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="searchResult === false" class="text-center">Not Found.</div>
  </div>
</template>

<style scoped>
.all {
  font-family: "Kanit", sans-serif;
  font-style: normal;
}

.chart-canvas {
  width: 100%; /* Make the canvas take up the full width of its parent container */
  height: 500px; /* Maintain aspect ratio, or you can set a specific height like 300px */
  /* border: #161616 solid 1px */
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

.result-container {
  max-height: 500px;
}

@media (max-width: 639px) {
  .side {
    width: 100px;
    /* margin-right: 50px; */
  }

  .all {
    margin-left: 55px;
  }

  .search-box {
    width: 275px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
