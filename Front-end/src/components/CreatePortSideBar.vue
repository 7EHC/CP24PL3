<script setup>
import { ref, onMounted } from 'vue';
import stockApi from '../composable/FetchStock';

const portsList = ref([]);
const showModal = ref(false);
const portName = ref()
const portObj = ref({})

// Toggle modal visibility
const createPortfolio = () => {
  showModal.value = true;
};

// Close modal
const closeModal = () => {
  showModal.value = false;
};

const createPortPOST = async (portfolioObj) => {
    try {
        const res = await fetch(`http://localhost:5000/stock/createPort`, {
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

const createPortBut = async () => {
    const portObj = {  // Initialize portObj here as an object
        portfolio_name: portName.value,
        assets: []
    };

    await createPortPOST(portObj);  // Pass portObj directly
    closeModal()
}

onMounted(async () => {
  portsList.value = await stockApi.getPort();
  console.log(portsList.value);
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
        <li v-for="portfolio in portsList" :key="portfolio.id" class="list bg-zinc-700 p-3 rounded hover:bg-zinc-600 duration-300">
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
            <input v-model="portName" type="text" id="portfolioName" class="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md" placeholder="Enter portfolio name" />
          </div>
          <button @click="createPortBut" type="submit" class="w-full bg-yellow-400 text-zinc-900 p-2 rounded-lg hover:bg-yellow-300 duration-300">Create</button>
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
