import { motion } from 'motion/react'
import type { Photo, Quote } from '../types'
import { useMedia } from '../vault/VaultProvider'
import { pad } from '../lib/ambiance'

const soft = [0.22, 1, 0.36, 1] as const
const pen = [0.45, 0.05, 0.4, 1] as const
const fadeOut = { opacity: 0, transition: { duration: 0.9, ease: soft } }

const Full = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center ${className}`}>{children}</div>
)

/** Texte qui se dévoile de gauche à droite, comme tracé à la main. */
const Written = ({ children, delay = 0, duration = 1.8, className = '' }: { children: React.ReactNode; delay?: number; duration?: number; className?: string }) => (
  <motion.span
    className={`inline-block px-2 ${className}`}
    initial={{ clipPath: 'inset(-20% 100% -20% 0)' }}
    animate={{ clipPath: 'inset(-20% 0% -20% 0)' }}
    transition={{ duration, delay, ease: pen }}
  >
    {children}
  </motion.span>
)

/* ───────────── Ouverture ───────────── */
export function Opening({ lines }: { lines: string[] }) {
  return (
    <motion.div className="absolute inset-0" exit={fadeOut}>
      <Full>
        {lines.map((l, i) =>
          i === lines.length - 1 ? (
            <p key={i} className="hand mt-4 text-[clamp(2.4rem,9vw,4.4rem)] text-brass">
              <Written delay={0.4 + i * 1.3}>{l}</Written>
            </p>
          ) : (
            <motion.p
              key={i}
              className="font-serif text-[clamp(1.8rem,5.5vw,3rem)] font-light italic text-cream"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.6, delay: 0.3 + i * 1.3, ease: soft }}
            >
              {l}
            </motion.p>
          ),
        )}
      </Full>
    </motion.div>
  )
}

/* ───────────── Les auteurs, éparpillés sur la table ───────────── */
/** Noms disposés en quinconce (2 colonnes en portrait, 4 en paysage), légèrement de travers, sans se chevaucher. */
export function namePosition(i: number, n: number) {
  const portrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth
  const cols = portrait ? 2 : 4
  const rows = Math.ceil(n / cols)
  const row = Math.floor(i / cols)
  const inRow = row === rows - 1 ? n - row * cols : cols
  const col = i % cols
  const shift = (row % 2 ? 1 : -1) * (portrait ? 3 : 4)
  const x = ((col + 0.5) / inRow) * 100 + (inRow === cols ? shift : 0)
  const y = rows === 1 ? 50 : 17 + (row * 66) / (rows - 1) + (((i * 37) % 5) - 2) * 0.6
  return { x, y, rot: ((i * 53) % 9) - 4 }
}

const nameClass = 'hand absolute whitespace-nowrap text-[clamp(1.05rem,3.4vw,2rem)] text-cream/90'

export function Names({ names }: { names: string[] }) {
  return (
    <motion.div className="absolute inset-0" exit={fadeOut}>
      {names.map((name, i) => {
        const p = namePosition(i, names.length)
        return (
          <span key={name + i} className={nameClass} style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%,-50%) rotate(${p.rot}deg)` }}>
            <Written delay={0.15 + i * 0.22} duration={1}>
              {name}
            </Written>
          </span>
        )
      })}
    </motion.div>
  )
}

