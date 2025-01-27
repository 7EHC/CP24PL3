import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue"
import Port from "../views/Port.vue";
import NEWS from "../views/NEWS.vue"
import Calculator from "../views/Calculator.vue"
import StockView from "../views/StockView.vue";
import Login from "../views/Login.vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
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
            // children: [
            //     {
            //         path: 'stockview/:ticker', // Nested route without leading slash
            //         name: 'StockView',
            //         component: StockView,
            //     }
            // ]
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
            path: '/login',
            name: 'Login',
            component: Login
        },
    ]
})

export default router;