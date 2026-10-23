import { motion } from 'motion/react'
import { useContent } from '../vault/VaultProvider'

const soft = [0.22, 1, 0.36, 1] as const

/** Accueil : la lampe s'allume, le prénom s'écrit à la main, puis le message. */
export function Welcome({ onEnter }: { onEnter: () => void }) {
  const c = useContent()
  const { firstName, fullName } = c.recipient
  const lines = c.welcome.message.split('\n')
  const t0 = 1.2

  return (
    <motion.main
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center"
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
    >
      <motion.p
        className="font-serif text-xl italic text-cream/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: t0 }}
      >
        {c.welcome.eyebrow}
      </motion.p>

      <h1 className="relative mt-2">
        <span className="sr-only">{fullName}</span>
        {/* Le prénom se dévoile de gauche à droite, comme tracé à la plume. */}
        <motion.span
          aria-hidden
          className="hand block px-4 pb-2 text-[clamp(3.4rem,15vw,8rem)] leading-[1.15] text-cream"
          initial={{ clipPath: 'inset(-10% 100% -10% 0)' }}
          animate={{ clipPath: 'inset(-10% 0% -10% 0)' }}
          transition={{ duration: 2.6, delay: t0 + 0.5, ease: [0.45, 0.05, 0.4, 1] }}
        >
          {firstName}
        </motion.span>
      </h1>
      <motion.p
        aria-hidden
        className="typed mt-1 uppercase text-cream/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: t0 + 3 }}
      >
        {fullName}
      </motion.p>

      <div className="mt-12 max-w-md space-y-1 font-serif text-[1.35rem] italic leading-relaxed text-cream/85 sm:text-2xl">
        {lines.map((l, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, delay: t0 + 3.6 + i * 1.1, ease: soft }}
          >
            {l}
          </motion.p>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: t0 + 4.2 + lines.length * 1.1, ease: soft }}
      >
        <button className="btn-tag mt-12" onClick={onEnter}>
          {c.welcome.button}
        </button>
      </motion.div>
    </motion.main>
  )
}