/* ───────────── Citation : un morceau de papier découpé dans la lettre ───────────── */
export function QuoteScene({ quote, index }: { quote: Quote; index: number }) {
  const tilt = index % 2 ? 1.6 : -1.8
  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, y: -24, transition: { duration: 0.45, ease: 'easeIn' } }}>
      <Full>
        <motion.div
          className="paper relative max-w-[min(92vw,44rem)] px-7 py-7 sm:px-12 sm:py-10"
          style={{
            clipPath:
              'polygon(0 3%, 6% 0, 18% 2%, 31% 0, 47% 3%, 63% 0, 78% 2%, 92% 0, 100% 3%, 99% 52%, 100% 97%, 85% 100%, 70% 98%, 52% 100%, 36% 97%, 20% 100%, 7% 98%, 0 100%, 1% 50%)',
          }}
          initial={{ opacity: 0, y: 50, rotate: tilt * 3 }}
          animate={{ opacity: 1, y: 0, rotate: tilt }}
          transition={{ duration: 1.1, delay: 0.45, ease: soft }}
        >
          <p className="typed mb-3 text-left text-ink-soft/70">n° {pad(quote.letter)}</p>
          <p className="font-serif text-[clamp(1.4rem,4.2vw,2.5rem)] leading-[1.3] text-ink" style={{ fontVariationSettings: '"opsz" 48' }}>
            {quote.text}
          </p>
        </motion.div>
        <p className="hand mt-7 text-[clamp(1.4rem,4vw,2rem)] text-cream/90">
          <Written delay={1.2} duration={1.2}>
            {quote.author}
          </Written>
        </p>
      </Full>
    </motion.div>
  )
}

/* ───────────── Photo ───────────── */
export function PhotoScene({ photo, quote, dur }: { photo: Photo; quote: Quote | null; dur: number }) {
  const url = useMedia(photo)
  const src = url ?? photo.thumb
  return (
    <motion.div className="absolute inset-0 overflow-hidden" exit={{ opacity: 0, transition: { duration: 1.1 } }}>
      <Full className="gap-7">
        <motion.div
          className="relative bg-[#fbf8f1] p-2.5 pb-10 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)] sm:p-3 sm:pb-12"
          initial={{ opacity: 0, y: 40, rotate: -5 }}
          animate={{ opacity: 1, y: 0, rotate: -1.5 }}
          transition={{ duration: 1.6, ease: soft }}
        >
          <span className="tape -top-3 left-1/2 z-10 -translate-x-1/2 rotate-2" aria-hidden />
          <div className="overflow-hidden">
            <motion.img
              src={src}
              alt={photo.alt}
              className="block max-h-[50dvh] max-w-[78vw] object-cover sm:max-h-[58dvh]"
              style={{ aspectRatio: `${photo.w} / ${photo.h}` }}
              initial={{ scale: 1.1, filter: 'brightness(0.2)' }}
              animate={{ scale: 1, filter: 'brightness(1)' }}
              transition={{ scale: { duration: dur + 1, ease: 'linear' }, filter: { duration: 2.4, ease: soft } }}
            />
          </div>
        </motion.div>
        {quote && (
          <motion.div className="max-w-xl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.4, delay: 1.6, ease: soft }}>
            <p className="font-serif text-[clamp(1.1rem,2.6vw,1.6rem)] italic leading-snug text-cream/90">« {quote.text} »</p>
            <p className="hand mt-2 text-xl text-cream/75">{quote.author}</p>
          </motion.div>
        )}
      </Full>
    </motion.div>
  )
}

/* ───────────── Toutes les voix se rejoignent ───────────── */
export function Converge({ names }: { names: string[] }) {
  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, transition: { duration: 0.4 } }}>
      {names.map((name, i) => {
        const p = namePosition(i, names.length)
        return (
          <motion.span
            key={name + i}
            className={nameClass}
            style={{ x: '-50%', y: '-50%' }}
            initial={{ left: `${p.x}%`, top: `${p.y}%`, opacity: 0, rotate: p.rot }}
            animate={{
              left: [`${p.x}%`, `${p.x}%`, '50%'],
              top: [`${p.y}%`, `${p.y}%`, '50%'],
              opacity: [0, 0.9, 0],
              scale: [1, 1, 0.2],
              rotate: [p.rot, p.rot, 0],
            }}
            transition={{ duration: 3, times: [0, 0.3, 1], delay: (i % 5) * 0.06, ease: [0.6, 0, 0.3, 1] }}
          >
            {name}
          </motion.span>
        )
      })}
      <motion.div
        className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgb(255 236 205 / 0.95), rgb(255 205 145 / 0.35) 45%, transparent)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0.5, 1.6, 4], opacity: [0, 0.8, 1, 1] }}
        transition={{ duration: 3.4, times: [0, 0.5, 0.8, 1], ease: 'easeIn' }}
      />
    </motion.div>
  )
}

