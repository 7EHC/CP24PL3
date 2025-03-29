<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import stockApi from "../composable/FetchStock";
import { getTwelveDataRandomkey } from "../composable/FetchStock";
import { decodeToken } from "../composable/Auth";
import {
  DotsVerticalIcon,
  PencilAltIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/vue/outline";
import Loading from "./Loading.vue";

const API_ROOT = import.meta.env.VITE_ROOT_API;
const portsList = ref([]);
const createDeleteVaue = ref("");
const showModal = ref(false);
const portName = ref();
const portObj = ref({});
const router = useRouter();
const editDelete = ref(false);
const isLoading = ref(false);
const idToUpdate = ref("");
const portNameToUpdate = ref("");
const msgAlert = ref("default");
const msgDisplay = ref("");

const activeEditDelete = () => {
  editDelete.value = !editDelete.value;
};

// Props
defineProps({
  details: Object,
});

// Emit
const emit = defineEmits(["updateDetails"]);

// Toggle modal visibility
const actionToggle = (action, id = "", curname = "") => {
  idToUpdate.value = id;
  console.log("ID: " + idToUpdate.value);
  portNameToUpdate.value = curname;
  console.log("Portname: " + portNameToUpdate.value);
  createDeleteVaue.value = action;
  showModal.value = true;
};

// Close modal
const closeModal = () => {
  showModal.value = false;
};

const token = ref(localStorage.getItem("token"));
const userData = ref("");
// console.log(token.value);

const confirmDelete = async () => {
  msgDisplay.value = "";
  const result = await stockApi.deletePortfolio(idToUpdate.value);
  portsList.value = await stockApi.getPort();
  closeModal();
  msgAlert.value = result.success ? "success" : "fail";
  msgDisplay.value = result.message;
  setTimeout(() => (msgAlert.value = "default"), 5000);
};

const confirmRename = async () => {
  msgDisplay.value = "";
  const result = await stockApi.updatePortfolioName(
    idToUpdate.value,
    portNameToUpdate.value
  );
  result.success && closeModal();
  msgAlert.value = result.success ? "success" : "fail";
  msgDisplay.value = result.message;
  if (result.success) portsList.value = await stockApi.getPort();
  setTimeout(() => (msgAlert.value = "default"), 5000);
};

const createPortPOST = async (portfolioObj) => {
  try {
    const res = await fetch(`${API_ROOT}/portfolios/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(portfolioObj), // Ensure portfolioObj is passed here
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    } else {
      console.log(`ERROR: Server responded with status ${res.status}`);
    }
  } catch (error) {
    console.log(`ERROR cannot send data: ${error}`);
  }
};

// Fetch portfolio details
const fetchDetails = async (id) => {
  isLoading.value = true;
  emit("updateDetails", {});
  try {
    // Fetch portfolio details
    // const response = await fetch(`${API_ROOT}/portfolios/portDetails/${id}`);
    const response = await stockApi.getPortDetails(id);
    // if (response.ok) {
      const portDetails = response;
      console.log("Portfolio Details (Before Update):", portDetails);

      // Extract assets for stock symbols, quantities, and current market prices
      const stockAssets = portDetails.assets.map((asset) => ({
        name: asset.name,
        quantity: asset.quantity,
        current_mkt_price: parseFloat(asset.current_mkt_price) || null, // Ensure current market price is numeric
      }));

      // Function to fetch the latest market price for a stock
      const getMarketPrice = async (tic) => {
        try {
          let key = getTwelveDataRandomkey();
          const res = await fetch(
            `https://api.twelvedata.com/time_series?apikey=${key}&interval=1min&timezone=Asia/Bangkok&format=JSON&symbol=${tic}`
          );
          if (res.ok) {
            const data = await res.json();
            // Assuming the latest price is the first value in `data.values`
            return parseFloat(data.values[0]?.close) || null;
          } else {
            console.error(`Failed to fetch data for ${tic}`);
            return null; // Handle API failures gracefully
          }
        } catch (error) {
          console.error(`ERROR: Cannot read data for ${tic}: ${error}`);
          return null; // Handle errors gracefully
        }
      };

      // Fetch market prices and merge with quantities and current market prices
      const fetchGrowthData = async () => {
        const growthData = await Promise.all(
          stockAssets.map(async (asset) => {
            const latestPrice = await getMarketPrice(asset.name);
            return {
              name: asset.name,
              latestPrice,
              quantity: asset.quantity, // Include quantity from assets
              current_mkt_price: asset.current_mkt_price, // Include current market price from assets
            };
          })
        );

        // Add the growth data to portDetails
        portDetails.growth = growthData;

        console.log("Updated Portfolio Details with Growth:", portDetails);

        // Emit the updated details with growth
        emit("updateDetails", portDetails);
      };

      await fetchGrowthData(); // Fetch and add the growth field
    // } else {
    //   console.error(`Error fetching details: ${response.status}`);
    // }
  } catch (error) {
    console.error("Error fetching details:", error);
  } finally {
    isLoading.value = false;
  }
};

