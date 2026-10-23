#!/usr/bin/env node
// Parcours complet dans un vrai navigateur (mobile + ordinateur) avec captures d'écran.
//   npm run build && npx vite preview --port 4173   puis   npm run test:e2e
// (le build doit avoir été fait avec CP26_PASSPHRASE pour intégrer la clé)
// Variables : E2E_URL (défaut http://localhost:4173/), CHROMIUM_PATH (sinon Chromium de Playwright).
import { chromium } from 'playwright-core'
import fs from 'node:fs'

const URL = process.env.E2E_URL ?? 'http://localhost:4173/'
const OUT = process.env.E2E_OUT ?? 'screenshots'
const exe = process.env.CHROMIUM_PATH ?? (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined)
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
  // Pas de mot de passe : l'accueil s'affiche directement.
  await page.getByRole('button', { name: 'Entrer' }).waitFor({ timeout: 20000 })
  await page.waitForTimeout(7500)
  await shot('01-accueil')
  await page.getByRole('button', { name: 'Entrer' }).click()

  await page.waitForTimeout(4000)
  await shot('02-intro')
  await page.getByRole('button', { name: 'Passer' }).click()

  // Le grand cadeau
  await page.getByRole('button', { name: 'Ouvrir le cadeau' }).first().waitFor()
  await page.waitForTimeout(2200)
  await shot('03-cadeau')
  await page.getByRole('button', { name: 'Ouvrir le cadeau' }).last().click()
  await page.waitForTimeout(900)
  await shot('04-cadeau-ouverture')
  await page.waitForTimeout(1300)
  await shot('05-lettres-qui-sortent')
  await page.waitForTimeout(1500)
  await shot('06-lettres-en-vol')
  await page.waitForTimeout(3000)
  await page.getByRole('button', { name: /^Lettre 1,/ }).waitFor()
  await page.evaluate(() => document.querySelector('main')?.scrollTo({ top: 0 }))
  await page.waitForTimeout(600)
  await shot('07-table')
  await page.getByRole('button', { name: /^Lettre 1,/ }).scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  await shot('08-enveloppes')

  await page.getByRole('button', { name: /^Lettre 1,/ }).click()
  await page.waitForTimeout(700)
  await shot('09-ouverture-a')
  await page.waitForTimeout(1500)
  await shot('09-ouverture-b')
  await page.waitForTimeout(900)
  await shot('09-ouverture-c')
  await page.getByRole('button', { name: '← Toutes les lettres' }).waitFor({ timeout: 10000 })
  await page.waitForTimeout(1800)
  await shot('10-lettre')

  // Lettre n°5 (texte court : mise en page « poème »)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: /^Lettre 5,/ }).click()
  await page.getByRole('button', { name: '← Toutes les lettres' }).waitFor({ timeout: 10000 })
  await page.waitForTimeout(1800)
  await shot('11-lettre-courte')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)

  // Dernière lettre : verrouillée tant que les autres ne sont pas lues → confirmation
  await page.getByRole('button', { name: /^Lettre \d+,/ }).last().click()
  await page.getByRole('button', { name: 'L’ouvrir' }).click()
  await page.getByRole('button', { name: '← Toutes les lettres' }).waitFor({ timeout: 12000 })
  await page.waitForTimeout(1500)
  await shot('12-derniere-lettre')
  const finaleBtn = page.getByRole('button', { name: /Il reste une dernière chose/ })
  await finaleBtn.scrollIntoViewIfNeeded()
  await page.waitForTimeout(2500)
  const lastLine = await page.evaluate(() => {
    const lines = document.querySelectorAll('.letter-body .line')
    return lines.length ? Number(getComputedStyle(lines[lines.length - 1]).opacity) : 0
  })
  if (lastLine < 0.9) errors.push(`[${d.name}] texte de la dernière lettre invisible (opacité ${lastLine})`)
  await shot('13-derniere-lettre-fin')
  await finaleBtn.click()

  // Finale : captures à des moments clés
  const marks = [[4, 'a-ouverture'], [8, 'b-noms'], [13, 'c-citation'], [32, 'd-photo'], [60, 'e-26'], [66, 'f-message'], [80, 'g-fin']]
  let t = 0
  for (const [at, label] of marks) {
    await page.waitForTimeout((at - t) * 1000)
    t = at
    await shot(`14-finale-${label}`)
  }
  await page.getByRole('button', { name: 'Relire les lettres' }).waitFor({ timeout: 10000 })
  await page.getByRole('button', { name: 'Relire les lettres' }).click()
  await page.getByRole('button', { name: 'Revoir le final' }).waitFor({ state: 'attached' })
  await shot('15-table-apres')
  await ctx.close()
  console.log(`✓ ${d.name}`)
}
await browser.close()
if (errors.length) {
  console.error('Erreurs :\n' + errors.join('\n'))
  process.exit(1)
}
console.log(`Parcours OK — captures dans ${OUT}/`)
