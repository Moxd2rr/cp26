import { forwardRef } from 'react'
import { motion } from 'motion/react'
import type { Letter } from '../types'
import { scatter } from '../lib/ambiance'
import { EnvelopeFront } from './Envelope'

/** Trajectoire de sortie du cadeau : décalage depuis l'ouverture de la boîte jusqu'à la place finale. */
export interface Flight {
  dx: number
  dy: number
  delay: number
  spread: number
}

interface Props {
  letter: Letter
  recipient: string
  read: boolean
  /** caché (dans la boîte), en vol, ou posé */
  phase: 'hidden' | 'flying' | 'placed'
  flight?: Flight
  index: number
  onOpen: () => void
  large?: boolean
  note?: React.ReactNode
}

/** Une enveloppe posée sur la table, légèrement de travers. */
export const EnvelopeCard = forwardRef<HTMLButtonElement, Props>(function EnvelopeCard(
  { letter, recipient, read, phase, flight, index, onOpen, large = false, note },
  ref,
) {
  const s = scatter(letter.number)
  const rest = { x: 0, y: s.y, rotate: s.rotate, scale: 1, opacity: 1 }

  const animate =
    phase === 'hidden'
      ? { opacity: 0 }
      : phase === 'flying' && flight
        ? {
            x: [flight.dx, flight.dx + flight.spread, 0],
            y: [flight.dy, flight.dy - 150 - (index % 3) * 26, s.y],
            rotate: [0, flight.spread / 6, s.rotate],
            scale: [0.22, 0.6, 1],
            opacity: [0, 1, 1],
          }
        : rest

  const transition =
    phase === 'flying' && flight
      ? { duration: 1.55, delay: flight.delay, times: [0, 0.38, 1], ease: [0.3, 0.1, 0.2, 1] as const }
      : { duration: 0.8, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] as const }

  return (
    <motion.button
      ref={ref}
      onClick={onOpen}
      disabled={phase !== 'placed'}
      aria-label={`Lettre ${letter.number}, de ${letter.author}${read ? ' (déjà ouverte)' : ''}`}
      className={`group relative block w-full text-left ${large ? 'aspect-[1.55]' : 'aspect-[1.42]'} disabled:cursor-default`}
      initial={phase === 'placed' ? { ...rest, opacity: 0, y: s.y + 16 } : { opacity: 0 }}
      animate={animate}
      transition={transition}
      style={{ zIndex: phase === 'flying' ? 30 - index : undefined }}
    >
      <motion.div
        className="lifted absolute inset-0 rounded-[2px]"
        whileHover={phase === 'placed' ? { y: -6, rotate: -s.rotate * 0.6, scale: 1.03 } : undefined}
        whileTap={phase === 'placed' ? { scale: 0.97 } : undefined}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <EnvelopeFront letter={letter} recipient={recipient} read={read} note={note} className={read ? 'brightness-[0.93]' : ''} />
      </motion.div>
    </motion.button>
  )
})