const getMarketPrice = async (tic) => {
  try {
    const res = await fetch(
      `https://api.twelvedata.com/time_series?apikey=984dc8de4646430c9c330fd43c045204&interval=1min&timezone=Asia/Bangkok&format=JSON&symbol=${tic}`
    );
    if (res.ok) {
      const data = await res.json();
      return data.values; // Return the results
    }
  } catch (error) {
    console.error(`ERROR: Cannot read data: ${error}`);
  }
};

const createPortBut = async () => {
  const portObj = {
    // Initialize portObj here as an object
    userId: userData.value.user_id,
    portfolio_name: portName.value,
    assets: [],
  };

  await createPortPOST(portObj); // Pass portObj directly
  closeModal();
};

// Handle click on portfolio item
const handlePortfolioClick = (id) => {
  fetchDetails(id); // Call fetchDetails with the selected portfolio ID
};

onMounted(async () => {
  if (token.value) {
    userData.value = decodeToken(token.value);
    // console.log(userData.value.username);
  }
  portsList.value = await stockApi.getPort();
  // console.log(portsList.value);
});
</script>

<template>
  <div class="flex overflow-y-auto">
    <teleport to="body">
      <transition name="fade">
        <div
          v-if="msgAlert !== 'default'"
          class="p-6 fixed right-10 top-20 z-50 border-l-4 shadow-lg rounded-sm"
          role="alert"
          :class="{
            'bg-green-100 border-green-500 text-green-700':
              msgAlert === 'success',
            'bg-red-100 border-red-500 text-red-700': msgAlert === 'fail',
          }"
        >
          <p class="font-semibold">{{ msgDisplay }}</p>
        </div>
      </transition>
    </teleport>
    <!-- Sidebar -->
    <div class="w-60 h-screen bg-zinc-800 p-4 text-white sticky top-0">
      <!-- Create Portfolio Button -->
      <button
        @click="actionToggle('create')"
        class="create bg-yellow-400 text-zinc-900 font-bold w-full px-4 py-2 rounded-2xl mb-4 hover:bg-yellow-300 duration-300"
      >
        + CREATE PORTFOLIO
      </button>

      <div
        @click="activeEditDelete"
        class="px-2 py-1 float-right flex items-center space-x-1 cursor-pointer transition hover:bg-zinc-600 duration-300 rounded-md"
        :class="{ 'bg-zinc-600': editDelete === true }"
      >
        <PencilIcon class="w-5 h-5" />
        <p>EDIT</p>
      </div>

      <!-- List of Portfolios -->
      <ul class="space-y-2 mt-12 overflow-y-auto">
        <li
          v-if="editDelete === false"
          v-for="portfolio in portsList"
          :key="portfolio.id"
          class="list bg-zinc-700 p-3 rounded hover:bg-zinc-600 duration-300 cursor-pointer"
          @click="handlePortfolioClick(portfolio._id)"
        >
          {{ portfolio.portfolio_name }}
        </li>

        <li
          v-if="editDelete === true"
          v-for="portfolio in portsList"
          :key="portfolio.id"
          class="list bg-zinc-700 p-3 rounded duration-300 cursor-pointer"
        >
          <div class="flex justify-between items-center">
            <p>{{ portfolio.portfolio_name }}</p>
            <div v-if="editDelete === true" class="flex space-x-2">
              <PencilAltIcon
                @click="
                  actionToggle(
                    'update',
                    portfolio._id,
                    portfolio.portfolio_name
                  )
                "
                class="w-6 h-6 text-blue-500 hover:text-blue-300 duration-200"
              />
              <TrashIcon
                @click="actionToggle('delete', portfolio._id)"
                class="w-6 h-6 text-red-500 hover:text-red-300 duration-200"
              />
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Modal using Teleport -->
    <teleport to="body">
      <div
        v-if="showModal === true"
        class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      >
        <div
          v-if="createDeleteVaue === 'create'"
          class="bg-white p-6 rounded-lg w-80"
        >
          <h3 class="text-xl font-bold mb-4">Create Portfolio</h3>
          <form>
            <div class="mb-4">
              <label
                for="portfolioName"
                class="block text-sm font-medium text-gray-700"
                >Portfolio Name</label
              >
              <input
                v-model="portName"
                type="text"
                id="portfolioName"
                class="mt-1 w-full px-4 py-2 border bg-white border-gray-300 rounded-md"
                placeholder="Enter portfolio name"
              />
            </div>
            <button
              @click="createPortBut"
              type="submit"
              class="w-full bg-yellow-400 text-zinc-900 p-2 rounded-lg hover:bg-yellow-300 font-bold duration-300"
            >
              Create
            </button>
          </form>

          <button
            @click="closeModal"
            class="mt-4 text-gray-500 hover:text-gray-700"
          >
            Close
          </button>
        </div>

        <div
          v-if="createDeleteVaue === 'delete'"
          class="bg-white p-6 rounded-lg w-960"
        >
          <h3 class="text-xl font-bold mb-4 text-red-600">Delete Portfolio</h3>
          <p class="text-gray-700">
            Are you sure you want to delete this portfolio?
          </p>

          <div class="flex justify-end space-x-3 mt-6">
            <button
              @click="closeModal"
              class="px-4 py-2 rounded-lg text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              @click="confirmDelete"
              class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold duration-200"
            >
              Delete
            </button>
          </div>
        </div>

        <div
          v-if="createDeleteVaue === 'update'"
          class="bg-white p-6 rounded-lg w-960"
        >
          <h3 class="text-xl font-bold mb-4 text-blue-600">Rename Portfolio</h3>

          <form @submit.prevent="confirmRename">
            <div class="mb-4">
              <label
                for="portfolioName"
                class="block text-sm font-medium text-gray-700"
                >New Portfolio Name</label
              >
              <input
                v-model="portNameToUpdate"
                type="text"
                id="portfolioName"
                class="mt-1 w-full px-4 py-2 border text-black bg-white border-gray-300 rounded-md"
                placeholder="Enter new portfolio name"
                required
              />
              <!-- <p v-if="msgAlert === 'fail'" class="text-sm text-red-500">{{ msgDisplay }}</p> -->
            </div>

            <div class="flex justify-end space-x-3 mt-6">
              <button
                @click="closeModal"
                type="button"
                class="px-4 py-2 rounded-lg text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold duration-200"
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>

    <Loading :isLoading="isLoading" />
  </div>
</template>

<style scoped>
@media (max-width: 639px) {
  .create {
    font-size: 10px;
  }
  .list {
    font-size: 10px;
  }
}
</style>
