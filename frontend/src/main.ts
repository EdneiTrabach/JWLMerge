import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18nInstance } from './i18n'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(createI18nInstance())

app.mount('#app')
