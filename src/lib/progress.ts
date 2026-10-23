import { useCallback, useEffect, useState } from 'react'
import { storage } from './storage'

export interface Progress {
  read: number[]
  introSeen: boolean
  giftOpened: boolean
  finaleSeen: boolean
}

const EMPTY: Progress = { read: [], introSeen: false, giftOpened: false, finaleSeen: false }

/** Progression mémorisée sur l'appareil : lettres ouvertes, intro vue, cadeau ouvert, final vu. */
export function useProgress(tag: string) {
  const key = `cp26:progression:${tag}`
  const [progress, setProgress] = useState<Progress>(() => ({ ...EMPTY, ...storage.get<Progress>(key) }))

  useEffect(() => {
    setProgress({ ...EMPTY, ...storage.get<Progress>(key) })
  }, [key])

  const update = useCallback(
    (fn: (p: Progress) => Progress) =>
      setProgress((p) => {
        const next = fn(p)
        storage.set(key, next)
        return next
      }),
    [key],
  )

  const markRead = useCallback((n: number) => update((p) => (p.read.includes(n) ? p : { ...p, read: [...p.read, n] })), [update])
  const markIntro = useCallback(() => update((p) => ({ ...p, introSeen: true })), [update])
  const setGiftOpened = useCallback((v: boolean) => update((p) => ({ ...p, giftOpened: v })), [update])
  const markFinale = useCallback(() => update((p) => ({ ...p, finaleSeen: true })), [update])

  return { progress, markRead, markIntro, setGiftOpened, markFinale }
}
