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

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem("token")
    if (to.meta.requiresAuth && !token) {
      next("/login");
    } else {
      next();
    }
  });

export default router;