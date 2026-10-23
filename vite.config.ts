import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Chemin relatif : le site fonctionne aussi bien à la racine d'un domaine que dans un sous-dossier (GitHub Pages).
  base: './',
  plugins: [react(), tailwindcss()],
  server: { host: true },
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 800 },
})
