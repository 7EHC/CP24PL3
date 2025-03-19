<script setup>
import { ref, onMounted, watch } from "vue";
import Chart from "chart.js/auto";

const chartCanvas = ref(null);
let chartInstance = null;

const initialCap = ref(30000);
const monthlyInvest = ref(2500);
const returnAnnual = ref(8);
const period = ref(10);
const totalDCA = ref(0);
const assetPerYear = ref([]);

const calculateDCA = () => {
  let P = parseFloat(initialCap.value) || 0;
  let M = parseFloat(monthlyInvest.value) || 0;
  let r = parseFloat(returnAnnual.value) / 100 || 0;
  let n = parseFloat(period.value) || 0;
  let monthlyRate = r / 12;

  let FV_initial = P * Math.pow(1 + r, n);
  let FV_DCA = 0;
  assetPerYear.value = [];

  for (let year = 1; year <= n; year++) {
    let monthsSoFar = year * 12;
    FV_DCA =
      monthlyRate > 0
        ? M * ((Math.pow(1 + monthlyRate, monthsSoFar) - 1) / monthlyRate) * (1 + monthlyRate)
        : M * monthsSoFar;

    let totalValue = P * Math.pow(1 + r, year) + FV_DCA;
    assetPerYear.value.push({ year, totalValue });
  }

  totalDCA.value = FV_initial + FV_DCA;
  updateChart();
};

const updateChart = () => {
  if (!chartCanvas.value) return;

  const ctx = chartCanvas.value.getContext("2d");
  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: assetPerYear.value.map((item) => item.year),
      datasets: [
        {
          label: "Total Asset Value",
          data: assetPerYear.value.map((item) => item.totalValue),
          borderColor: "#FFD700",
          backgroundColor: "rgba(255, 215, 0, 0.2)",
          borderWidth: 2,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
};

watch([initialCap, monthlyInvest, returnAnnual, period], calculateDCA);

onMounted(() => {
  calculateDCA();
});
</script>

<template>
  <div>
    <p class="heading">DCA calculator (dollar-cost averaging)</p>

    <div class="inputs-container">
      <div class="input-group">
        <label for="initialCap">Initial Capital</label>
        <input v-model="initialCap" id="initialCap" type="number" step="1000" 
        class="bg-white border-gray-300 border p-1 rounded-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"/>
      </div>
      <div class="input-group">
        <label for="monthlyInvest">Monthly Investment</label>
        <input v-model="monthlyInvest" id="monthlyInvest" type="number" step="1000"
        class="bg-white border-gray-300 border p-1 rounded-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
      </div>
      <div class="input-group">
        <label for="returnAnnual">Annual Return (%)</label>
        <input v-model="returnAnnual" id="returnAnnual" type="number" 
        class="bg-white border-gray-300 border p-1 rounded-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none"/>
      </div>
      <div class="input-group">
        <label for="period">Period (year)</label>
        <input v-model="period" id="period" type="number"
        class="bg-white border-gray-300 border p-1 rounded-sm focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
      </div>
    </div>

    <!-- Chart container -->
    <div class="chart-container">
      <canvas ref="chartCanvas" class="chart"></canvas>
    </div>

    <div class="final-value mb-5">
      <div class="p-3 border border-green-500 rounded-sm text-zinc-800 font-semibold">
        Final Value: 
        <span class="value text-green-500">{{ totalDCA.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }}</span>
      </div>
    </div>

    <div class="bg-white p-6 md:p-10 rounded-lg border-yellow-400 border-2  mx-auto">
      <h2 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
        Understanding Dollar-Cost Averaging (DCA)
      </h2>
      <p class="text-gray-700 leading-relaxed mb-6">
        Dollar-Cost Averaging (DCA) is an investment strategy that involves consistently investing a fixed amount of money at regular intervals, 
        rather than making a single large investment. This method helps mitigate the effects of market volatility, as it spreads purchases across different price levels over time.
      </p>

      <h3 class="text-xl md:text-2xl font-semibold text-gray-900 mb-3">
        Why Consider DCA?
      </h3>
      <ul class="list-disc list-inside text-gray-700 space-y-2">
        <li><span class="font-medium text-gray-900">Minimizes Market Timing Stress</span> – By investing at fixed intervals, you avoid the pressure of trying to buy at the "perfect" time.</li>
        <li><span class="font-medium text-gray-900">Reduces Volatility Impact</span> – Investing gradually helps smooth out price fluctuations, lowering the risk of buying at market peaks.</li>
        <li><span class="font-medium text-gray-900">Encourages Financial Discipline</span> – A systematic approach fosters consistency and commitment to long-term investment goals.</li>
        <li><span class="font-medium text-gray-900">Effective in Various Market Conditions</span> – Whether markets are bullish or bearish, DCA ensures continuous investment without overreacting to short-term trends.</li>
        <li><span class="font-medium text-gray-900">Prevents Emotional Decision-Making</span> – Automated and consistent investments reduce impulsive trading influenced by market fluctuations.</li>
      </ul>

      <p class="text-gray-700 mt-6">
        DCA is widely used by long-term investors seeking steady wealth accumulation while minimizing short-term market risks. 
        It is commonly applied in stock investments, ETFs, cryptocurrencies, and retirement savings plans.
      </p>
    </div>


  </div>
</template>

<style scoped>
.heading {
  font-size: 2rem;
  color: #2e2e2e;
  font-weight: bold;
  margin: 20px 0;
}

.inputs-container {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 30px;
}

.input-group {
  display: flex;
  flex-direction: column;
  width: 22%;
}

.input-group label {
  font-weight: 600;
  color: #2e2e2e;
  margin-bottom: 0.5rem;
}

.input-group input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.chart-container {
  display: flex;
  justify-content: center;
  width: 100%; /* Full width */
  margin-top: 30px;
}

.chart {
  width: 100%; /* Full width */
  height: 400px;
}

.final-value {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.final-value .value {
  font-weight: bold;
  font-size: 1.2rem;
}

@media screen and (max-width: 768px) {
  .inputs-container {
    flex-direction: column;
    align-items: center;
  }

  .input-group {
    width: 80%;
    margin-bottom: 1rem;
  }

  .chart-container {
    width: 100%;
    padding: 0 20px;
  }
}
</style>

