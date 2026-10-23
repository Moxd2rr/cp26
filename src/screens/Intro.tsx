import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useContent } from '../vault/VaultProvider'

const silk = [0.22, 1, 0.36, 1] as const
const STEP_MS = 2600

/** Introduction : les phrases apparaissent une à une ; toucher l'écran accélère. */
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
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-7 py-20"
      onClick={() => !finished && setShown((s) => s + 1)}
      exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.9 } }}
    >
      <button
        className="btn-ghost absolute right-5 top-5 z-20 p-2 sm:right-8 sm:top-8"
        onClick={(e) => {
          e.stopPropagation()
          onDone()
        }}
      >
        Passer
      </button>

      <div className="max-w-xl space-y-5 text-center sm:space-y-6">
        {lines.slice(0, shown).map((l, i) => {
          const current = i === shown - 1
          return (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
              animate={{ opacity: current ? 1 : 0.42, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.6, ease: silk }}
              className={`font-display italic leading-snug ${
                i === 0 ? 'text-2xl text-gold-soft sm:text-3xl' : 'text-[1.45rem] text-ivory sm:text-[1.9rem]'
              }`}
            >
              {l}
            </motion.p>
          )
        })}
      </div>

      <AnimatePresence>
        {finished && (
          <motion.button
            className="btn-gold mt-14"
            onClick={(e) => {
              e.stopPropagation()
              onDone()
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: 1.2, ease: silk }}
          >
            {c.intro.button}
          </motion.button>
        )}
      </AnimatePresence>

      {!finished && (
        <motion.p
          className="smallcaps absolute bottom-8 text-ivory/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4, duration: 2 }}
        >
          Touche l'écran pour continuer
        </motion.p>
      )}
    </motion.main>
  )
}
