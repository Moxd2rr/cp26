import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react'
import { useContent, useVault } from '../vault/VaultProvider'
import { GoldDust } from '../components/GoldDust'
import { buildScenes, totalDuration, type Scene } from './timeline'
import { Converge, End, Message, Names, Opening, PhotoScene, QuoteScene, Reveal } from './Scenes'

/**
 * Animation finale (~1 min) : toutes les lettres se rejoignent en un seul message.
 * Pause, passage direct à la fin, son (si une musique est fournie), relecture.
 */
export function Finale({ onExit, onSeen }: { onExit: () => void; onSeen: () => void }) {
  const c = useContent()
  const { media } = useVault()
  const scenes = useMemo(() => buildScenes(c), [c])
  const music = c.finale.music
  const [phase, setPhase] = useState<'loading' | 'ready' | 'playing'>('loading')
  const [run, setRun] = useState(0)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audio = useRef<HTMLAudioElement>(null)

  // Préchargement (déchiffrement) des photos et de la musique avant de commencer.
  useEffect(() => {
    let alive = true
    const jobs: Promise<unknown>[] = c.finale.photos.map((p) => media(p.photo.blob, p.photo.mime))
    if (music) jobs.push(media(music.blob, music.mime).then((u) => alive && setAudioUrl(u)))
    Promise.allSettled([...jobs, new Promise((r) => setTimeout(r, 900))]).then(() => {
      if (alive) setPhase(music ? 'ready' : 'playing')
    })
    return () => {
      alive = false
    }
  }, [c, media, music])

  // Horloge de la séquence (s'arrête en pause et quand l'onglet est caché).
  const progress = useMotionValue(0)
  const width = useTransform(progress, (v) => `${v * 100}%`)
  const total = totalDuration(scenes) * 1000
  const state = useRef({ index: 0, elapsed: 0, paused: false })
  state.current.paused = paused

  useEffect(() => {
    if (phase !== 'playing') return
    state.current.index = 0
    state.current.elapsed = 0
    setIndex(0)
    const starts = scenes.map((_, i) => scenes.slice(0, i).reduce((a, s) => a + s.dur * 1000, 0))
    let raf = 0
    let last = performance.now()
    const loop = (t: number) => {
      const dt = Math.min(100, t - last)
      last = t
      const s = state.current
      if (!s.paused) {
        s.elapsed += dt
        const d = scenes[s.index].dur * 1000
        if (s.elapsed >= d && s.index < scenes.length - 1) {
          s.index += 1
          s.elapsed = 0
          setIndex(s.index)
        }
        progress.set(Math.min(1, (starts[s.index] + Math.min(s.elapsed, scenes[s.index].dur * 1000 || 0)) / total))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, run, scenes, total, progress])

  const scene = scenes[index]
  const atEnd = scene.kind === 'end'

  useEffect(() => {
    if (atEnd) onSeen()
  }, [atEnd, onSeen])

  // Musique : fondu d'entrée, suit la pause, fondu de sortie à la fin.
  useEffect(() => {
    const a = audio.current
    if (!a || phase !== 'playing') return
    a.muted = muted
    if (paused) a.pause()
    else a.play().catch(() => {})
  }, [paused, muted, phase, run])

  useEffect(() => {
    const a = audio.current
    if (!a || phase !== 'playing') return
    let raf = 0
    const target = atEnd ? 0.35 : 0.85
    const step = () => {
      a.volume += (target - a.volume) * 0.03
      if (Math.abs(a.volume - target) > 0.01) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [atEnd, phase])

  const start = () => {
    const a = audio.current
    if (a) {
      a.currentTime = 0
      a.volume = 0
      a.play().catch(() => {})
    }
    setPhase('playing')
  }

  const replay = useCallback(() => {
    if (audio.current) {
      audio.current.currentTime = 0
      audio.current.volume = 0
    }
    setPaused(false)
    setRun((r) => r + 1)
  }, [])

  const skip = () => {
    state.current.index = scenes.length - 1
    state.current.elapsed = 0
    setIndex(scenes.length - 1)
    progress.set(1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit()
      if (e.key === ' ' && phase === 'playing' && !atEnd) {
        e.preventDefault()
        setPaused((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit, phase, atEnd])

  const dustMode = scene.kind === 'converge' ? 'converge' : scene.kind === 'reveal' ? 'burst' : 'drift'

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
      transition={{ duration: 1.6 }}
    >
      {audioUrl && <audio ref={audio} src={audioUrl} preload="auto" loop={false} />}
      <GoldDust density={1.3} mode={phase === 'playing' ? dustMode : 'drift'} />
      <div className="vignette" />

      <AnimatePresence>
        {phase !== 'playing' && (
          <motion.div
            key="prelude"
            className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center"
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
          >
            {phase === 'loading' ? (
              <motion.div
                className="h-2 w-2 rounded-full bg-gold-soft"
                animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.8, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4 }}>
                <p className="font-display text-2xl italic text-ivory/85 sm:text-3xl">Installe-toi. Monte le son.</p>
                <button className="btn-gold mt-10" onClick={start}>
                  Commencer
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'playing' && (
        <div key={run} className="absolute inset-0 z-10" aria-live="polite">
          <AnimatePresence>
            <SceneView key={`${run}-${index}`} scene={scene} onReplay={replay} onExit={onExit} />
          </AnimatePresence>
        </div>
      )}

      {/* Commandes */}
      <div className="absolute right-3 top-3 z-20 flex items-center gap-1 opacity-60 transition-opacity hover:opacity-100 sm:right-6 sm:top-5">
        {phase === 'playing' && !atEnd && (
          <>
            {music && (
              <button className="btn-ghost p-2.5" onClick={() => setMuted((m) => !m)} aria-pressed={muted}>
                {muted ? 'Son ✕' : 'Son'}
              </button>
            )}
            <button className="btn-ghost p-2.5" onClick={() => setPaused((p) => !p)}>
              {paused ? 'Reprendre' : 'Pause'}
            </button>
            <button className="btn-ghost p-2.5" onClick={skip}>
              Passer
            </button>
          </>
        )}
        <button className="btn-ghost p-2.5" onClick={onExit} aria-label="Fermer et revenir aux lettres">
          ✕
        </button>
      </div>
      {phase === 'playing' && !atEnd && (
        <div className="absolute inset-x-0 bottom-0 z-20 h-px bg-ivory/5">
          <motion.div className="h-px bg-gradient-to-r from-gold-deep via-gold-soft to-gold" style={{ width }} />
        </div>
      )}
      <AnimatePresence>
        {paused && (
          <motion.p
            className="smallcaps absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-ivory/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            En pause
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SceneView({ scene, onReplay, onExit }: { scene: Scene; onReplay: () => void; onExit: () => void }) {
  switch (scene.kind) {
    case 'opening':
      return <Opening lines={scene.lines} />
    case 'names':
      return <Names names={scene.names} />
    case 'quote':
      return <QuoteScene quote={scene.quote} />
    case 'photo':
      return <PhotoScene photo={scene.photo} quote={scene.quote} dur={scene.dur} />
    case 'converge':
      return <Converge names={scene.names} />
    case 'reveal':
      return <Reveal age={scene.age} subtitle={scene.subtitle} />
    case 'message':
      return <Message lines={scene.lines} />
    case 'end':
      return <End conclusion={scene.conclusion} signature={scene.signature} names={scene.names} onReplay={onReplay} onExit={onExit} />
  }
}