/* ───────────── Le nombre ───────────── */
export function Reveal({ age, subtitle }: { age: number; subtitle: string }) {
  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, transition: { duration: 1.2 } }}>
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgb(255 238 210), rgb(255 205 145 / 0.4) 35%, transparent 72%)' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.18 }}
        transition={{ duration: 2.2, ease: 'easeOut' }}
      />
      <Full>
        <motion.p
          className="font-serif font-extralight leading-none text-cream"
          style={{ fontSize: 'clamp(9rem, 42vw, 22rem)', fontVariationSettings: '"opsz" 72', textShadow: '0 0 60px rgb(255 205 145 / 0.35)' }}
          initial={{ clipPath: 'inset(100% 0 0 0)', y: 30 }}
          animate={{ clipPath: 'inset(0% 0 0 0)', y: 0 }}
          transition={{ duration: 2.2, delay: 0.6, ease: soft }}
          role="img"
          aria-label={String(age)}
        >
          {age}
        </motion.p>
        <p className="hand mt-2 text-[clamp(1.6rem,5vw,2.6rem)] text-brass">
          <Written delay={2.6} duration={1.6}>
            {subtitle}
          </Written>
        </p>
      </Full>
    </motion.div>
  )
}

/* ───────────── Message final ───────────── */
export function Message({ lines }: { lines: string[] }) {
  return (
    <motion.div className="absolute inset-0" exit={fadeOut}>
      <Full>
        <div className="max-w-2xl space-y-3 sm:space-y-4">
          {lines.map((l, i) => {
            const last = i === lines.length - 1
            const delay = 0.4 + i * 1.6
            return last ? (
              <p key={i} className="hand pt-5 text-[clamp(2.8rem,11vw,5.6rem)] leading-tight text-brass">
                <Written delay={delay} duration={2}>
                  {l}
                </Written>
              </p>
            ) : (
              <motion.p
                key={i}
                className={`font-serif italic ${i === 0 ? 'text-[clamp(2rem,6vw,3.2rem)] font-light text-cream' : 'text-[clamp(1.3rem,3.8vw,2rem)] leading-snug text-cream/85'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, delay, ease: soft }}
              >
                {l}
              </motion.p>
            )
          })}
        </div>
      </Full>
    </motion.div>
  )
}

/* ───────────── Clôture ───────────── */
export function End({
  conclusion,
  signature,
  names,
  onReplay,
  onExit,
}: {
  conclusion: string[]
  signature: string
  names: string[]
  onReplay: () => void
  onExit: () => void
}) {
  const after = 0.8 + conclusion.length * 1.6
  return (
    <motion.div className="absolute inset-0 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
        {conclusion.map((l, i) =>
          i === 0 ? (
            <p key={i} className="hand text-[clamp(2.6rem,10vw,5.2rem)] leading-[1.2] text-cream">
              <Written delay={0.4} duration={2.4}>
                {l}
              </Written>
            </p>
          ) : (
            <motion.p
              key={i}
              className="mt-4 font-serif text-[clamp(1.4rem,4vw,2.1rem)] font-light italic text-cream/85"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.6, delay: 0.6 + i * 1.6, ease: soft }}
            >
              {l}
            </motion.p>
          ),
        )}
        <motion.div className="mt-10 h-px w-28 bg-cream/25" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4, delay: after }} />
        {signature && (
          <motion.p className="mt-8 font-serif text-xl italic text-brass" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: after + 0.3 }}>
            {signature}
          </motion.p>
        )}
        <motion.p
          className="hand mt-4 max-w-2xl text-xl leading-relaxed text-cream/65 sm:text-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: after + 0.8 }}
        >
          {names.join(' · ')}
        </motion.p>
        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: after + 2 }}
        >
          <button className="btn-tag" onClick={onReplay}>
            Revoir
          </button>
          <button className="link p-3" onClick={onExit}>
            Relire les lettres
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}
