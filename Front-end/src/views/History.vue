<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import stockApi from '../composable/FetchStock';
import { RouterLink } from "vue-router";
import Datepicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import { FilterIcon } from '@heroicons/vue/outline';

const allTrans = ref([]);
const openIndex = ref(null);
const portfolioNames = ref({}); // เก็บชื่อของพอร์ตแต่ละอัน
const isLoading = ref(false)
const isHaveTrans = ref(false)
const showFilter = ref(false); // Toggle filter dropdown
const filters = ref()
const portOptions = ref()
const cancelAlert = ref(false)
const cancelMsg = ref('')

// ตัวแปรสำหรับ Modal ยกเลิกคำสั่ง
const isCancelModalOpen = ref(false);
const selectedTransId = ref(null); 

const openCancelModal = (transId) => {
  selectedTransId.value = transId;
  isCancelModalOpen.value = true;
};

const closeCancelModal = () => {
  isCancelModalOpen.value = false;
  selectedTransId.value = null;
};

const cancelTransaction = async (status) => {
  try {
    const result = await stockApi.updateTransaction(selectedTransId.value, status);
    
    if (result) {
      cancelAlert.value = true;
      cancelMsg.value = JSON.stringify(result.message); // Convert object to string if necessary
    }

    console.log("Transaction Update Result:", result);
    closeCancelModal();
    allTrans.value = await stockApi.getAllTransaction();

    // ตั้งเวลา 3 วินาที (3000 มิลลิวินาที) แล้วเปลี่ยนเป็น "default"
    setTimeout(() => {
          cancelAlert.value = false
        }, 3000);
  } catch (error) {
    console.error("ERROR in cancelTransaction:", error);
  }
};

const getName = async (id) => {
  if (!id || portfolioNames.value[id]) return;
  try {
    const data = await stockApi.getPortDetails(id, "portfolio_name=true");
    portfolioNames.value[id] = data.portfolio_name; // เก็บชื่อพอร์ต
  } catch (error) {
    console.error("Error fetching portfolio name:", error);
  }
};

// Computed property to remove duplicates
const uniqueSymbols = computed(() => {
  const seen = new Set();
  return portOptions.value.filter((trans) => {
    if (seen.has(trans.symbol)) {
      return false;
    } else {
      seen.add(trans.symbol);
      return true;
    }
  });
})

const uniquePortIds = computed(() => {
  const uniquePorts = new Set();
  return portOptions.value.filter((trans) => {
    if (!uniquePorts.has(trans.portId)) {
      uniquePorts.add(trans.portId);
      return true;
    }
    return false;
  });
});

const clearFilter = () => {
  filters.value = {
    symbol: undefined,
    portId: undefined,
    fromDate: undefined,
    toDate: undefined,
    action: undefined,
    status: undefined,
  };
};

// คอยดึงข้อมูลเมื่อ allTrans เปลี่ยน
watch(allTrans, (newTrans) => {
  newTrans.forEach((trans) => getName(trans.portId));
}, { immediate: true });

const formatDate = (dateString) => {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric', month: 'short', year: '2-digit', 
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date(dateString));
};

const toggleAccordion = (index) => {
  openIndex.value = openIndex.value === index ? null : index;
};

const toggleFilter = () => {
  showFilter.value = !showFilter.value;
};

const applyFilter = async () => {
  isLoading.value = true;
  try {
    const params = {
      symbol: filters.value.symbol || undefined,
      portId: filters.value.portId,
      fromDate: filters.value.fromDate 
      ? new Date(filters.value.fromDate).setUTCHours(0, 0, 0, 0) && new Date(filters.value.fromDate).toISOString()
      : undefined,
    toDate: filters.value.toDate 
      ? new Date(filters.value.toDate).setUTCHours(0, 0, 0, 0) && new Date(filters.value.toDate).toISOString()
      : undefined,
      action: filters.value.action || undefined,
      status: filters.value.status || undefined,
    };

    // allTrans.value = await stockApi.getAllTransaction(params);
    // กรองค่า undefined ออก
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) acc[key] = value;
        return acc;
      }, {})
    ).toString();

    console.log(queryString); // ตรวจสอบค่า query string ที่สร้างได้

    allTrans.value = await stockApi.getAllTransaction(queryString);
    isHaveTrans.value = allTrans.value.length === 0;
  } catch (error) {
    console.error("Error fetching transactions:", error);
  } finally {
    isLoading.value = false;
    showFilter.value = false;
  }
};

