import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import { App } from '@/app/App'
import { applyMotionPreference, readSettings } from '@/features/settings/settingsStore'

applyMotionPreference(readSettings().reduceMotion)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
