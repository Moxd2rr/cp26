import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import type { Letter } from '../types'
import { AMBIANCE, pad } from '../lib/ambiance'
import { WaxSeal } from './WaxSeal'

const silk = [0.22, 1, 0.36, 1] as const

/**
 * Ouverture d'une enveloppe : apparition → le sceau se brise → le rabat s'ouvre → la lettre sort.
 * Toucher l'écran passe directement à la lecture. Plus court pour une relecture.
 */
export function EnvelopeOpening({ letter, reread, isFinal, onDone }: { letter: Letter; reread: boolean; isFinal: boolean; onDone: () => void }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const speed = reread ? 0.55 : isFinal ? 1.25 : 1
  // Étapes : 0 apparition, 1 sceau brisé, 2 rabat qui s'ouvre, 3 rabat passé derrière, 4 lettre sortie, 5 sortie
  const [step, setStep] = useState(0)
  const wax = AMBIANCE[letter.ambiance].wax
  const dark = isFinal

  useEffect(() => {
    if (reduce) {
      const t = setTimeout(onDone, 500)
      return () => clearTimeout(t)
    }
    const times = [700, 1200, 1600, 2250, 3150].map((t) => t * speed)
    const timers = times.map((t, i) => setTimeout(() => setStep(i + 1), t))
    timers.push(setTimeout(onDone, 3750 * speed))
    return () => timers.forEach(clearTimeout)
  }, [onDone, reduce, speed])

  const paperTone = dark ? 'paper-dark' : 'paper'
  const inner = dark ? 'border-gold/25' : 'border-[rgb(110_80_35/0.15)]'

  return (
    <motion.div
      className="fixed inset-0 z-40 flex cursor-pointer items-center justify-center bg-night/80 backdrop-blur-[3px]"
      onClick={onDone}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      role="presentation"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute h-[70vmin] w-[70vmin] rounded-full"
        style={{ background: `radial-gradient(closest-side, rgb(${AMBIANCE[letter.ambiance].glow} / 0.35), transparent)` }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: step >= 4 ? 1.5 : 1, opacity: step >= 1 ? 1 : 0.5 }}
        transition={{ duration: 1.4, ease: silk }}
      />

      <motion.div
        className="relative aspect-[1.45] w-[min(84vw,460px)] [perspective:1400px]"
        initial={{ scale: 0.7, y: 40, opacity: 0, rotate: -3 }}
        animate={step >= 5 ? { scale: 1.08, y: 60, opacity: 0 } : { scale: 1, y: step >= 4 ? 70 : 0, opacity: 1, rotate: 0 }}
        transition={{ duration: step >= 4 ? 0.9 * speed : 0.8 * speed, ease: silk }}
      >
        {/* Fond de l'enveloppe */}
        <div className={`${paperTone} absolute inset-0 rounded-[4px]`} style={{ filter: dark ? undefined : 'brightness(0.9)' }} />

        {/* La lettre */}
        <motion.div
          className={`paper absolute inset-x-[6%] top-[5%] h-[90%] rounded-[2px] px-[8%] pt-[9%]`}
          style={{ zIndex: step >= 4 ? 30 : 2 }}
          initial={{ y: 0 }}
          animate={{ y: step >= 4 ? '-62%' : 0, scale: step >= 5 ? 1.15 : 1, opacity: step >= 5 ? 0 : 1 }}
          transition={{ duration: 0.9 * speed, ease: silk }}
        >
          <p className="smallcaps !text-[0.55rem] text-gold-deep">Lettre n° {pad(letter.number)}</p>
          <p className="mt-2 font-script text-[clamp(1.5rem,6vw,2.1rem)] leading-tight text-ink">{letter.author}</p>
          <div className="mt-4 space-y-2 opacity-30">
            {[92, 100, 84, 96, 70].map((w, i) => (
              <div key={i} className="h-[3px] rounded bg-ink/40" style={{ width: `${w}%` }} />
            ))}
          </div>
        </motion.div>

        {/* Poche avant (découpe en V) */}
        <div className="absolute inset-0" style={{ zIndex: 10 }}>
          <div
            className={`${paperTone} absolute inset-0 rounded-[4px]`}
            style={{ clipPath: 'polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)' }}
          />
          <svg viewBox="0 0 145 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            <path d="M0,0 L72.5,52 L145,0" stroke={dark ? 'rgb(201 164 92 / 0.4)' : 'rgb(110 80 35 / 0.22)'} strokeWidth="0.45" fill="none" />
            <path d="M0,100 L60,45 M145,100 L85,45" stroke={dark ? 'rgb(201 164 92 / 0.2)' : 'rgb(110 80 35 / 0.14)'} strokeWidth="0.45" fill="none" />
          </svg>
          <div className={`absolute inset-[8px] rounded-[2px] border ${inner} opacity-60`} style={{ clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)' }} />
        </div>

        {/* Rabat */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[56%] origin-top [transform-style:preserve-3d]"
          style={{ zIndex: step >= 3 ? 1 : 20 }}
          initial={{ rotateX: 0 }}
          animate={{ rotateX: step >= 2 ? 178 : 0 }}
          transition={{ duration: 0.75 * speed, ease: [0.45, 0, 0.2, 1] }}
        >
          <div
            className={`${paperTone} absolute inset-0 [backface-visibility:hidden]`}
            style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', filter: dark ? undefined : 'brightness(1.02)' }}
          />
          <div
            className={`${paperTone} absolute inset-0 [backface-visibility:hidden] [transform:rotateX(180deg)]`}
            style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)', filter: 'brightness(0.82)' }}
          />
        </motion.div>

        {/* Sceau */}
        <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 25 }}>
          {step < 1 ? (
            <motion.div initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: silk }}>
              <WaxSeal label={String(letter.number)} colors={wax} size={70} seed={letter.number} />
            </motion.div>
          ) : (
            <div className="relative h-[70px] w-[70px]">
              <motion.div
                className="absolute inset-0"
                initial={{ x: 0, rotate: 0, opacity: 1 }}
                animate={{ x: -34, y: 70, rotate: -38, opacity: 0 }}
                transition={{ duration: 1 * speed, ease: [0.5, 0, 0.75, 0] }}
              >
                <WaxSeal label={String(letter.number)} colors={wax} size={70} seed={letter.number} half="left" />
              </motion.div>
              <motion.div
                className="absolute inset-0"
                initial={{ x: 0, rotate: 0, opacity: 1 }}
                animate={{ x: 34, y: 76, rotate: 42, opacity: 0 }}
                transition={{ duration: 1 * speed, ease: [0.5, 0, 0.75, 0] }}
              >
                <WaxSeal label={String(letter.number)} colors={wax} size={70} seed={letter.number} half="right" />
              </motion.div>
              <motion.div
                className="absolute inset-[-30px] rounded-full"
                style={{ background: 'radial-gradient(closest-side, rgb(255 240 200 / 0.8), transparent)' }}
                initial={{ scale: 0.2, opacity: 0.9 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.9 }}
              />
            </div>
          )}
        </div>
      </motion.div>

      <motion.p
        className="smallcaps absolute bottom-10 text-ivory/35"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Touche pour lire
      </motion.p>
    </motion.div>
  )
}
