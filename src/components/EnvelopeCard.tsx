import { motion } from 'motion/react'
import type { Letter } from '../types'
import { AMBIANCE, pad } from '../lib/ambiance'
import { WaxSeal } from './WaxSeal'
import { scriptFriendly } from '../lib/text'

interface Props {
  letter: Letter
  read: boolean
  index: number
  onOpen: () => void
}

/** Enveloppe de la galerie : papier ivoire, rabat, sceau de cire numéroté. */
export function EnvelopeCard({ letter, read, index, onOpen }: Props) {
  const wax = AMBIANCE[letter.ambiance].wax
  return (
    <motion.button
      onClick={onOpen}
      aria-label={`Lettre ${letter.number}, de ${letter.author}${read ? ' (déjà lue)' : ''}`}
      className="group relative block aspect-[1.42] w-full text-left [perspective:900px]"
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, delay: 0.25 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className={`paper absolute inset-0 overflow-hidden rounded-[3px] transition-[filter,box-shadow] duration-700 ${
          read ? 'brightness-[0.86] saturate-[0.85]' : ''
        } group-hover:brightness-105 group-hover:shadow-[0_30px_70px_-25px_rgba(0,0,0,0.9),0_0_40px_-10px_rgba(201,164,92,0.45)]`}
        whileHover={{ y: -6, rotateX: 4 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        {/* Plis de l'enveloppe */}
        <svg viewBox="0 0 142 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <path d="M0,100 L60,47 M142,100 L82,47" stroke="rgb(110 80 35 / 0.18)" strokeWidth="0.5" fill="none" />
          <path d="M0,0 L71,54 L142,0 Z" fill="rgb(120 90 40 / 0.07)" />
          <path d="M0,0.4 L71,54 L142,0.4" stroke="rgb(110 80 35 / 0.28)" strokeWidth="0.5" fill="none" />
        </svg>

        <span className="smallcaps absolute left-[6%] top-[8%] !text-[0.55rem] !tracking-[0.28em] text-ink-soft/80">
          N° {pad(letter.number)}
        </span>
        {read && (
          <span className="smallcaps absolute right-[6%] top-[8%] !text-[0.5rem] !tracking-[0.25em] text-ink-soft/70">
            Relire
          </span>
        )}

        <div className="absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-700 group-hover:scale-110">
          {read ? (
            <div className="relative h-[clamp(38px,10vw,54px)] w-[clamp(38px,10vw,54px)] opacity-80">
              <WaxSeal label={String(letter.number)} colors={wax} half="left" seed={letter.number} className="absolute inset-0 h-full w-full -translate-x-[3px] -rotate-6" />
              <WaxSeal label={String(letter.number)} colors={wax} half="right" seed={letter.number} className="absolute inset-0 h-full w-full translate-x-[3px] rotate-6" />
            </div>
          ) : (
            <WaxSeal label={String(letter.number)} colors={wax} seed={letter.number} className="h-[clamp(38px,10vw,54px)] w-[clamp(38px,10vw,54px)]" />
          )}
        </div>

        <div className="absolute inset-x-[5%] bottom-[6%] text-center">
          <span
            className={`block truncate leading-[1.2] text-ink ${
              scriptFriendly(letter.author)
                ? 'font-script text-[clamp(1.1rem,4.4vw,1.65rem)]'
                : 'font-display text-[clamp(0.85rem,3.4vw,1.2rem)] font-medium italic'
            }`}
          >
            {letter.author}
          </span>
        </div>
      </motion.div>
    </motion.button>
  )
}
