import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { decodeToken } from "../composable/Auth";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token") || "");
  const userData = computed(() => (token.value ? decodeToken(token.value) : null));

  const setToken = (newToken) => {
    token.value = newToken;
    localStorage.setItem("token", newToken);
  };

  const clearToken = () => {
    token.value = "";
    localStorage.removeItem("token");
  };

  return { token, userData, setToken, clearToken };
});
