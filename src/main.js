import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { createApplicationRouter } from './router'

const applicationRouter = createApplicationRouter()

createApp(App).use(createPinia()).use(applicationRouter).mount('.app')
