import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue"
import Port from "../views/Port.vue";
import NEWS from "../views/NEWS.vue"
import Calculator from "../views/Calculator.vue"
import StockView from "../views/StockView.vue";
import Login from "../views/Login.vue";
import History from "../views/History.vue"
import Register from "../views/Register.vue";

const router = createRouter({
    history: createWebHistory("/pl3"),
    routes: [
        {
            path: '/',
            redirect: '/home'
        },
        {
            path: '/home',
            name: 'Home',
            component: Home
        },
        {
            path: '/port',
            name: 'Port',
            component: Port,
            meta: { requiresAuth: true },
        },
        {
            path: '/stockView/:details',
            name: 'StockView',
            component: StockView
        },
        {
            path: '/news',
            name: 'NEWS',
            component: NEWS
        },
        {
            path: '/calculator',
            name: 'Calculator',
            component: Calculator
        },
        {
            path: '/history',
            name: 'History',
            component: History,
            meta: { requiresAuth: true },
        },
        {
            path: '/login',
            name: 'Login',
            component: Login
        },
        {
            path: '/register',
            name: 'Register',
            component: Register
        },
    ]
})

// router.beforeEach((to, from, next) => {
//     const token = localStorage.getItem("token")
//     if (to.meta.requiresAuth && !token) {
//       next("/login");
//     } else {
//       next();
//     }
//   });
const isTokenExpired = () => {
    const token = localStorage.getItem("token");
    if (!token) return true; // No token, treat as expired (but don't show alert)
  
    try {
      const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
      const exp = payload.exp * 1000; // Convert seconds to milliseconds
      const now = Date.now();
      
      if (now >= exp) {
        localStorage.removeItem("token"); // Remove expired token
        return true; // Token is expired
      }
      return false; // Token is valid
    } catch (err) {
      console.error("Invalid token:", err);
      localStorage.removeItem("token"); // Remove corrupted token
      return true; // Treat as expired
    }
  };
  
  // Navigation guard to check authentication and token expiration
  router.beforeEach((to, from, next) => {
    if (to.meta.requiresAuth) {
      if (isTokenExpired()) {
        alert("Session expired, please login again.");
        next("/login"); // Redirect to login page if token is expired
      } else {
        next(); // Continue navigation if token is valid
      }
    } else {
      next(); // Allow navigation if no auth is required
    }
  });

export default router;