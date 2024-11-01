import { createApp } from 'vue'
import './assets/style.css'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/router.js'
// import './assets/main.css'
// import router from './router/Index'


// const app = createApp(App)
// // createApp(App).mount('#app')
// app.use(router)
// app.mount('#app')
// // app.use(router)

const app = createApp(App)
const pinia = createPinia()
// const pinia = createPinia()
app.use(router)
app.use(pinia)
app.mount('#app')
// app.use(pinia)
// app.component('QuillEditor', QuillEditor)