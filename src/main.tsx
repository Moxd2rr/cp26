import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Polices auto-hébergées : aucune requête vers un service tiers.
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '@fontsource/nothing-you-could-do/latin-400.css'
import '@fontsource/courier-prime/latin-400.css'
import '@fontsource/courier-prime/latin-700.css'
import './index.css'

import { App } from './App'
import { VaultProvider } from './vault/VaultProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VaultProvider>
      <App />
    </VaultProvider>
  </StrictMode>,
)
