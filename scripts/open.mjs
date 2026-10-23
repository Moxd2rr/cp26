#!/usr/bin/env node
// Reconstruit le dossier content/ (en clair, non versionné) à partir du coffre chiffré.
// Utile sur une nouvelle machine ou une nouvelle session : npm run content:open
import fs from 'node:fs'
import path from 'node:path'
import { CONTENT_DIR, CACHE_FILE, readManifest, requirePassphrase, unlockExisting, openBlob, blobPath, sha256, fail } from './lib.mjs'

const FORCE = process.argv.includes('--force')
if (!readManifest()) fail('Aucun coffre trouvé (public/vault/manifest.json).')
const unlocked = await unlockExisting(requirePassphrase())
if (!unlocked?.keys) fail('Cette phrase secrète n’ouvre pas le coffre.')
const { manifest, keys } = unlocked

if (fs.existsSync(path.join(CONTENT_DIR, 'experience.yaml')) && !FORCE) {
  fail('content/ existe déjà. Relance avec « npm run content:open -- --force » pour l’écraser.')
}

const read = async (id) => openBlob(keys, id, new Uint8Array(fs.readFileSync(blobPath(id))))
const source = JSON.parse(new TextDecoder().decode(await read(manifest.source)))
const content = JSON.parse(new TextDecoder().decode(await read(manifest.content)))

let cache = {}
try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) } catch {}
const prefix = manifest.kdf.salt.slice(0, 8)
const meta = new Map()
for (const p of [...content.letters.flatMap((l) => l.photos), ...content.finale.photos.map((p) => p.photo)]) meta.set(p.blob, p)

const write = (rel, data) => {
  const p = path.join(CONTENT_DIR, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, data)
}
for (const [rel, text] of Object.entries(source.files)) write(rel, text)
for (const [name, id] of Object.entries(source.photos)) {
  const bytes = await read(id)
  write(`photos/${name}`, bytes)
  const m = meta.get(id)
  // On mémorise que ce fichier restauré correspond déjà à ce blob : pas de ré-encodage au prochain scellement.
  if (m) cache[`${prefix}:${sha256(bytes)}`] = { blob: id, w: m.w, h: m.h, mime: m.mime, thumb: m.thumb }
}
for (const [rel, id] of Object.entries(source.music ?? {})) write(rel, await read(id))
fs.writeFileSync(CACHE_FILE, JSON.stringify(cache))
console.log(`\n✦ content/ restauré : ${Object.keys(source.files).length} fichiers texte, ${Object.keys(source.photos).length} photo(s).`)
console.log('  (Les photos restaurées sont les versions optimisées du site, 2000 px max.)\n')
