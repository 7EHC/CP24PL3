import { defineStore } from "pinia";
import { ref } from "vue";
import stockApi from "../composable/FetchStock";

export const useUserStore = defineStore("user", () => {
  const balance = ref(0);

  const fetchBalance = async (userId) => {
    balance.value = 0;
    const data = await stockApi.getUserDetails(userId);
    balance.value = Number(data.balance.$numberDecimal).toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  return { balance, fetchBalance };
});
