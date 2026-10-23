import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useContent } from '../vault/VaultProvider'

const soft = [0.22, 1, 0.36, 1] as const
const STEP_MS = 2600

/** Introduction : un petit mot posé sur la table, qui s'écrit ligne après ligne. Toucher accélère. */
export function Intro({ onDone }: { onDone: () => void }) {
  const c = useContent()
  const lines = c.intro.lines
  const [shown, setShown] = useState(1)
  const finished = shown >= lines.length

  useEffect(() => {
    if (finished) return
    const t = setTimeout(() => setShown((s) => s + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [shown, finished])

  return (
    <motion.main
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-5 py-20"
      onClick={() => !finished && setShown((s) => s + 1)}
      exit={{ opacity: 0, transition: { duration: 0.7 } }}
    >
      <button
        className="link absolute right-4 top-4 z-20 p-2 sm:right-8 sm:top-6"
        onClick={(e) => {
          e.stopPropagation()
          onDone()
        }}
      >
        Passer
      </button>

      <motion.div
        className="paper lifted relative w-full max-w-[34rem] rotate-[-1.2deg] rounded-[2px] px-7 pb-10 pt-9 sm:px-11 sm:pb-12 sm:pt-11"
        initial={{ opacity: 0, y: 30, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -1.2 }}
        transition={{ duration: 1.2, ease: soft }}
      >
        <div className="space-y-4">
          {lines.map((l, i) => (
            <motion.p
              key={i}
              initial={false}
              animate={{ opacity: i < shown ? 1 : 0, y: i < shown ? 0 : 6 }}
              transition={{ duration: 1.2, ease: soft }}
              className={i === 0 ? 'hand text-[1.7rem] text-pen' : 'font-serif text-[1.22rem] leading-snug text-ink sm:text-[1.35rem]'}
            >
              {l}
            </motion.p>
          ))}
        </div>
      </motion.div>

      <div className="mt-10 h-14">
        <AnimatePresence>
          {finished ? (
            <motion.button
              key="go"
              className="btn-tag"
              onClick={(e) => {
                e.stopPropagation()
                onDone()
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.8, ease: soft }}
            >
              {c.intro.button}
            </motion.button>
          ) : (
            <motion.p key="hint" className="typed text-cream/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 3, duration: 1.5 }}>
              touche pour continuer
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  )
}
