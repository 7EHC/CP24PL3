import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Port from "../views/Port.vue";
import NEWS from "../views/NEWS.vue";
import Calculator from "../views/Calculator.vue";
import StockView from "../views/StockView.vue";
import Login from "../views/Login.vue";
import History from "../views/History.vue";
import Register from "../views/Register.vue";
import VerifyUser from "../views/VerifyUser.vue";
import authApi from "../composable/Auth";
import ForgotPassword from "../views/ForgotPassword.vue";
import ResetPassword from "../views/ResetPassword.vue";

const router = createRouter({
  history: createWebHistory("/pl3"),
  routes: [
    {
      path: "/",
      redirect: "/home",
    },
    {
      path: "/home",
      name: "Home",
      component: Home,
    },
    {
      path: "/port",
      name: "Port",
      component: Port,
      meta: { requiresAuth: true },
    },
    {
      path: "/stockView/:details",
      name: "StockView",
      component: StockView,
    },
    {
      path: "/verify/:token",
      name: "VerifyUser",
      component: VerifyUser,
    },
    {
      path: "/news",
      name: "NEWS",
      component: NEWS,
    },
    {
      path: "/calculator",
      name: "Calculator",
      component: Calculator,
    },
    {
      path: "/history",
      name: "History",
      component: History,
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "Login",
      component: Login,
    },
    {
      path: "/register",
      name: "Register",
      component: Register,
    },
    {
      path: "/forgot-password",
      name: "ForgotPassword",
      component: ForgotPassword,
    },
    {
      path: '/reset-password/:token',
      name: 'ResetPassword',
      component: ResetPassword,
  },
  ],
});

const isTokenExpired = async () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
      const exp = payload.exp * 1000; // Convert seconds to milliseconds
      const now = Date.now();

      if (now >= exp) {
        const checkRefresh = await authApi.refreshToken();
        console.log(checkRefresh);

        if (checkRefresh === "Failed to refresh token") {
          localStorage.removeItem("token"); // Remove expired token
          console.log("refresh token faled");

          return true; // Token is expired
        } else {
          return false;
        }
      } else {
        return false; // Token is valid
      }
    } catch (err) {
      console.error("Invalid token:", err);
      localStorage.removeItem("token"); // Remove corrupted token
      return true; // Treat as expired
    }
  }
};

// Navigation guard to check authentication and token expiration
router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem("token");

  if (to.meta.requiresAuth) {
    if (token) {
      const isExpired = await isTokenExpired();

      if (isExpired) {
        alert("Session Expired, please login again.");
        window.location.reload();
        localStorage.removeItem("token");
        next("/login");
      } else {
        next();
      }
    } else {
      alert("This page needs authentication, please login.");
      next("/login");
    }
  } else {
    next();
  }
});

export default router;
