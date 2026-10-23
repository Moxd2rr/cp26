import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import { pbkdf2Sync } from 'node:crypto'

/**
 * Pas de mot de passe pour la destinataire : la clé du coffre est intégrée au site AU MOMENT DU BUILD,
 * à partir de CP26_PASSPHRASE (variable d'environnement de l'hébergeur ou .env.local).
 * Le dépôt GitHub, lui, ne contient que le coffre chiffré et jamais la clé.
 */
function embeddedKey(mode: string): string {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const pass = env.CP26_PASSPHRASE
  // CP26_NO_EMBED=1 : site public (GitHub Pages) → la clé voyage uniquement dans le lien personnel.
  if (!pass || env.CP26_NO_EMBED) return ''
  const manifest = JSON.parse(fs.readFileSync('public/vault/manifest.json', 'utf8'))
  const master = pbkdf2Sync(pass.trim().normalize('NFC'), Buffer.from(manifest.kdf.salt, 'base64'), manifest.kdf.iterations, 32, 'sha256')
  return master.toString('base64')
}

export default defineConfig(({ mode }) => ({
  // Chemin relatif : le site fonctionne aussi bien à la racine d'un domaine que dans un sous-dossier.
  base: './',
  plugins: [react(), tailwindcss()],
  define: { __CP26_KEY__: JSON.stringify(embeddedKey(mode)) },
  server: { host: true },
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 800 },
}))
