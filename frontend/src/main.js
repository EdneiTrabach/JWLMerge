import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/styles/global.css'

const app = createApp(App)
app.use(createPinia())

// enable devtools in development
if (import.meta.env.DEV) {
	app.config.devtools = true
	// try to load the standalone devtools (installed as devDependency)
	import('@vue/devtools').then((m) => {
		console.log('Vue devtools loaded:', !!m)
	}).catch(() => {
		console.log('Vue devtools package not available')
	})
}

app.mount('#app')
