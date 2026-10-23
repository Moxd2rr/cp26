import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Content } from '../types'
import { deriveMaster, fetchBlob, fetchManifest, fromB64, keyFromMaster, toB64, type Manifest } from './crypto'
import { storage } from '../lib/storage'

type Status = 'checking' | 'locked' | 'unlocking' | 'open' | 'error'

interface VaultValue {
  status: Status
  content: Content | null
  /** Identifiant court du coffre (pour séparer la progression de lecture si le contenu est re-scellé avec une autre clé). */
  vaultTag: string
  unlock: (passphrase: string, remember: boolean) => Promise<boolean>
  lock: () => void
  media: (blob: string, mime: string) => Promise<string>
}

const Ctx = createContext<VaultValue | null>(null)
const REMEMBER_KEY = 'cp26:cle'

// Lu une seule fois, dès le chargement : la clé du « lien magique » (#cle=…) n'est jamais envoyée au serveur.
const FRAGMENT_KEY = readFragmentKey()

function readFragmentKey(): string | null {
  const m = window.location.hash.match(/(?:^#|&)cle=([^&]+)/)
  if (!m) return null
  // La clé ne doit pas rester visible dans la barre d'adresse ni dans l'historique.
  history.replaceState(history.state, '', window.location.pathname + window.location.search)
  try {
    return decodeURIComponent(m[1])
  } catch {
    return null
  }
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking')
  const [content, setContent] = useState<Content | null>(null)
  const manifest = useRef<Manifest | null>(null)
  const key = useRef<CryptoKey | null>(null)
  const urls = useRef(new Map<string, Promise<string>>())

  const open = useCallback(async (master: ArrayBuffer | Uint8Array) => {
    const m = manifest.current!
    const k = await keyFromMaster(master)
    const raw = await fetchBlob(k, m.content) // échoue si la clé est fausse (tag GCM invalide)
    key.current = k
    setContent(JSON.parse(new TextDecoder().decode(raw)))
    setStatus('open')
  }, [])

  const unlock = useCallback(
    async (passphrase: string, remember: boolean) => {
      const m = manifest.current
      if (!m) return false
      setStatus('unlocking')
      try {
        const master = await deriveMaster(passphrase.trim(), m)
        await open(master)
        if (remember) storage.set(REMEMBER_KEY, { salt: m.kdf.salt, master: toB64(master) })
        return true
      } catch {
        setStatus('locked')
        return false
      }
    },
    [open],
  )

  const lock = useCallback(() => {
    storage.remove(REMEMBER_KEY)
    for (const p of urls.current.values()) p.then((u) => URL.revokeObjectURL(u)).catch(() => {})
    urls.current.clear()
    key.current = null
    setContent(null)
    setStatus('locked')
  }, [])

  const media = useCallback((blob: string, mime: string) => {
    let p = urls.current.get(blob)
    if (!p) {
      const k = key.current
      if (!k) return Promise.reject(new Error('Coffre verrouillé'))
      p = fetchBlob(k, blob).then((buf) => URL.createObjectURL(new Blob([buf], { type: mime })))
      p.catch(() => urls.current.delete(blob))
      urls.current.set(blob, p)
    }
    return p
  }, [])

  const started = useRef(false)
  useEffect(() => {
    // Garde : en mode strict React exécute l'effet deux fois en développement.
    if (started.current) return
    started.current = true
    ;(async () => {
      try {
        manifest.current = await fetchManifest()
      } catch {
        setStatus('error')
        return
      }
      if (FRAGMENT_KEY && (await unlock(FRAGMENT_KEY, true))) return
      const saved = storage.get<{ salt: string; master: string }>(REMEMBER_KEY)
      if (saved && saved.salt === manifest.current.kdf.salt) {
        try {
          await open(fromB64(saved.master))
          return
        } catch {
          storage.remove(REMEMBER_KEY)
        }
      }
      setStatus('locked')
    })()
  }, [open, unlock])

  const vaultTag = manifest.current?.kdf.salt.slice(0, 8) ?? 'x'
  const value = useMemo(() => ({ status, content, vaultTag, unlock, lock, media }), [status, content, vaultTag, unlock, lock, media])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useVault() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useVault hors du VaultProvider')
  return v
}

/** Content garanti (à utiliser uniquement une fois le coffre ouvert). */
export function useContent(): Content {
  const { content } = useVault()
  if (!content) throw new Error('Coffre fermé')
  return content
}

/** URL locale (blob:) d'un média déchiffré, ou null pendant le déchiffrement. */
export function useMedia(item: { blob: string; mime: string } | null | undefined): string | null {
  const { media } = useVault()
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!item) return
    let alive = true
    media(item.blob, item.mime).then((u) => alive && setUrl(u)).catch(() => {})
    return () => {
      alive = false
    }
  }, [item, media])
  return item ? url : null
}
