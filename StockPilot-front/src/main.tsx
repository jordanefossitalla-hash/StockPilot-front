import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('stockpilot:pwa-update-ready'))
  },
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent('stockpilot:pwa-offline-ready'))
  },
})

window.addEventListener('stockpilot:pwa-apply-update', () => {
  void updateSW(true)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
