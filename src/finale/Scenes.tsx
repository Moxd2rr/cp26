import { useId } from 'react'
import { motion } from 'motion/react'
import type { Photo, Quote } from '../types'
import { useMedia } from '../vault/VaultProvider'
import { pad } from '../lib/ambiance'
import { scriptFriendly } from '../lib/text'

const silk = [0.22, 1, 0.36, 1] as const
const fadeOut = { opacity: 0, filter: 'blur(10px)', transition: { duration: 0.9, ease: silk } }

const Full = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center ${className}`}>{children}</div>
)

/* ───────────── Ouverture ───────────── */
export function Opening({ lines }: { lines: string[] }) {
  return (
    <motion.div className="absolute inset-0" exit={fadeOut}>
      <Full>
        {lines.map((l, i) => (
          <motion.p
            key={i}
            className={`font-display italic leading-tight ${i === lines.length - 1 ? 'gold-text mt-3 text-[clamp(2.4rem,7vw,4.2rem)]' : 'text-[clamp(1.8rem,5vw,3rem)] text-ivory/90'}`}
            initial={{ opacity: 0, y: 16, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.8, delay: 0.3 + i * 1.3, ease: silk }}
          >
            {l}
          </motion.p>
        ))}
      </Full>
    </motion.div>
  )
}

/* ───────────── Constellation des auteurs ───────────── */
export function namePosition(i: number, n: number) {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2 + (i % 2 ? 0.12 : -0.08)
  const r = 0.82 + ((i * 37) % 10) / 55
  return { x: 50 + Math.cos(a) * 36 * r, y: 50 + Math.sin(a) * 34 * r }
}

export function Names({ names }: { names: string[] }) {
  return (
    <motion.div className="absolute inset-0" exit={fadeOut}>
      {names.map((name, i) => {
        const p = namePosition(i, names.length)
        return (
          <motion.span
            key={name + i}
            className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-gold-soft ${scriptFriendly(name) ? 'font-script text-[clamp(1.15rem,3.6vw,2.2rem)]' : 'font-display text-[clamp(0.95rem,2.8vw,1.7rem)] italic'}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
            animate={{ opacity: 0.88, scale: 1, filter: 'blur(0px)', y: [0, -6, 0] }}
            transition={{
              opacity: { duration: 1.4, delay: 0.2 + i * 0.2 },
              scale: { duration: 1.4, delay: 0.2 + i * 0.2 },
              filter: { duration: 1.4, delay: 0.2 + i * 0.2 },
              y: { duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            {name}
          </motion.span>
        )
      })}
      <motion.div
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgb(230 207 150 / 0.22), transparent)' }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  )
}

/* ───────────── Citation ───────────── */
export function QuoteScene({ quote }: { quote: Quote }) {
  const words = quote.text.split(/\s+/)
  return (
    <motion.div className="absolute inset-0" exit={fadeOut}>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[60vmin] font-light italic leading-none text-gold/[0.05]"
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 4, ease: silk }}
      >
        {pad(quote.letter)}
      </motion.span>
      <Full>
        <p className="max-w-4xl font-display text-[clamp(1.65rem,4.6vw,3.2rem)] font-light italic leading-[1.25] text-ivory">
          <span className="text-gold/80">« </span>
          {words.map((w, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.055, ease: silk }}
            >
              {w}
              {i < words.length - 1 && ' '}
            </motion.span>
          ))}
          <span className="text-gold/80"> »</span>
        </p>
        <motion.p
          className="smallcaps mt-8 text-gold"
          initial={{ opacity: 0, letterSpacing: '0.6em' }}
          animate={{ opacity: 0.9, letterSpacing: '0.34em' }}
          transition={{ duration: 1.6, delay: 0.5 + words.length * 0.055, ease: silk }}
        >
          — {quote.author}
        </motion.p>
      </Full>
    </motion.div>
  )
}

/* ───────────── Photo ───────────── */
export function PhotoScene({ photo, quote, dur }: { photo: Photo; quote: Quote | null; dur: number }) {
  const url = useMedia(photo)
  const src = url ?? photo.thumb
  return (
    <motion.div className="absolute inset-0 overflow-hidden" exit={{ opacity: 0, transition: { duration: 1.2 } }}>
      <motion.img
        src={src}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-125 object-cover blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 2.5 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)]" />
      <Full className="gap-6">
        <motion.div
          className="relative overflow-hidden shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
          initial={{ opacity: 0, filter: 'brightness(0) blur(6px)' }}
          animate={{ opacity: 1, filter: 'brightness(1) blur(0px)' }}
          transition={{ duration: 2.6, ease: silk }}
        >
          <motion.img
            src={src}
            alt={photo.alt}
            className="block max-h-[58dvh] max-w-[86vw] object-contain sm:max-h-[66dvh]"
            style={{ aspectRatio: `${photo.w} / ${photo.h}` }}
            initial={{ scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: dur + 1, ease: 'linear' }}
          />
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.55)]" />
        </motion.div>
        {quote && (
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.6, delay: 1.8, ease: silk }}
          >
            <p className="font-display text-[clamp(1.15rem,2.6vw,1.75rem)] italic leading-snug text-ivory/90">« {quote.text} »</p>
            <p className="smallcaps mt-3 text-gold/90">— {quote.author}</p>
          </motion.div>
        )}
      </Full>
    </motion.div>
  )
}

/* ───────────── Convergence : toutes les voix se rejoignent ───────────── */
export function Converge({ names }: { names: string[] }) {
  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, transition: { duration: 0.3 } }}>
      {names.map((name, i) => {
        const p = namePosition(i, names.length)
        return (
          <motion.span
            key={name + i}
            className={`absolute whitespace-nowrap text-gold-soft ${scriptFriendly(name) ? 'font-script text-[clamp(1.15rem,3.6vw,2.2rem)]' : 'font-display text-[clamp(0.95rem,2.8vw,1.7rem)] italic'}`}
            style={{ x: '-50%', y: '-50%' }}
            initial={{ left: `${p.x}%`, top: `${p.y}%`, opacity: 0, scale: 1 }}
            animate={{
              left: [`${p.x}%`, `${p.x}%`, '50%'],
              top: [`${p.y}%`, `${p.y}%`, '50%'],
              opacity: [0, 0.9, 0],
              scale: [1, 1, 0.2],
            }}
            transition={{ duration: 3, times: [0, 0.3, 1], delay: (i % 5) * 0.06, ease: [0.6, 0, 0.3, 1] }}
          >
            {name}
          </motion.span>
        )
      })}
      <motion.div
        className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: 'radial-gradient(closest-side, rgb(255 246 220 / 1), rgb(230 207 150 / 0.6) 40%, transparent)' }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0.6, 1.4, 3], opacity: [0, 0.9, 1, 1] }}
        transition={{ duration: 3.4, times: [0, 0.5, 0.8, 1], ease: 'easeIn' }}
      />
    </motion.div>
  )
}

/* ───────────── Révélation du nombre ───────────── */
export function Reveal({ age, subtitle }: { age: number; subtitle: string }) {
  const id = useId().replace(/:/g, '')
  const text = String(age)
  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)', transition: { duration: 1.2 } }}>
      {/* Éclair de lumière */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, rgb(255 248 228), rgb(230 207 150 / 0.6) 30%, transparent 70%)' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      />
      {/* Ondes */}
      {[0, 1, 2].map((k) => (
        <motion.div
          key={k}
          className="absolute left-1/2 top-1/2 h-[40vmin] w-[40vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/40"
          initial={{ scale: 0.4, opacity: 0.7 }}
          animate={{ scale: 2.6, opacity: 0 }}
          transition={{ duration: 3.2, delay: 0.3 + k * 0.9, ease: 'easeOut' }}
        />
      ))}
      <Full>
        <svg viewBox="0 0 400 270" className="w-[min(78vw,560px)] overflow-visible" role="img" aria-label={text}>
          <defs>
            <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8a6a2e" />
              <stop offset="0.3" stopColor="#e9cf92" />
              <stop offset="0.5" stopColor="#fff3cf" />
              <stop offset="0.7" stopColor="#c9a45c" />
              <stop offset="1" stopColor="#7a5a24" />
            </linearGradient>
            <linearGradient id={`s${id}`} x1="0" x2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`c${id}`}>
              <text x="200" y="215" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontWeight={400} fontSize="250" style={{ fontVariantNumeric: 'lining-nums' }}>
                {text}
              </text>
            </clipPath>
            <filter id={`f${id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Tracé */}
          <motion.text
            x="200"
            y="215"
            textAnchor="middle"
            fontFamily="Cormorant Garamond, Georgia, serif"
            fontWeight={400}
            fontSize="250"
            fill="none"
            stroke={`url(#g${id})`}
            strokeWidth="1.4"
            style={{ fontVariantNumeric: 'lining-nums' }}
            strokeDasharray="1600"
            initial={{ strokeDashoffset: 1600 }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 2.6, delay: 0.5, ease: [0.45, 0, 0.2, 1] }}
          >
            {text}
          </motion.text>
          {/* Remplissage doré */}
          <motion.text
            x="200"
            y="215"
            textAnchor="middle"
            fontFamily="Cormorant Garamond, Georgia, serif"
            fontWeight={400}
            fontSize="250"
            fill={`url(#g${id})`}
            filter={`url(#f${id})`}
            style={{ fontVariantNumeric: 'lining-nums' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, delay: 2.4 }}
          >
            {text}
          </motion.text>
          {/* Reflet qui balaie le chiffre */}
          <g clipPath={`url(#c${id})`}>
            <motion.rect
              y="0"
              width="140"
              height="270"
              fill={`url(#s${id})`}
              initial={{ x: -160 }}
              animate={{ x: 420 }}
              transition={{ duration: 1.8, delay: 3.6, ease: 'easeInOut' }}
              style={{ mixBlendMode: 'overlay' }}
            />
          </g>
        </svg>
        <motion.p
          className="smallcaps mt-2 text-gold-soft"
          initial={{ opacity: 0, letterSpacing: '1em' }}
          animate={{ opacity: 1, letterSpacing: '0.5em' }}
          transition={{ duration: 2.4, delay: 3.2, ease: silk }}
        >
          {subtitle}
        </motion.p>
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
            return (
              <motion.p
                key={i}
                className={
                  last
                    ? 'gold-text pt-4 font-script text-[clamp(2.8rem,10vw,5.4rem)] leading-tight'
                    : i === 0
                      ? 'font-display text-[clamp(2rem,6vw,3.2rem)] italic text-gold-soft'
                      : 'font-display text-[clamp(1.35rem,3.8vw,2.1rem)] italic leading-snug text-ivory/90'
                }
                initial={{ opacity: 0, y: 14, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: last ? 2.2 : 1.6, delay: 0.4 + i * 1.6, ease: silk }}
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
  const after = 0.6 + conclusion.length * 1.4
  return (
    <motion.div className="absolute inset-0 overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4 }}>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
        {conclusion.map((l, i) => (
          <motion.p
            key={i}
            className={
              i === 0
                ? 'gold-text font-script text-[clamp(2.6rem,9vw,5.2rem)] leading-[1.15]'
                : 'mt-4 font-display text-[clamp(1.4rem,4vw,2.2rem)] italic text-ivory/90'
            }
            initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 2, delay: 0.4 + i * 1.4, ease: silk }}
          >
            {l}
          </motion.p>
        ))}
        <motion.div className="hairline mt-10 w-48" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.6, delay: after }} />
        {signature && (
          <motion.p
            className="smallcaps mt-8 text-gold/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.6, delay: after + 0.4 }}
          >
            {signature}
          </motion.p>
        )}
        <motion.p
          className="mt-4 max-w-2xl font-display text-base italic leading-relaxed text-ivory/55 sm:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: after + 0.9 }}
        >
          {names.join(' · ')}
        </motion.p>
        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: after + 2 }}
        >
          <button className="btn-gold" onClick={onReplay}>
            Revoir
          </button>
          <button className="btn-ghost p-3" onClick={onExit}>
            Relire les lettres
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}
