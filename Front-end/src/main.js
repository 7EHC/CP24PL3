import { createPinia } from 'pinia'
import { createApp } from 'vue'
import './assets/style.css'
import App from './App.vue'
import router from './router/router.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')
