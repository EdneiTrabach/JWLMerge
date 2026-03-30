import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/styles/global.css'

const app = createApp(App)
app.use(createPinia())

// enable devtools in development
if (import.meta.env.DEV) {
 	app.config.devtools = true
}

app.mount('#app')
