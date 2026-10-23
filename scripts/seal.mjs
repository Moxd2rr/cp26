#!/usr/bin/env node
// Scelle le contenu privé (content/) dans un coffre chiffré publiable (public/vault/).
//   npm run seal            → chiffre avec CP26_PASSPHRASE
//   npm run seal -- --rekey → change de phrase secrète (re-chiffre tout)
// Le dossier content/ n'est jamais versionné ; seul public/vault/ (chiffré) l'est.
import fs from 'node:fs'
import path from 'node:path'
import { webcrypto as crypto } from 'node:crypto'
import YAML from 'yaml'
import sharp from 'sharp'
import {
  CONTENT_DIR, VAULT_DIR, MANIFEST, CACHE_FILE, KDF_ITERATIONS,
  b64, unb64, sha256, deriveKeys, sealBlob, blobPath, requirePassphrase, unlockExisting, fail,
} from './lib.mjs'

const REKEY = process.argv.includes('--rekey')
const LETTERS_DIR = path.join(CONTENT_DIR, 'letters')
const PHOTOS_DIR = path.join(CONTENT_DIR, 'photos')
const MUSIC_DIR = path.join(CONTENT_DIR, 'music')
const AMBIANCES = ['or', 'aube', 'rose', 'ambre', 'nuit', 'bordeaux', 'minuit']
const LAYOUTS = ['auto', 'texte', 'photo-haut', 'photo-fin', 'entrelace', 'galerie']

if (!fs.existsSync(path.join(CONTENT_DIR, 'experience.yaml'))) {
  fail('content/experience.yaml introuvable. Si le contenu est déjà scellé, restaure-le avec : npm run content:open')
}

// ───────────────────────── Clés ─────────────────────────
const passphrase = requirePassphrase()
if ([...passphrase].length < 12) fail('Phrase secrète trop courte (12 caractères minimum, idéalement 4-5 mots).')

let salt, keys
const existing = await unlockExisting(passphrase)
if (existing && existing.keys && !REKEY) {
  salt = unb64(existing.manifest.kdf.salt)
  keys = existing.keys
} else {
  if (existing && !existing.keys && !REKEY) {
    fail('Cette phrase secrète n’ouvre pas le coffre existant.\n  → Pour changer volontairement de phrase : npm run seal -- --rekey')
  }
  salt = crypto.getRandomValues(new Uint8Array(32))
  keys = await deriveKeys(passphrase, salt, KDF_ITERATIONS)
}

fs.mkdirSync(VAULT_DIR, { recursive: true })
const written = new Set()
async function store(bytes) {
  const blob = await sealBlob(keys, bytes)
  const p = blobPath(blob.id)
  if (!fs.existsSync(p)) fs.writeFileSync(p, blob.bytes)
  written.add(blob.id)
  return blob.id
}

// Cache local (non versionné) : empreinte du fichier source → blob déjà chiffré.
let cache = {}
try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) } catch {}
const cacheKey = (sha) => `${b64(salt).slice(0, 8)}:${sha}`

const warnings = []
const notes = []

// ───────────────────────── Photos ─────────────────────────
const photoCache = new Map()
async function sealPhoto(file, alt, caption) {
  const src = path.join(PHOTOS_DIR, file)
  if (!fs.existsSync(src)) fail(`Photo introuvable : content/photos/${file}`)
  if (!photoCache.has(file)) {
    const raw = fs.readFileSync(src)
    const sha = sha256(raw)
    let entry = cache[cacheKey(sha)]
    if (!entry || !fs.existsSync(blobPath(entry.blob))) {
      const img = sharp(raw).rotate()
      const out = await img
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 84 })
        .toBuffer({ resolveWithObject: true })
      const thumb = await sharp(raw).rotate().resize(24, 24, { fit: 'inside' }).webp({ quality: 50 }).toBuffer()
      entry = {
        blob: '',
        w: out.info.width,
        h: out.info.height,
        mime: 'image/webp',
        thumb: `data:image/webp;base64,${thumb.toString('base64')}`,
        bytes: out.data,
      }
      entry.blob = await store(new Uint8Array(out.data))
      delete entry.bytes
      cache[cacheKey(sha)] = entry
    } else {
      written.add(entry.blob)
    }
    photoCache.set(file, entry)
  }
  const e = photoCache.get(file)
  return { blob: e.blob, w: e.w, h: e.h, mime: e.mime, thumb: e.thumb, alt, caption: caption ?? null, file }
}

// ───────────────────────── Lettres ─────────────────────────
function parseLetter(file) {
  const raw = fs.readFileSync(path.join(LETTERS_DIR, file), 'utf8').replace(/\r\n/g, '\n').replace(/^﻿/, '')
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) fail(`${file} : en-tête « --- » manquant.`)
  const meta = YAML.parse(m[1]) ?? {}
  // Le texte est conservé tel quel ; seuls les sauts de ligne finaux sont retirés.
  const body = m[2].replace(/\s+$/, '')
  return { file, meta, body }
}

const letterFiles = fs.readdirSync(LETTERS_DIR).filter((f) => f.endsWith('.txt')).sort()
if (!letterFiles.length) fail('Aucune lettre dans content/letters/.')

