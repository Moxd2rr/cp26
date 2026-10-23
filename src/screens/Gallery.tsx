import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useContent } from '../vault/VaultProvider'
import { EnvelopeCard } from '../components/EnvelopeCard'
import { WaxSeal } from '../components/WaxSeal'
import { AMBIANCE, pad } from '../lib/ambiance'
import type { Progress } from '../lib/progress'

const silk = [0.22, 1, 0.36, 1] as const

interface Props {
  progress: Progress
  onOpen: (n: number) => void
  onFinale: () => void
  onIntro: () => void
  onLock: () => void
}

/** Toutes les lettres, présentées comme des enveloppes scellées. */
export function Gallery({ progress, onOpen, onFinale, onIntro, onLock }: Props) {
  const c = useContent()
  const finalNo = c.finalLetter.number
  const others = c.letters.filter((l) => l.number !== finalNo)
  const final = c.letters.find((l) => l.number === finalNo)!
  const readCount = c.letters.filter((l) => progress.read.includes(l.number)).length
  const remaining = others.filter((l) => !progress.read.includes(l.number)).length
  const finalLocked = c.finalLetter.waitForOthers && remaining > 0 && !progress.read.includes(finalNo)
  const [confirm, setConfirm] = useState(false)

  return (
    <motion.main
      className="scroll-area relative z-10 h-dvh"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      transition={{ duration: 1.2 }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 pb-24 pt-14 sm:px-8 sm:pt-20">
        <header className="mb-12 text-center sm:mb-16">
          <motion.p
            className="smallcaps text-gold/80"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: silk }}
          >
            Chapitre {c.recipient.age} · {c.recipient.firstName}
          </motion.p>
          <motion.h1
            className="mt-4 font-display text-5xl font-light italic sm:text-7xl"
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.6, delay: 0.1, ease: silk }}
          >
            <span className="gold-text">{c.gallery.title}</span>
          </motion.h1>
          <motion.p
            className="mt-4 font-display text-lg text-ivory/65 italic sm:text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.4 }}
          >
            {c.gallery.subtitle}
          </motion.p>
          <motion.div
            className="mx-auto mt-8 w-56"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.6 }}
          >
            <div className="h-px w-full bg-ivory/10">
              <motion.div
                className="h-px bg-gradient-to-r from-gold-deep via-gold-soft to-gold"
                initial={{ width: 0 }}
                animate={{ width: `${(readCount / c.letters.length) * 100}%` }}
                transition={{ duration: 1.6, ease: silk, delay: 0.8 }}
              />
            </div>
            <p className="smallcaps mt-3 !text-[0.58rem] text-ivory/45">
              {readCount === 0 ? 'Aucune ouverte pour l’instant' : `${readCount} sur ${c.letters.length} ouverte${readCount > 1 ? 's' : ''}`}
            </p>
          </motion.div>
          {progress.finaleSeen && (
            <motion.button
              className="btn-gold mt-8"
              onClick={onFinale}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              Revoir le final
            </motion.button>
          )}
        </header>

        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-7 sm:gap-y-9 lg:grid-cols-4">
          {others.map((l, i) => (
            <EnvelopeCard key={l.number} letter={l} index={i} read={progress.read.includes(l.number)} onOpen={() => onOpen(l.number)} />
          ))}
        </div>

        {/* La dernière lettre */}
        <motion.section
          className="mx-auto mt-16 max-w-2xl sm:mt-24"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.4 + others.length * 0.07, ease: silk }}
        >
          <p className="smallcaps mb-5 text-center text-gold/70">Et pour finir</p>
          <button
            onClick={() => (finalLocked ? setConfirm(true) : onOpen(finalNo))}
            className="group relative block aspect-[1.6] w-full overflow-hidden rounded-[4px] text-left sm:aspect-[2]"
            aria-label={`La dernière lettre, de ${final.author}${finalLocked ? ` — à ouvrir en dernier, encore ${remaining} lettre(s)` : ''}`}
          >
            <div className="paper-dark absolute inset-0 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)] transition-shadow duration-700 group-hover:shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),0_0_60px_-10px_rgba(201,164,92,0.4)]" />
            <div className="absolute inset-[10px] rounded-[2px] border border-gold/35" />
            <div className="absolute inset-[15px] rounded-[2px] border border-gold/15" />
            <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
              <path d="M0,0 L100,55 L200,0" stroke="rgb(201 164 92 / 0.35)" strokeWidth="0.35" fill="rgb(201 164 92 / 0.04)" />
            </svg>
            <motion.div
              className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2"
              animate={finalLocked ? {} : { filter: ['drop-shadow(0 0 0px rgba(230,207,150,0))', 'drop-shadow(0 0 22px rgba(230,207,150,0.6))', 'drop-shadow(0 0 0px rgba(230,207,150,0))'] }}
              transition={{ duration: 3.2, repeat: Infinity }}
            >
              <WaxSeal label={pad(final.number)} colors={AMBIANCE[final.ambiance].wax} size={76} seed={final.number} className="transition-transform duration-700 group-hover:scale-110" />
            </motion.div>
            <div className="absolute inset-x-6 top-[12%] text-center">
              <span className="smallcaps text-gold/80">La dernière lettre</span>
            </div>
            <div className="absolute inset-x-6 bottom-[11%] text-center">
              <span className="block font-display text-sm italic text-ivory/55">de</span>
              <span className="gold-text block font-script text-[clamp(1.7rem,6vw,2.4rem)] leading-tight">{final.author}</span>
            </div>
          </button>
          <p className="mt-4 text-center font-display text-base italic text-ivory/45">
            {finalLocked
              ? `Garde-la pour la fin — encore ${remaining} lettre${remaining > 1 ? 's' : ''} avant elle.`
              : progress.read.includes(finalNo)
                ? 'Elle t’attend toujours, si tu veux la relire.'
                : 'Elle est prête. Prends ton temps.'}
          </p>
          <AnimatePresence>
            {confirm && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden text-center"
              >
                <p className="mx-auto mt-6 max-w-md font-display text-lg italic text-ivory/80">
                  Elle a été pensée pour être lue en dernier. L’ouvrir quand même ?
                </p>
                <div className="mt-5 flex items-center justify-center gap-6">
                  <button className="btn-ghost p-2" onClick={() => setConfirm(false)}>
                    J’attends
                  </button>
                  <button
                    className="btn-gold !px-6 !py-3"
                    onClick={() => {
                      setConfirm(false)
                      onOpen(finalNo)
                    }}
                  >
                    L’ouvrir
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <footer className="mt-24 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center">
          <button className="btn-ghost p-2" onClick={onIntro}>
            Revoir l’introduction
          </button>
          <span className="text-gold/30">✦</span>
          <button className="btn-ghost p-2" onClick={onLock}>
            Refermer le coffret
          </button>
        </footer>
      </div>
    </motion.main>
  )
}
