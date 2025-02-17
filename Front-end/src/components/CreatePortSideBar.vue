<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'
import stockApi from '../composable/FetchStock';
import { getTwelveDataRandomkey } from '../composable/FetchStock';
import { decodeToken } from '../composable/Auth';

const API_ROOT = import.meta.env.VITE_ROOT_API;
const portsList = ref([]);
const showModal = ref(false);
const portName = ref()
const portObj = ref({})
const router = useRouter()

// Props
defineProps({
  details: Object, 
});

// Emit
const emit = defineEmits(['updateDetails'])

// Toggle modal visibility
const createPortfolio = () => {
  showModal.value = true;
};

// Close modal
const closeModal = () => {
  showModal.value = false;
};

const token = ref(localStorage.getItem("token"));
const userData = ref("");
console.log(token.value);


const createPortPOST = async (portfolioObj) => {
    try {
        const res = await fetch(`${API_ROOT}/portfolios/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(portfolioObj)  // Ensure portfolioObj is passed here
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
}

// Fetch portfolio details
const fetchDetails = async (id) => {
  try {
    // Fetch portfolio details
    const response = await fetch(`${API_ROOT}/portfolios/portDetails/${id}`);
    if (response.ok) {
      const portDetails = await response.json();
      console.log("Portfolio Details (Before Update):", portDetails);

      // Extract assets for stock symbols, quantities, and current market prices
      const stockAssets = portDetails.assets.map(asset => ({
        name: asset.name,
        quantity: asset.quantity,
        current_mkt_price: parseFloat(asset.current_mkt_price) || null, // Ensure current market price is numeric
      }));

      // Function to fetch the latest market price for a stock
      const getMarketPrice = async (tic) => {
        try {
          let key = getTwelveDataRandomkey()
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
        emit('updateDetails', portDetails);
      };

      await fetchGrowthData(); // Fetch and add the growth field
    } else {
      console.error(`Error fetching details: ${response.status}`);
    }
  } catch (error) {
    console.error("Error fetching details:", error);
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
  }

const createPortBut = async () => {
    const portObj = {  // Initialize portObj here as an object
        userId: userData.value.user_id,
        portfolio_name: portName.value,
        assets: []
    };

    await createPortPOST(portObj);  // Pass portObj directly
    closeModal()
}

// Handle click on portfolio item
const handlePortfolioClick = (id) => {
  fetchDetails(id); // Call fetchDetails with the selected portfolio ID
};

onMounted(async () => {
  if (token.value) {
    userData.value = decodeToken(token.value)
    console.log(userData.value.username);
  }
  portsList.value = await stockApi.getPort();
  // console.log(portsList.value);
});


</script>

<template>
  <div class="flex overflow-y-auto">
    <!-- Sidebar -->
    <div class="w-60 h-screen bg-zinc-800 p-4 text-white sticky top-0">
      <!-- Create Portfolio Button -->
      <button @click="createPortfolio" class="create bg-yellow-400 text-zinc-900 font-bold w-full px-4 py-2 rounded-2xl mb-4 hover:bg-yellow-300 duration-300">
        + Create Portfolio
      </button>

      <!-- List of Portfolios -->
      <ul class="space-y-2 max-h-96 overflow-y-auto">
        <!-- <li v-for="portfolio in portsList" :key="portfolio.id" class="list bg-zinc-700 p-3 rounded hover:bg-zinc-600 duration-300">
          {{ portfolio.portfolio_name }}
        </li> -->

        <li
          v-for="portfolio in portsList"
          :key="portfolio.id"
          class="list bg-zinc-700 p-3 rounded hover:bg-zinc-600 duration-300 cursor-pointer"
          @click="handlePortfolioClick(portfolio._id)"
        >
          {{ portfolio.portfolio_name }}
        </li>
      </ul>
    </div>

<!-- Modal using Teleport -->
    <teleport  to="body">
    <div v-if="showModal === true" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-white p-6 rounded-lg w-80">
        <h3 class="text-xl font-bold mb-4">Create Portfolio</h3>
        <form>
          <div class="mb-4">
            <label for="portfolioName" class="block text-sm font-medium text-gray-700">Portfolio Name</label>
            <input v-model="portName" type="text" id="portfolioName" class="mt-1 w-full px-4 py-2 border bg-white border-gray-300 rounded-md" placeholder="Enter portfolio name" />
          </div>
          <button @click="createPortBut" type="submit" class="w-full bg-yellow-400 text-zinc-900 p-2 rounded-lg hover:bg-yellow-300 font-bold duration-300">Create</button>
        </form>
        
        <button @click="closeModal" class="mt-4 text-gray-500 hover:text-gray-700">
          Close
        </button>
      </div>
    </div>
  </teleport>
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
