import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Content } from '../types'
import { deriveMaster, fetchBlob, fetchManifest, fromB64, keyFromMaster, type Manifest } from './crypto'

type Status = 'loading' | 'open' | 'error'

interface VaultValue {
  status: Status
  content: Content | null
  /** Identifiant court du coffre (sépare la progression de lecture si le contenu est re-scellé avec une autre clé). */
  vaultTag: string
  media: (blob: string, mime: string) => Promise<string>
}

const Ctx = createContext<VaultValue | null>(null)

/** Secours si le site a été construit sans clé : une ancre simple « #mots-de-la-cle » dans l'adresse. */
function fragmentPassphrase(): string | null {
  const h = decodeURIComponent(window.location.hash.replace(/^#/, ''))
  return /^[\p{L}\d-]{12,}$/u.test(h) ? h : null
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [content, setContent] = useState<Content | null>(null)
  const manifest = useRef<Manifest | null>(null)
  const key = useRef<CryptoKey | null>(null)
  const urls = useRef(new Map<string, Promise<string>>())
  const started = useRef(false)

  useEffect(() => {
    // Garde : en mode strict, React exécute l'effet deux fois en développement.
    if (started.current) return
    started.current = true
    ;(async () => {
      try {
        const m = await fetchManifest()
        manifest.current = m
        const pass = fragmentPassphrase()
        const master = __CP26_KEY__ ? fromB64(__CP26_KEY__) : pass ? await deriveMaster(pass, m) : null
        if (!master) throw new Error('Clé absente du build')
        const k = await keyFromMaster(master)
        const raw = await fetchBlob(k, m.content)
        key.current = k
        if (pass) history.replaceState(null, '', window.location.pathname + window.location.search)
        setContent(JSON.parse(new TextDecoder().decode(raw)))
        setStatus('open')
      } catch (e) {
        console.error(e)
        setStatus('error')
      }
    })()
  }, [])

  const media = useCallback((blob: string, mime: string) => {
    let p = urls.current.get(blob)
    if (!p) {
      const k = key.current
      if (!k) return Promise.reject(new Error('Contenu indisponible'))
      p = fetchBlob(k, blob).then((buf) => URL.createObjectURL(new Blob([buf], { type: mime })))
      p.catch(() => urls.current.delete(blob))
      urls.current.set(blob, p)
    }
    return p
  }, [])

  const vaultTag = manifest.current?.kdf.salt.slice(0, 8) ?? 'x'
  const value = useMemo(() => ({ status, content, vaultTag, media }), [status, content, vaultTag, media])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useVault() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useVault hors du VaultProvider')
  return v
}

export function useContent(): Content {
  const { content } = useVault()
  if (!content) throw new Error('Contenu indisponible')
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
