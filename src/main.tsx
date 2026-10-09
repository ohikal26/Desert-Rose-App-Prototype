import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'

// Fonts are bundled so the app looks right offline (brief 10.3).
import '@fontsource/tenor-sans/400.css'
import '@fontsource/nunito-sans/400.css'
import '@fontsource/nunito-sans/600.css'
import '@fontsource/nunito-sans/700.css'
import '@fontsource/noto-naskh-arabic/arabic-400.css'
import '@fontsource/noto-naskh-arabic/arabic-600.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css'
import './styles/app.css'

import { App } from './App'
import { I18nProvider } from './i18n/I18n'
import { AppStateProvider } from './state/AppState'
import { DataProvider } from './data/DataContext'
import { ToastProvider } from './components/Toast'

registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AppStateProvider>
        <DataProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </DataProvider>
      </AppStateProvider>
    </I18nProvider>
  </StrictMode>,
)
