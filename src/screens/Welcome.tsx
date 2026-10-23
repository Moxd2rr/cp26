import { motion } from 'motion/react'
import { useContent } from '../vault/VaultProvider'

const silk = [0.22, 1, 0.36, 1] as const

/** Écran d'accueil personnalisé : le prénom, puis un message mystérieux. */
export function Welcome({ onEnter }: { onEnter: () => void }) {
  const c = useContent()
  const { firstName, fullName } = c.recipient
  const rest = fullName.startsWith(firstName) ? fullName.slice(firstName.length).trim() : fullName
  const lines = c.welcome.message.split('\n')

  return (
    <motion.main
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center"
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)', transition: { duration: 1.1, ease: silk } }}
    >
      {/* Faisceau de lumière */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[75vh] w-[min(90vw,720px)] -translate-x-1/2"
        style={{
          background: 'conic-gradient(from 180deg at 50% 0%, transparent 160deg, rgb(230 207 150 / 0.13) 180deg, transparent 200deg)',
          filter: 'blur(8px)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3, delay: 0.3 }}
      />

      <motion.p
        className="smallcaps text-gold/80"
        initial={{ opacity: 0, letterSpacing: '0.8em' }}
        animate={{ opacity: 1, letterSpacing: '0.34em' }}
        transition={{ duration: 2.2, delay: 0.6, ease: silk }}
      >
        {c.welcome.eyebrow}
      </motion.p>

      <h1 className="mt-5 font-display font-light italic leading-[0.95]">
        <span className="sr-only">{c.recipient.fullName}</span>
        <span aria-hidden className="block text-[clamp(3.6rem,15vw,9.5rem)]">
          {[...c.recipient.firstName].map((ch, i) => (
            <motion.span
              key={i}
              className="gold-text inline-block"
              initial={{ opacity: 0, y: 28, filter: 'blur(12px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.6, delay: 1.1 + i * 0.09, ease: silk }}
            >
              {ch}
            </motion.span>
          ))}
        </span>
      </h1>
      {rest && (
        <motion.p
          aria-hidden
          className="smallcaps mt-5 text-ivory/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, delay: 2.2 }}
        >
          {rest}
        </motion.p>
      )}

      <motion.div
        className="hairline mx-auto mt-10 w-40"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.8, delay: 2.6, ease: silk }}
      />

      <div className="mt-10 max-w-md font-display text-xl leading-relaxed text-ivory/80 italic sm:text-2xl">
        {lines.map((l, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.6, delay: 3.2 + i * 1.1, ease: silk }}
          >
            {l}
          </motion.p>
        ))}
      </div>

      <motion.button
        className="btn-gold mt-14"
        onClick={onEnter}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 3.6 + lines.length * 1.1, ease: silk }}
      >
        {c.welcome.button}
      </motion.button>
    </motion.main>
  )
}
