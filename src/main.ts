import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

import App from './App.vue'
import router from './router'
import { installMeta } from './lib/meta'
import { BdgPreset } from './theme/preset'

/* Self-hosted Inter (font-display: swap) — replaces the render-blocking
   Google Fonts request. */
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './assets/styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
installMeta(router)
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: BdgPreset,
    options: {
      darkModeSelector: '.bdg-dark',
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)

app.mount('#app')