const parsed = letterFiles.map(parseLetter)
const seen = new Map()
for (const l of parsed) {
  const n = l.meta.numero
  if (!Number.isInteger(n) || n < 1) fail(`${l.file} : « numero » doit être un entier ≥ 1.`)
  if (seen.has(n)) fail(`Numéro ${n} utilisé deux fois (${seen.get(n)} et ${l.file}).`)
  seen.set(n, l.file)
  if (!l.meta.auteur) fail(`${l.file} : « auteur » manquant.`)
  if (!l.body.trim()) fail(`${l.file} : le texte de la lettre est vide.`)
}
parsed.sort((a, b) => a.meta.numero - b.meta.numero)

const letters = []
for (const [i, { file, meta, body }] of parsed.entries()) {
  const author = String(meta.auteur).trim()
  const ambiance = meta.ambiance ?? AMBIANCES[i % 5]
  if (!AMBIANCES.includes(ambiance)) fail(`${file} : ambiance « ${ambiance} » inconnue (${AMBIANCES.join(', ')}).`)
  const layout = meta.mise_en_page ?? 'auto'
  if (!LAYOUTS.includes(layout)) fail(`${file} : mise_en_page « ${layout} » inconnue (${LAYOUTS.join(', ')}).`)
  const photos = []
  for (const p of meta.photos ?? []) {
    const spec = typeof p === 'string' ? { fichier: p } : p
    photos.push(await sealPhoto(spec.fichier, spec.description ?? `Photo jointe à la lettre de ${author}`, spec.legende))
  }
  letters.push({
    number: meta.numero,
    author,
    relation: meta.lien ?? null,
    signature: meta.signature ?? null,
    lastLineSignature: meta.derniere_ligne_signature === true,
    ambiance,
    layout,
    body,
    photos,
  })
}

// ───────────────────────── Expérience ─────────────────────────
const xp = YAML.parse(fs.readFileSync(path.join(CONTENT_DIR, 'experience.yaml'), 'utf8'))
const who = xp.destinataire ?? {}
if (!who.prenom) fail('experience.yaml : destinataire.prenom manquant.')
const vars = { n: String(letters.length), prenom: who.prenom, surnom: who.surnom ?? who.prenom, age: String(who.age ?? 26) }
const fill = (s) => String(s ?? '').replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
const fillAll = (arr) => (arr ?? []).map(fill)

const byNumber = new Map(letters.map((l) => [l.number, l]))
function quote(q, where) {
  const l = byNumber.get(q.lettre)
  if (!l) fail(`${where} : la lettre n°${q.lettre} n’existe pas.`)
  if (!q.texte || !l.body.includes(q.texte)) {
    fail(`${where} : l’extrait n’apparaît pas mot pour mot dans la lettre n°${q.lettre} (${l.author}) :\n    « ${q.texte} »`)
  }
  return { letter: l.number, author: l.author, text: q.texte }
}

const finalNumber = xp.derniere_lettre?.numero ?? letters.at(-1).number
if (!byNumber.has(finalNumber)) fail(`derniere_lettre.numero = ${finalNumber} ne correspond à aucune lettre.`)

const fin = xp.finale ?? {}
const finalePhotos = []
for (const [i, p] of (fin.photos ?? []).entries()) {
  finalePhotos.push({
    photo: await sealPhoto(p.fichier, 'Photo souvenir', null),
    quote: p.citation ? quote(p.citation, `finale.photos[${i}].citation`) : null,
  })
}

