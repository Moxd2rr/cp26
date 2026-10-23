// Déchiffrement côté navigateur — miroir de scripts/lib.mjs.
// Rien n'est lisible sans la phrase secrète : le serveur ne sert que des octets chiffrés.

export interface Manifest {
  v: 1
  kdf: { name: 'PBKDF2'; hash: 'SHA-256'; iterations: number; salt: string }
  content: string
  source: string
}

const enc = new TextEncoder()
const VAULT = `${import.meta.env.BASE_URL}vault/`

export const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s)
}
export const fromB64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

export async function fetchManifest(): Promise<Manifest> {
  const res = await fetch(`${VAULT}manifest.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error('Coffre introuvable')
  return res.json()
}

/** PBKDF2 (coûteux à dessein : rend les essais en masse très lents). */
export async function deriveMaster(passphrase: string, m: Manifest): Promise<ArrayBuffer> {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase.normalize('NFC')), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromB64(m.kdf.salt), iterations: m.kdf.iterations },
    base,
    256,
  )
}

export async function keyFromMaster(master: ArrayBuffer | Uint8Array): Promise<CryptoKey> {
  const hk = await crypto.subtle.importKey('raw', master as BufferSource, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode('cp26/enc') },
    hk,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
}

export async function decryptBytes(key: CryptoKey, id: string, bytes: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.subarray(0, 12), additionalData: enc.encode(id) },
    key,
    bytes.subarray(12),
  )
}

// Certains hébergeurs n'acceptent pas les fichiers binaires .bin : on peut alors livrer
// les mêmes blobs chiffrés encodés en base64 (.txt) — VITE_VAULT_FORMAT=txt au moment du build.
const TEXT_VAULT = import.meta.env.VITE_VAULT_FORMAT === 'txt'

export async function fetchBlob(key: CryptoKey, id: string): Promise<ArrayBuffer> {
  if (!/^[0-9a-f]{24}$/.test(id)) throw new Error('Identifiant invalide')
  const res = await fetch(`${VAULT}${id}.${TEXT_VAULT ? 'txt' : 'bin'}`)
  if (!res.ok) throw new Error('Fichier manquant')
  const bytes = TEXT_VAULT ? fromB64((await res.text()).trim()) : new Uint8Array(await res.arrayBuffer())
  return decryptBytes(key, id, bytes)
}
