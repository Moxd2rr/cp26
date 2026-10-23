#!/usr/bin/env node
// Parcours complet dans un vrai navigateur (mobile + ordinateur) avec captures d'écran.
//   npm run build && npx vite preview --port 4173   puis   npm run test:e2e
// Variables : E2E_URL (défaut http://localhost:4173/), CHROMIUM_PATH (sinon Chromium de Playwright).
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const URL = process.env.E2E_URL ?? 'http://localhost:4173/'
const KEY = process.env.CP26_PASSPHRASE
const OUT = process.env.E2E_OUT ?? 'screenshots'
const exe = process.env.CHROMIUM_PATH ?? (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined)
if (!KEY) throw new Error('CP26_PASSPHRASE manquant')
fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: exe })
const errors = []
const devices = [
  { name: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { name: 'desktop', viewport: { width: 1440, height: 900 } },
]

for (const d of devices) {
  const ctx = await browser.newContext({ viewport: d.viewport, deviceScaleFactor: d.deviceScaleFactor ?? 1, isMobile: d.isMobile, hasTouch: d.hasTouch })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(`[${d.name}] ${e.message}`))
  page.on('console', (m) => m.type() === 'error' && errors.push(`[${d.name}] console: ${m.text()}`))
  const shot = (n) => page.screenshot({ path: `${OUT}/${d.name}-${n}.png` })

  await page.goto(URL)
  await page.waitForSelector('#cle')
  await page.waitForTimeout(2200)
  await shot('01-verrou')

  // Mauvaise clé → message d'erreur
  await page.fill('#cle', 'mauvaise-cle-123')
  await page.click('button[type=submit]')
  await page.getByRole('alert').waitFor()

  await page.fill('#cle', KEY)
  await page.click('button[type=submit]')
  await page.getByRole('button', { name: 'Entrer' }).waitFor({ timeout: 20000 })
  await page.waitForTimeout(6500)
  await shot('02-accueil')
  await page.getByRole('button', { name: 'Entrer' }).click()

  await page.waitForTimeout(3500)
  await shot('03-intro')
  await page.getByRole('button', { name: 'Passer' }).click()

  await page.getByRole('button', { name: /^Lettre 1,/ }).waitFor()
  await page.waitForTimeout(2500)
  await shot('04-galerie')

  await page.getByRole('button', { name: /^Lettre 1,/ }).click()
  await page.waitForTimeout(1700)
  await shot('05-ouverture')
  await page.getByText('Lettre n° 01').waitFor({ timeout: 8000 })
  await page.waitForTimeout(1800)
  await shot('06-lettre')

  // Lettre n°5 (texte court : mise en page « poème »)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: /^Lettre 5,/ }).click()
  await page.getByText('Lettre n° 05').waitFor({ timeout: 8000 })
  await page.waitForTimeout(1800)
  await shot('07-lettre-courte')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)

  // Dernière lettre : verrouillée tant que les autres ne sont pas lues → confirmation
  await page.getByRole('button', { name: /La dernière lettre/ }).click()
  await page.getByRole('button', { name: 'L’ouvrir' }).click()
  await page.getByText(/La dernière lettre · n°/).waitFor({ timeout: 10000 })
  await page.waitForTimeout(1500)
  await shot('08-derniere-lettre')
  const finaleBtn = page.getByRole('button', { name: /Il reste une dernière chose/ })
  await finaleBtn.scrollIntoViewIfNeeded()
  await page.waitForTimeout(2500)
  await shot('09-derniere-lettre-fin')
  await finaleBtn.click()

  // Finale : captures à des moments clés
  const marks = [[4, 'a-ouverture'], [8, 'b-noms'], [13, 'c-citation'], [41, 'd-photo'], [50, 'e-26'], [56, 'f-message'], [66, 'g-fin']]
  let t = 0
  for (const [at, label] of marks) {
    await page.waitForTimeout((at - t) * 1000)
    t = at
    await shot(`10-finale-${label}`)
  }
  await page.getByRole('button', { name: 'Relire les lettres' }).waitFor({ timeout: 10000 })
  await page.getByRole('button', { name: 'Relire les lettres' }).click()
  await page.getByRole('button', { name: 'Revoir le final' }).waitFor()
  await shot('11-galerie-apres')
  await ctx.close()
  console.log(`✓ ${d.name}`)
}
await browser.close()
if (errors.length) {
  console.error('Erreurs :\n' + errors.join('\n'))
  process.exit(1)
}
console.log(`Parcours OK — captures dans ${OUT}/`)