onMounted(async () => {
  // allTrans.value = await stockApi.getAllTransaction();
  const fetchTransactions = async () => {
    isLoading.value = true;
    try {
        allTrans.value = await stockApi.getAllTransaction();
        portOptions.value = await stockApi.getAllTransaction();
        isHaveTrans.value = allTrans.value.length === 0; // ถ้าไม่มี transaction ให้เป็น true
    } catch (error) {
        console.error("Error fetching transactions:", error);
    } finally {
        isLoading.value = false;
    }
}
fetchTransactions()

filters.value = {
  symbol: undefined,
  portId: undefined,
  fromDate: undefined,
  toDate: undefined,
  action: undefined,
  status: undefined,
}
});
</script>

<template>
  <transition name="fade">
      <div 
      v-if="cancelAlert === true" 
      class="p-4 fixed right-12 z-50 border-l-4 bg-red-100 border-red-500 text-red-700" role="alert"
      >
        <p class="font-bold">Transaction successfully cancel.</p>
      </div>
  </transition>

  <!-- Modal ยืนยันการยกเลิก -->
  <teleport to="body">
    <div v-if="isCancelModalOpen" class="fixed inset-0 flex justify-center items-center z-50 bg-black bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg w-80">
        <p class="text-lg font-semibold text-gray-800">Confirm Cancellation</p>
        <p class="text-sm text-gray-600 mt-2">Are you sure you want to cancel this order?</p>
        
        <div class="flex justify-end space-x-2 mt-4">
          <button @click="closeCancelModal" class="px-4 py-2 text-gray-700 border rounded-md hover:bg-gray-200 duration-300">
            Cancel
          </button>
          <button @click="cancelTransaction('cancel')" class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 duration-300">
            Confirm
          </button>
        </div>
      </div>
    </div>
  </teleport>

  <p class="text-3xl text-zinc-800 my-3 font-bold w-full">
    History 
    <button @click="toggleFilter" class="float-right text-sm bg-gray-200 p-2 rounded-md flex items-center">
    <!-- Filter Icon -->
    <FilterIcon class="h-5 w-5 mr-2" />
    Filter
    <span class="ml-2 transform transition" :class="{ 'rotate-180': showFilter }">▼</span>
  </button>
  </p>

  <!-- Filter Dropdown -->
  <div v-if="showFilter" class="bg-white shadow-lg rounded-lg p-4 border w-80 absolute right-5 z-10">
    <!-- Symbol -->
    <div class="mb-3">
      <label class="block text-sm font-medium mb-1">Symbol</label>
      <!-- <input v-model="filters.symbol" type="text" class="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none" placeholder="AAPL, TSLA, etc." /> -->
      <select v-model="filters.symbol" class="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none">
        <option value="">Select Symbol</option>
        <option v-for="(trans, index) in uniqueSymbols" :key="index" :value="trans.symbol">
          {{ trans.symbol }}
        </option>
      </select>
    </div>

    <!-- Port -->
  <div class="mb-3">
    <label class="block text-sm font-medium mb-1">Port</label>
    <select v-model="filters.portId" class="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none">
      <option value="">Select Port</option>
      <option v-for="(trans, index) in uniquePortIds" :key="index" :value="trans.portId">
        {{ portfolioNames[trans.portId] || `Port ID: ${trans.portId}` }}
      </option>
    </select>
  </div>

    <!-- Date Range -->
    <div class="mb-3">
      <label class="block text-sm font-medium mb-1">From Date</label>
      <Datepicker v-model="filters.fromDate" />
    </div>
    <div class="mb-3">
      <label class="block text-sm font-medium mb-1">To Date</label>
      <Datepicker v-model="filters.toDate" />
    </div>

    <!-- Action -->
    <div class="mb-3">
      <label class="block text-sm font-medium mb-1">Action</label>
      <select v-model="filters.action" class="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none">
        <option value="">All</option>
        <option value="buy">Buy</option>
        <option value="sell">Sell</option>
      </select>
    </div>

    <!-- Status -->
    <div class="mb-3">
      <label class="block text-sm font-medium mb-1">Status</label>
      <select v-model="filters.status" class="w-full p-2 border rounded bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none">
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="match">Matched</option>
        <option value="failed">Failed</option>
      </select>
    </div>

    <!-- Apply and Clear Buttons -->
    <div class="flex space-x-2">
      <button @click="applyFilter" class="bg-yellow-400 text-zinc-800 font-semibold w-full py-2 rounded-lg">
        Apply Filters
      </button>
      <button @click="clearFilter" class="bg-gray-300 text-zinc-800 font-semibold w-full py-2 rounded-lg">
        Clear Filters
      </button>
    </div>
  </div>

  <div
      v-if="isLoading"
      class="fixed inset-0 flex items-center justify-center"
    >
      <div
        class="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>

  <div class="w-full flex flex-col mt-10 items-center" v-if="isHaveTrans">
    <p class="text-xl">No transaction history</p>
    <RouterLink :to="{name:'Port'}" class="bg-yellow-400 text-zinc-900 text-lg p-2 px-5 font-bold rounded-2xl hover:bg-yellow-300 duration-300 mt-6">
      Let's start investing
    </RouterLink>
  </div>
  

  <div
    v-for="(trans, index) in allTrans"
    :key="trans.id"
    :class="{ 'opacity-50': trans.status.toLowerCase() === 'failed'|| trans.status.toLowerCase() === 'cancel' }"
    class="border-b border-gray-700 py-4"
  >
    <div @click="toggleAccordion(index)" class="flex justify-between items-center cursor-pointer hover:bg-gray-100 hover:rounded-lg hover:px-1 transition-all duration-200">
      <p>
        <span
          :class="{
            'text-green-500': trans.action.toLowerCase() === 'buy' && trans.status.toLowerCase() !== 'pending',
            'text-red-500': trans.action.toLowerCase() === 'sell' && trans.status.toLowerCase() !== 'pending',
            'text-yellow-500': trans.status.toLowerCase() === 'pending'
          }"
          class="font-bold text-xl"
        >
          {{ trans.status.toLowerCase() === 'pending' ? `PENDING (${trans.action.toUpperCase()})` : trans.action.toUpperCase() }}
        </span>
        <span class="text-zinc-800 font-bold text-xl ml-1">
          {{ trans.symbol }}
        </span>
      </p>
      <p
        :class="{
          'text-green-500': trans.action.toLowerCase() === 'buy' && trans.status.toLowerCase() !== 'pending',
          'text-zinc-800': trans.action.toLowerCase() === 'sell' && trans.status.toLowerCase() !== 'pending',
          'text-yellow-500': trans.status.toLowerCase() === 'pending'
        }"
        class="font-bold text-xl"
      >
        {{ Number(trans.totalAmount).toFixed(2) }} USD
      </p>
    </div>

    <div class="flex justify-between items-center text-lg text-gray-800">
      <p v-if="trans.status.toLowerCase() === 'failed'" class="text-red-500 font-bold">FAILED</p>
      <p v-else-if="trans.status.toLowerCase() === 'cancel'" class="text-red-500 font-bold">CANCEL ORDER</p>
      <p v-else>Actual price: {{ trans.actualPrice }}</p>
      <p class="text-gray-800 text-sm">{{ formatDate(trans.date) }}</p>
    </div>

    <transition name="accordion">
      <div v-if="openIndex === index" class="mt-2 text-zinc-500 text-lg pt-2">
        <p><strong>Portfolio Name:</strong> {{ portfolioNames[trans.portId] || "Loading..." }}</p>
        <p><strong>Status:</strong> {{ trans.status }}</p>
        <p><strong>Shares:</strong> {{ trans.quantity }}</p>
        <p><strong>Bid price:</strong> {{ trans.bidPrice }}</p>

        <!-- ปุ่ม Cancel Order -->
          <button v-if="trans.status.toLowerCase() === 'pending'" 
            @click="openCancelModal(trans._id)" 
            class="text-red-500 cursor-pointer underline decoration-red-500 decoration-2 mt-2 w-full">
            <strong>Cancel Order</strong>
          </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.accordion-enter-active, .accordion-leave-active {
  transition: max-height 0.6s ease-in-out, opacity 0.6s ease-in-out;
  overflow: hidden;
}
.accordion-enter-from, .accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
.accordion-enter-to, .accordion-leave-from {
  max-height: 150px;
  opacity: 1;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 1s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
