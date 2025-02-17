<script setup>
import { ref, onMounted, watch } from 'vue';
import stockApi from '../composable/FetchStock';
import { RouterLink } from "vue-router";

const allTrans = ref([]);
const openIndex = ref(null);
const portfolioNames = ref({}); // เก็บชื่อของพอร์ตแต่ละอัน
const isLoading = ref(false)
const isHaveTrans = ref(false)

const getName = async (id) => {
  if (!id || portfolioNames.value[id]) return;
  try {
    const data = await stockApi.getPortDetails(id, "portfolio_name=true");
    portfolioNames.value[id] = data.portfolio_name; // เก็บชื่อพอร์ต
  } catch (error) {
    console.error("Error fetching portfolio name:", error);
  }
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

onMounted(async () => {
  // allTrans.value = await stockApi.getAllTransaction();
  const fetchTransactions = async () => {
    isLoading.value = true;
    try {
        allTrans.value = await stockApi.getAllTransaction();
        isHaveTrans.value = allTrans.value.length === 0; // ถ้าไม่มี transaction ให้เป็น true
    } catch (error) {
        console.error("Error fetching transactions:", error);
    } finally {
        isLoading.value = false;
    }
}
fetchTransactions()
});
</script>

<template>
  <p class="text-3xl text-zinc-800 my-3 font-bold">History</p>

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
    :class="{ 'opacity-50': trans.status.toLowerCase() === 'failed' }"
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
      <p v-if="trans.status.toLowerCase() !== 'failed'">
        Actual price: {{ trans.actualPrice }}
      </p>
      <p v-else class="text-red-500 font-bold">FAILED</p>
      <p class="text-gray-800 text-sm">{{ formatDate(trans.date) }}</p>
    </div>

    <transition name="accordion">
      <div v-if="openIndex === index" class="mt-2 text-zinc-500 text-lg pt-2">
        <p><strong>Portfolio Name:</strong> {{ portfolioNames[trans.portId] || "Loading..." }}</p>
        <p><strong>Status:</strong> {{ trans.status }}</p>
        <p><strong>Shares:</strong> {{ trans.quantity }}</p>
        <p><strong>Bid price:</strong> {{ trans.bidPrice }}</p>
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
</style>
