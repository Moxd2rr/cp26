#!/usr/bin/env node
// Affiche le lien personnel à envoyer à la destinataire.
// La clé est placée après le « # » : les navigateurs n'envoient jamais cette partie au serveur.
//   npm run link                         (adresse GitHub Pages par défaut)
//   npm run link -- https://mon-site.fr/
import { requirePassphrase } from './lib.mjs'
const base = (process.argv[2] ?? process.env.CP26_SITE_URL ?? 'https://moxd2rr.github.io/cp26/').replace(/#.*$/, '').replace(/\/?$/, '/')
const p = requirePassphrase()
if (!/^[\p{L}\d-]{12,}$/u.test(p)) {
  console.error('\n✖ Pour un lien personnel, la phrase secrète doit contenir seulement des lettres, des chiffres et des tirets.\n')
  process.exit(1)
}
console.log(`\n  Lien à envoyer :\n  ${base}#${p}\n`)
