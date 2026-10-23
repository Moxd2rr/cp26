#!/usr/bin/env node
// Affiche le « lien magique » à envoyer : la clé est placée après le # (fragment),
// partie de l'URL que les navigateurs n'envoient JAMAIS au serveur.
import { requirePassphrase } from './lib.mjs'
const base = (process.argv[2] ?? process.env.CP26_SITE_URL ?? 'http://localhost:5173').replace(/\/?#.*$/, '').replace(/\/?$/, '/')
const p = requirePassphrase()
console.log(`\n  Lien magique :\n  ${base}#cle=${encodeURIComponent(p)}\n\n  Clé à taper (si besoin) : ${p}\n`)
