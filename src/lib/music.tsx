import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useContent, useMedia } from '../vault/VaultProvider'
import { storage } from './storage'

type Mood = 'fond' | 'finale' | 'fin'
const LEVEL: Record<Mood, number> = { fond: 0.32, finale: 0.6, fin: 0.38 }

interface MusicValue {
  available: boolean
  playing: boolean
  muted: boolean
  /** À appeler dans un geste (clic) : les navigateurs bloquent le son sans interaction. */
  start: () => void
  toggle: () => void
  setMood: (m: Mood) => void
}

const Ctx = createContext<MusicValue>({ available: false, playing: false, muted: false, start: () => {}, toggle: () => {}, setMood: () => {} })
const MUTE_KEY = 'cp26:muet'

/**
 * Musique de fond douce : démarre au premier geste, fondus lents, volume bas pendant la lecture,
 * un peu plus présent pendant le final. Le volume passe par Web Audio (seul moyen fiable sur iPhone).
 */
export function MusicProvider({ children }: { children: ReactNode }) {
  const c = useContent()
  const url = useMedia(c.music)
  const audio = useRef<HTMLAudioElement | null>(null)
  const graph = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(() => storage.get<boolean>(MUTE_KEY) === true)
  const mood = useRef<Mood>('fond')
  const wanted = useRef(false)

  useEffect(() => {
    if (!url) return
    const a = new Audio(url)
    a.loop = true
    a.preload = 'auto'
    audio.current = a
    // Si l'utilisateur a déjà interagi avant la fin du déchiffrement, on démarre maintenant.
    if (wanted.current && !muted) void play()
    return () => {
      a.pause()
      audio.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  const target = useCallback(() => (muted ? 0 : LEVEL[mood.current]), [muted])

  const ramp = useCallback((value: number, seconds: number) => {
    const g = graph.current
    if (g) {
      const now = g.ctx.currentTime
      g.gain.gain.cancelScheduledValues(now)
      g.gain.gain.setValueAtTime(g.gain.gain.value, now)
      g.gain.gain.linearRampToValueAtTime(value, now + seconds)
    } else if (audio.current) {
      audio.current.volume = Math.min(1, value)
    }
  }, [])

  const play = useCallback(async () => {
    const a = audio.current
    if (!a) return
    if (!graph.current) {
      try {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new Ctor()
        const gain = ctx.createGain()
        gain.gain.value = 0
        ctx.createMediaElementSource(a).connect(gain).connect(ctx.destination)
        graph.current = { ctx, gain }
      } catch {
        a.volume = 0
      }
    }
    try {
      await graph.current?.ctx.resume()
      await a.play()
      setPlaying(true)
      ramp(target(), 4)
    } catch {
      /* lecture refusée : on réessaiera au prochain geste */
    }
  }, [ramp, target])

  const start = useCallback(() => {
    wanted.current = true
    if (!muted && !playing) void play()
  }, [muted, playing, play])

  const toggle = useCallback(() => {
    const next = !muted
    setMuted(next)
    storage.set(MUTE_KEY, next)
    wanted.current = true
    if (next) {
      ramp(0, 0.8)
      setTimeout(() => audio.current?.pause(), 850)
      setPlaying(false)
    } else {
      void play().then(() => ramp(LEVEL[mood.current], 2))
    }
  }, [muted, play, ramp])

  const setMood = useCallback(
    (m: Mood) => {
      mood.current = m
      if (playing && !muted) ramp(LEVEL[m], m === 'finale' ? 3 : 5)
    },
    [playing, muted, ramp],
  )

  // Pause quand l'onglet est caché, reprise au retour.
  useEffect(() => {
    const onVis = () => {
      const a = audio.current
      if (!a || muted || !wanted.current) return
      if (document.hidden) a.pause()
      else if (playing) void a.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [muted, playing])

  const value = useMemo(
    () => ({ available: !!c.music, playing, muted, start, toggle, setMood }),
    [c.music, playing, muted, start, toggle, setMood],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useMusic = () => useContext(Ctx)

/** Petit bouton discret pour couper / remettre la musique. */
export function SoundToggle() {
  const m = useMusic()
  return (
    <AnimatePresence>
      {m.available && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={m.toggle}
          aria-pressed={!m.muted}
          aria-label={m.muted ? 'Remettre la musique' : 'Couper la musique'}
          title={m.muted ? 'Remettre la musique' : 'Couper la musique'}
          className="fixed bottom-[max(14px,env(safe-area-inset-bottom))] left-[max(14px,env(safe-area-inset-left))] z-[65] flex h-9 w-9 items-center justify-center rounded-full bg-table-deep/75 text-cream/55 backdrop-blur-sm transition-colors hover:text-cream"
        >
          <span className="relative flex h-3 items-end gap-[2px]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-[2px] rounded-full bg-current"
                animate={m.playing && !m.muted ? { height: ['30%', '100%', '45%', '80%', '30%'] } : { height: '30%' }}
                transition={{ duration: 1.6 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
            {m.muted && <span className="absolute -left-1 top-1/2 h-px w-5 -rotate-45 bg-current" />}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
