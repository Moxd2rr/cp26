import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useVault } from '../vault/VaultProvider'
import { WaxSeal } from '../components/WaxSeal'

const GOLD: [string, string, string] = ['#f3dfa6', '#c29a4f', '#5a3f14']

/** Écran verrouillé : rien n'est lisible tant que la bonne clé n'a pas été saisie. */
export function Lock() {
  const { status, unlock } = useVault()
  const [value, setValue] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState(false)
  const busy = status === 'unlocking' || status === 'checking'

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!value.trim() || busy) return
    setError(false)
    const ok = await unlock(value, remember)
    if (!ok) setError(true)
  }

  return (
    <motion.main
      className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(6px)', transition: { duration: 0.9 } }}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
        animate={busy ? { scale: [1, 1.06, 1], opacity: 1, rotate: 0 } : { scale: 1, opacity: 1, rotate: 0 }}
        transition={busy ? { duration: 1.2, repeat: Infinity } : { duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 drop-shadow-[0_0_40px_rgba(201,164,92,0.35)]"
      >
        <WaxSeal label="26" colors={GOLD} size={112} seed={26} />
      </motion.div>

      <motion.p
        className="smallcaps mb-4 text-gold/80"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1.2 }}
      >
        Coffret scellé
      </motion.p>
      <motion.h1
        className="font-display text-5xl font-light italic tracking-wide sm:text-6xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 1.4 }}
      >
        <span className="gold-text">Chapitre 26</span>
      </motion.h1>
      <motion.p
        className="mt-6 max-w-sm font-display text-lg leading-relaxed text-ivory/70 italic"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 1.4 }}
      >
        Ce qui se trouve ici n'est destiné qu'à une seule personne.
        <br />
        Entre la clé qui t'a été confiée.
      </motion.p>

      <motion.form
        onSubmit={submit}
        className="mt-10 flex w-full max-w-sm flex-col items-center gap-5"
        initial={{ opacity: 0, y: 12 }}
        animate={error ? { opacity: 1, y: 0, x: [0, -10, 9, -6, 4, 0] } : { opacity: 1, y: 0 }}
        transition={error ? { duration: 0.5 } : { delay: 1.4, duration: 1.2 }}
      >
        <label className="sr-only" htmlFor="cle">
          Clé
        </label>
        <input
          id="cle"
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(false)
          }}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="ta clé"
          disabled={busy}
          className="w-full border-0 border-b border-gold/40 bg-transparent px-2 py-3 text-center font-display text-2xl tracking-wider text-ivory placeholder:text-ivory/25 placeholder:italic focus:border-gold-soft focus:outline-none"
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ivory/50">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#c9a45c]"
          />
          Se souvenir de cet appareil
        </label>
        <button type="submit" className="btn-gold mt-2" disabled={busy}>
          {busy ? 'Le sceau cède…' : 'Briser le sceau'}
        </button>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-display text-lg text-[#e7a3a3] italic"
              role="alert"
            >
              Cette clé n'ouvre pas ce sceau.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.form>
    </motion.main>
  )
}
