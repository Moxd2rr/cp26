// Outils partagés par les scripts de scellement / ouverture.
// Le format est lu côté navigateur par src/vault/crypto.ts : toute modification doit rester synchronisée.
import { webcrypto as crypto } from 'node:crypto'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const subtle = crypto.subtle
const enc = new TextEncoder()

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const CONTENT_DIR = path.join(ROOT, 'content')
export const VAULT_DIR = path.join(ROOT, 'public', 'vault')
export const MANIFEST = path.join(VAULT_DIR, 'manifest.json')
export const CACHE_FILE = path.join(CONTENT_DIR, '.cp26-cache.json')

export const KDF_ITERATIONS = 600_000

export const b64 = (buf) => Buffer.from(buf).toString('base64')
export const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'))
export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

/** Dérive les clés à partir de la phrase secrète (identique au navigateur pour la clé de chiffrement). */
export async function deriveKeys(passphrase, salt, iterations = KDF_ITERATIONS) {
  const base = await subtle.importKey('raw', enc.encode(passphrase.normalize('NFC')), 'PBKDF2', false, ['deriveBits'])
  const master = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, base, 256)
  const hk = await subtle.importKey('raw', master, 'HKDF', false, ['deriveKey'])
  const hkdf = (info) => ({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(info) })
  const encKey = await subtle.deriveKey(hkdf('cp26/enc'), hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
  const macKey = await subtle.deriveKey(hkdf('cp26/mac'), hk, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign'])
  return { encKey, macKey }
}

async function hmac(macKey, label, data) {
  const msg = Buffer.concat([Buffer.from(label + ':'), Buffer.from(data)])
  return new Uint8Array(await subtle.sign('HMAC', macKey, msg))
}

/**
 * Chiffre de façon déterministe : même contenu ⇒ même fichier (Git ne stocke pas de doublons),
 * contenus différents ⇒ IV différents (dérivés par HMAC, jamais réutilisés).
 * Format du blob : IV (12 octets) ‖ texte chiffré + tag GCM. Le nom du blob sert de données associées.
 */
export async function sealBlob(keys, plaintext) {
  const data = plaintext instanceof Uint8Array ? plaintext : new Uint8Array(plaintext)
  const id = Buffer.from(await hmac(keys.macKey, 'id', data)).subarray(0, 12).toString('hex')
  const iv = (await hmac(keys.macKey, 'iv', data)).subarray(0, 12)
  const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(id) }, keys.encKey, data))
  const out = new Uint8Array(12 + ct.length)
  out.set(iv, 0)
  out.set(ct, 12)
  return { id, bytes: out }
}

export async function openBlob(keys, id, bytes) {
  const iv = bytes.subarray(0, 12)
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(id) }, keys.encKey, bytes.subarray(12))
  return new Uint8Array(pt)
}

export const blobPath = (id) => path.join(VAULT_DIR, `${id}.bin`)

export function readManifest() {
  if (!fs.existsSync(MANIFEST)) return null
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
}

export function requirePassphrase({ allowEmpty = false } = {}) {
  const p = process.env.CP26_PASSPHRASE ?? ''
  if (!p && !allowEmpty) {
    fail(
      'Aucune phrase secrète. Définis CP26_PASSPHRASE (dans .env.local ou l’environnement).\n' +
        '  → Pour en générer une : npm run passphrase',
    )
  }
  return p
}

export function fail(msg) {
  console.error(`\n✖ ${msg}\n`)
  process.exit(1)
}

/** Ouvre le coffre existant avec la phrase secrète (ou échoue proprement). */
export async function unlockExisting(passphrase) {
  const manifest = readManifest()
  if (!manifest) return null
  const keys = await deriveKeys(passphrase, unb64(manifest.kdf.salt), manifest.kdf.iterations)
  try {
    const bytes = new Uint8Array(fs.readFileSync(blobPath(manifest.content)))
    await openBlob(keys, manifest.content, bytes)
  } catch {
    return { manifest, keys: null }
  }
  return { manifest, keys }
}
