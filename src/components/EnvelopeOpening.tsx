import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { Letter } from '../types'
import { pad } from '../lib/ambiance'
import { EnvelopeBack, EnvelopeFront, Flap, Seal } from './Envelope'

const soft = [0.22, 1, 0.36, 1] as const

/**
 * Ouverture : l'enveloppe arrive face avant → se retourne → le sceau se brise → le rabat s'ouvre → la lettre sort.
 * Toucher l'écran passe directement à la lecture. Plus rapide pour une relecture.
 */
export function EnvelopeOpening({
  letter,
  recipient,
  reread,
  onDone,
}: {
  letter: Letter
  recipient: string
  reread: boolean
  onDone: () => void
}) {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const k = reread ? 0.55 : 1
  // 0 arrivée · 1 retournement (mi-course) · 2 dos visible · 3 sceau brisé · 4 rabat ouvert · 5 lettre sortie · 6 départ
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (reduce) {
      const t = setTimeout(onDone, 450)
      return () => clearTimeout(t)
    }
    const times = [650, 900, 1350, 1750, 2500, 3350].map((t) => t * k)
    const timers = times.map((t, i) => setTimeout(() => setStep(i + 1), t))
    timers.push(setTimeout(onDone, 3900 * k))
    return () => timers.forEach(clearTimeout)
  }, [onDone, reduce, k])

  const back = step >= 1
  const flapOpen = step >= 4

  return (
    <motion.div
      className="fixed inset-0 z-40 flex cursor-pointer items-center justify-center bg-table-deep/75 backdrop-blur-[2px]"
      onClick={onDone}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45 } }}
      role="presentation"
    >
      <motion.div
        className="relative aspect-[1.42] w-[min(86vw,480px)]"
        initial={{ y: 60, rotate: -6, opacity: 0, scale: 0.85 }}
        animate={
          step >= 6
            ? { y: 120, opacity: 0, scale: 0.95, rotate: 0 }
            : { y: step >= 5 ? 90 : 0, rotate: step >= 2 ? 0 : -2, opacity: 1, scale: 1 }
        }
        transition={{ duration: step >= 5 ? 0.9 * k : 0.6 * k, ease: soft }}
      >
        {/* Retournement : on écrase horizontalement, on change de face, on déplie. */}
        <motion.div
          className="lifted absolute inset-0 rounded-[2px]"
          animate={{ scaleX: step === 1 ? 0 : 1 }}
          transition={{ duration: 0.25 * k, ease: 'easeInOut' }}
        >
          {!back ? (
            <EnvelopeFront letter={letter} recipient={recipient} />
          ) : (
            <>
              <EnvelopeBack letter={letter} />

              {/* La lettre, glissée dans l'enveloppe */}
              <motion.div
                className="paper absolute inset-x-[5%] top-[4%] h-[92%] rounded-[1px] px-[8%] pt-[8%] shadow-[0_-2px_8px_rgb(0_0_0/0.12)]"
                style={{ zIndex: step >= 5 ? 30 : 2 }}
                animate={{ y: step >= 5 ? '-64%' : 0 }}
                transition={{ duration: 0.85 * k, ease: soft }}
              >
                <p className="typed !text-[0.6rem] text-ink-soft">Lettre n° {pad(letter.number)}</p>
                <p className="hand mt-2 text-[clamp(1.3rem,5.5vw,1.9rem)] text-pen">{letter.author}</p>
                {letter.tagline && <p className="font-serif text-sm italic text-ink-soft">« {letter.tagline} »</p>}
                <div className="mt-4 space-y-2.5 opacity-25">
                  {[94, 100, 86, 97, 72].map((w, i) => (
                    <div key={i} className="h-[2px] rounded bg-ink" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </motion.div>

              {/* Poche avant */}
              <div className="absolute inset-0" style={{ zIndex: 10, clipPath: 'polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)' }}>
                <EnvelopeBack letter={letter} />
              </div>

              {/* Rabat : se replie vers le haut (miroir vertical), passe derrière la lettre à mi-course */}
              <motion.div
                className="absolute inset-0 origin-top"
                style={{ zIndex: flapOpen ? 1 : 20 }}
                animate={{ scaleY: flapOpen ? -1 : 1 }}
                transition={{ duration: 0.6 * k, ease: [0.5, 0, 0.3, 1] }}
              >
                <Flap letter={letter} open={flapOpen} />
              </motion.div>

              {/* Sceau de cire */}
              <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 25 }}>
                {step < 3 ? (
                  <motion.div initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.35 }}>
                    <Seal letter={letter} size={66} />
                  </motion.div>
                ) : (
                  <div className="relative h-[66px] w-[66px]">
                    {(['left', 'right'] as const).map((side) => (
                      <motion.div
                        key={side}
                        className="absolute inset-0"
                        initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                        animate={{ x: side === 'left' ? -30 : 32, y: 80, rotate: side === 'left' ? -35 : 40, opacity: 0 }}
                        transition={{ duration: 0.9 * k, ease: [0.5, 0, 0.75, 0] }}
                      >
                        <Seal letter={letter} size={66} half={side} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>

      <motion.p className="typed absolute bottom-10 text-cream/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
        touche pour lire
      </motion.p>
    </motion.div>
  )
}
