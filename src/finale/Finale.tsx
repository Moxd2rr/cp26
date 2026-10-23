import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react'
import { useContent, useVault } from '../vault/VaultProvider'
import { useMusic } from '../lib/music'
import { buildScenes, totalDuration, type Scene } from './timeline'
import { Converge, End, Message, Names, Opening, PhotoScene, QuoteScene, Reveal } from './Scenes'

/**
 * Animation finale (~1 min) : toutes les lettres se rejoignent en un seul message.
 * Pause, passage direct à la fin, relecture. La musique de fond monte doucement pendant la séquence.
 */
export function Finale({ onExit, onSeen }: { onExit: () => void; onSeen: () => void }) {
  const c = useContent()
  const { media } = useVault()
  const music = useMusic()
  const scenes = useMemo(() => buildScenes(c), [c])
  const quoteIndex = useMemo(() => {
    const m = new Map<Scene, number>()
    scenes.filter((s) => s.kind === 'quote').forEach((s, i) => m.set(s, i))
    return m
  }, [scenes])
  const [ready, setReady] = useState(false)
  const [run, setRun] = useState(0)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  // Déchiffre les photos avant de commencer.
  useEffect(() => {
    let alive = true
    const jobs = c.finale.photos.map((p) => media(p.photo.blob, p.photo.mime))
    Promise.allSettled([...jobs, new Promise((r) => setTimeout(r, 900))]).then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [c, media])

  const progress = useMotionValue(0)
  const width = useTransform(progress, (v) => `${v * 100}%`)
  const total = totalDuration(scenes) * 1000
  const state = useRef({ index: 0, elapsed: 0, paused: false })
  state.current.paused = paused

  // Horloge : s'arrête en pause et quand l'onglet est caché.
  useEffect(() => {
    if (!ready) return
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
        const cur = scenes[s.index].dur * 1000
        progress.set(Math.min(1, (starts[s.index] + Math.min(s.elapsed, Number.isFinite(cur) ? cur : 0)) / total))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [ready, run, scenes, total, progress])

  const scene = scenes[index]
  const atEnd = scene.kind === 'end'

  useEffect(() => {
    if (atEnd) onSeen()
  }, [atEnd, onSeen])

  const { start, setMood } = music
  useEffect(() => {
    start()
    setMood(atEnd ? 'fin' : 'finale')
  }, [atEnd, start, setMood])
  useEffect(() => () => setMood('fond'), [setMood])

  const replay = useCallback(() => {
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
      if (e.key === ' ' && ready && !atEnd) {
        e.preventDefault()
        setPaused((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit, ready, atEnd])

  const glow = scene.kind === 'reveal' || scene.kind === 'converge' ? 0.32 : scene.kind === 'end' ? 0.22 : 0.14

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden bg-table-deep"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1 } }}
      transition={{ duration: 1.4 }}
    >
      {/* La lampe, qui respire avec la séquence */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{ background: `radial-gradient(70% 60% at 50% 30%, rgb(255 205 145 / ${glow}), transparent 72%)` }}
        transition={{ duration: 2.5 }}
      />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div className="h-1.5 w-1.5 rounded-full bg-cream" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.4, repeat: Infinity }} />
        </div>
      )}

      {ready && (
        <div key={run} className="absolute inset-0 z-10" aria-live="polite">
          <AnimatePresence>
            <SceneView key={`${run}-${index}`} scene={scene} quoteIndex={quoteIndex.get(scene) ?? 0} onReplay={replay} onExit={onExit} />
          </AnimatePresence>
        </div>
      )}

      <div className="absolute right-[max(10px,env(safe-area-inset-right))] top-[max(8px,env(safe-area-inset-top))] z-20 flex items-center gap-1 opacity-70 transition-opacity hover:opacity-100">
        {ready && !atEnd && (
          <>
            <button className="link p-2.5" onClick={() => setPaused((p) => !p)}>
              {paused ? 'Reprendre' : 'Pause'}
            </button>
            <button className="link p-2.5" onClick={skip}>
              Passer
            </button>
          </>
        )}
        <button className="link p-2.5" onClick={onExit} aria-label="Fermer et revenir aux lettres">
          Fermer
        </button>
      </div>
      {ready && !atEnd && (
        <div className="absolute inset-x-0 bottom-0 z-20 h-px bg-cream/5">
          <motion.div className="h-px bg-cream/40" style={{ width }} />
        </div>
      )}
      <AnimatePresence>
        {paused && (
          <motion.p
            className="typed absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-cream/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            en pause
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SceneView({ scene, quoteIndex, onReplay, onExit }: { scene: Scene; quoteIndex: number; onReplay: () => void; onExit: () => void }) {
  switch (scene.kind) {
    case 'opening':
      return <Opening lines={scene.lines} />
    case 'names':
      return <Names names={scene.names} />
    case 'quote':
      return <QuoteScene quote={scene.quote} index={quoteIndex} />
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
