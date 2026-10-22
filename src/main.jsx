import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './index.css'
import App from './App.jsx'

// Purge legacy offline-first storage keys if present
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('finper-sections')
  localStorage.removeItem('finper-offline-transactions')
  localStorage.removeItem('finper-offline-sync-queue')
}

// In development, ensure lingering service workers don't intercept unbundled modules
if (import.meta.env.DEV && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister()
    }
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
