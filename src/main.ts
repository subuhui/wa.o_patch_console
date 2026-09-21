import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import { vueQueryPluginOptions } from './plugins/vue-query'
import { setupSentry } from './plugins/sentry'

// Styles
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/assets/styles/main.scss'

async function prepareApp() {
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      onUnhandledRequest: 'bypass',
    })
  }
}

prepareApp().then(() => {
  const app = createApp(App)

  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.use(VueQueryPlugin, vueQueryPluginOptions)

  setupSentry(app, router)

  app.mount('#app')
})