let music = null
if (fin.musique) {
  const src = path.join(CONTENT_DIR, fin.musique.replace(/^music\//, 'music/'))
  const file = fs.existsSync(src) ? src : path.join(MUSIC_DIR, path.basename(fin.musique))
  if (!fs.existsSync(file)) fail(`Musique introuvable : ${fin.musique}`)
  const ext = path.extname(file).toLowerCase()
  const mime = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.ogg': 'audio/ogg', '.wav': 'audio/wav' }[ext]
  if (!mime) fail(`Format audio non pris en charge : ${ext}`)
  music = { blob: await store(new Uint8Array(fs.readFileSync(file))), mime, file: path.relative(CONTENT_DIR, file) }
}

const content = {
  v: 1,
  sealedAt: new Date().toISOString().slice(0, 10),
  recipient: { firstName: who.prenom, fullName: who.nom_complet ?? who.prenom, nickname: who.surnom ?? who.prenom, age: who.age ?? 26 },
  welcome: { eyebrow: fill(xp.accueil?.surtitre ?? 'Pour'), message: fill(xp.accueil?.message), button: fill(xp.accueil?.bouton ?? 'Entrer') },
  intro: { lines: fillAll(xp.introduction?.lignes), button: fill(xp.introduction?.bouton ?? 'Voir mes lettres') },
  gallery: { title: fill(xp.galerie?.titre ?? 'Tes lettres'), subtitle: fill(xp.galerie?.sous_titre) },
  finalLetter: {
    number: finalNumber,
    waitForOthers: xp.derniere_lettre?.attendre_les_autres !== false,
    finaleButton: fill(xp.derniere_lettre?.bouton_finale ?? 'Il reste une dernière chose…'),
  },
  letters,
  finale: {
    opening: fillAll(fin.ouverture),
    quotes: (fin.citations ?? []).map((q, i) => quote(q, `finale.citations[${i}]`)),
    photos: finalePhotos,
    subtitle26: fill(fin.sous_titre_26 ?? 'Chapitre 26'),
    message: fillAll(fin.message),
    conclusion: fillAll(fin.conclusion),
    signature: fill(fin.signature ?? ''),
    music,
  },
}
// Les noms de fichiers d'origine ne sont pas nécessaires au site.
const strip = (p) => { const { file, ...rest } = p; return rest }
for (const l of content.letters) l.photos = l.photos.map(strip)
for (const p of content.finale.photos) p.photo = strip(p.photo)
if (content.finale.music) content.finale.music = { blob: content.finale.music.blob, mime: content.finale.music.mime }

const contentId = await store(new TextEncoder().encode(JSON.stringify(content)))

// ───────────────────────── Sauvegarde chiffrée de la source ─────────────────────────
// Permet de reconstruire content/ sur une autre machine (npm run content:open).
const source = { files: {}, photos: {}, music: {} }
const walk = (dir) => fs.readdirSync(path.join(CONTENT_DIR, dir), { withFileTypes: true })
for (const f of fs.readdirSync(CONTENT_DIR).filter((f) => /\.(ya?ml|txt|md)$/.test(f))) {
  source.files[f] = fs.readFileSync(path.join(CONTENT_DIR, f), 'utf8')
}
for (const d of walk('letters')) if (d.isFile()) source.files[`letters/${d.name}`] = fs.readFileSync(path.join(LETTERS_DIR, d.name), 'utf8')
for (const [file, e] of photoCache) source.photos[file] = e.blob
if (fs.existsSync(PHOTOS_DIR)) {
  for (const d of walk('photos')) {
    if (!d.isFile() || d.name.startsWith('.') || photoCache.has(d.name)) continue
    // Photo présente mais pas (encore) utilisée : on la sauvegarde quand même.
    const e = await sealPhoto(d.name, '', null)
    source.photos[d.name] = e.blob
    notes.push(`Photo non utilisée pour l’instant : photos/${d.name}`)
  }
}
if (music) source.music[music.file] = music.blob
const sourceId = await store(new TextEncoder().encode(JSON.stringify(source)))

// ───────────────────────── Manifeste + nettoyage ─────────────────────────
const manifest = {
  v: 1,
  kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: existing?.keys && !REKEY ? existing.manifest.kdf.iterations : KDF_ITERATIONS, salt: b64(salt) },
  content: contentId,
  source: sourceId,
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
for (const f of fs.readdirSync(VAULT_DIR)) {
  if (f.endsWith('.bin') && !written.has(f.slice(0, -4))) fs.rmSync(path.join(VAULT_DIR, f))
}
fs.writeFileSync(CACHE_FILE, JSON.stringify(cache))

// ───────────────────────── Rapport ─────────────────────────
for (const l of letters) {
  const missing = []
  if (!l.signature && !l.lastLineSignature) missing.push('pas de signature séparée')
  if (!l.photos.length) missing.push('aucune photo')
  if (missing.length) warnings.push(`n°${String(l.number).padStart(2, '0')} ${l.author} — ${missing.join(', ')}`)
}
const nums = letters.map((l) => l.number)
for (let n = 1; n <= Math.max(...nums); n++) if (!nums.includes(n)) warnings.push(`Numéro ${n} absent (trou dans la numérotation).`)
if (!music) notes.push('Aucune musique pour l’animation finale (facultatif).')
if (finalePhotos.length < 3) notes.push(`Seulement ${finalePhotos.length} photo(s) dans l’animation finale — plus de photos la rendraient plus riche.`)

const words = (s) => s.split(/\s+/).filter(Boolean).length
console.log('\n✦ Coffre scellé — public/vault/\n')
console.log('  N°  Auteur                     Mots  Photos  Ambiance')
for (const l of letters) {
  const star = l.number === finalNumber ? ' ★ dernière lettre' : ''
  console.log(`  ${String(l.number).padStart(2, '0')}  ${l.author.padEnd(26)} ${String(words(l.body)).padStart(4)}  ${String(l.photos.length).padStart(6)}  ${l.ambiance}${star}`)
}
console.log(`\n  Finale : ${content.finale.quotes.length} citations vérifiées mot pour mot, ${finalePhotos.length} photo(s), musique : ${music ? 'oui' : 'non'}`)
if (warnings.length) console.log('\n  Informations manquantes (rien n’a été inventé) :\n' + warnings.map((w) => `   • ${w}`).join('\n'))
if (notes.length) console.log('\n  Notes :\n' + notes.map((w) => `   • ${w}`).join('\n'))
console.log(`\n  Fichiers chiffrés : ${written.size}  ·  KDF PBKDF2-SHA256 × ${manifest.kdf.iterations.toLocaleString('fr-FR')}\n`)
