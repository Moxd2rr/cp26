import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import type { Letter, Photo } from '../types'
import { useContent } from '../vault/VaultProvider'
import { LOOK, pad } from '../lib/ambiance'
import { inline, splitBody, wordCount } from '../lib/text'
import { PhotoPrint, Lightbox } from '../components/PhotoPrint'

const soft = [0.22, 1, 0.36, 1] as const

interface Props {
  letter: Letter
  isFinal: boolean
  prev: Letter | null
  next: Letter | null
  onClose: () => void
  onNavigate: (n: number) => void
  onFinale: () => void
}

type Resolved = 'texte' | 'photo-haut' | 'photo-fin' | 'entrelace' | 'galerie'

/** Mise en page selon le contenu : nombre de photos, longueur du texte. */
function resolveLayout(l: Letter, paragraphs: number, words: number): Resolved {
  if (l.layout !== 'auto') return l.layout
  const n = l.photos.length
  if (n === 0) return 'texte'
  if (n === 1) return words > 110 ? 'photo-fin' : 'photo-haut'
  if (paragraphs >= n + 1) return 'entrelace'
  return 'galerie'
}

/** Lecture d'une lettre, posée sur la table sous la lampe. */
export function Reader({ letter, isFinal, prev, next, onClose, onNavigate, onFinale }: Props) {
  const c = useContent()
  const look = LOOK[letter.ambiance]
  const [lightbox, setLightbox] = useState<number | null>(null)

  const { paragraphs, signatureLine, title, words } = useMemo(() => {
    const ps = splitBody(letter.body)
    let title: string | null = null
    if (letter.firstLineTitle && ps.length) {
      title = ps[0][0]
      ps[0] = ps[0].slice(1)
      if (!ps[0].length) ps.shift()
    }
    let sig: string | null = null
    if (letter.lastLineSignature) {
      const last = ps[ps.length - 1]
      sig = last[last.length - 1]
      ps[ps.length - 1] = last.slice(0, -1)
      if (!ps[ps.length - 1].length) ps.pop()
    }
    return { paragraphs: ps, signatureLine: sig, title, words: wordCount(letter.body) }
  }, [letter])

  const layout = resolveLayout(letter, paragraphs.length, words)
  const short = words < 55 && paragraphs.length <= 2 && paragraphs.every((p) => p.length <= 3)
  const tilt = ((letter.number * 7) % 5) * 0.25 - 0.5

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightbox !== null) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && next) onNavigate(next.number)
      if (e.key === 'ArrowLeft' && prev) onNavigate(prev.number)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, next, prev, onClose, onNavigate])

  const photo = (p: Photo, i: number, cls = 'my-12') => (
    <PhotoPrint key={p.blob + i} photo={p} tilt={i % 2 ? 1.6 : -1.8} onOpen={() => setLightbox(i)} className={cls} />
  )

  const interleaveAt = new Map<number, number[]>()
  if (layout === 'entrelace') {
    letter.photos.forEach((_, i) => {
      const at = Math.min(paragraphs.length - 1, Math.round(((i + 1) * paragraphs.length) / (letter.photos.length + 1)) - 1)
      interleaveAt.set(at, [...(interleaveAt.get(at) ?? []), i])
    })
  }

  const body: ReactNode[] = paragraphs.map((lines, pi) => (
    <div key={pi}>
      <p>
        {/* Chaque ligne apparaît dès qu'elle entre à l'écran (fonctionne aussi pour les très longues lettres). */}
        {lines.map((line, li) => (
          <motion.span
            key={li}
            className="line block"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 'some', margin: '0px 0px -6% 0px' }}
            transition={{ duration: 0.9, ease: soft, delay: pi === 0 && li < 3 ? 0.4 + li * 0.12 : 0 }}
          >
            {inline(line)}
          </motion.span>
        ))}
      </p>
      {interleaveAt.get(pi)?.map((i) => photo(letter.photos[i], i))}
    </div>
  ))

  const NavName = ({ l, dir }: { l: Letter; dir: 'prev' | 'next' }) => (
    <button className={`group block max-w-full ${dir === 'next' ? 'ml-auto text-right' : 'text-left'}`} onClick={() => onNavigate(l.number)}>
      <span className="typed block text-cream/40">{dir === 'prev' ? '← précédente' : l.number === c.finalLetter.number ? 'la dernière →' : 'suivante →'}</span>
      <span className="hand mt-1 block truncate text-2xl text-cream/80 transition-colors group-hover:text-cream">{l.author}</span>
    </button>
  )

  return (
    <motion.div
      className="table-surface fixed inset-0 z-30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45 } }}
      transition={{ duration: 0.5 }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ background: `radial-gradient(70% 50% at 45% -5%, rgb(${look.light} / 0.24), transparent 72%)` }}
      />

      <div key={letter.number} className="scroll-area relative z-10 h-dvh">
        <div className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-b from-table via-table/85 to-transparent px-[max(16px,env(safe-area-inset-left))] pb-6 pt-[max(12px,env(safe-area-inset-top))] sm:px-8">
          <button className="link p-2 text-lg" onClick={onClose}>
            ← Toutes les lettres
          </button>
          <span className="typed text-cream/40">
            {pad(letter.number)} / {pad(c.letters.length)}
          </span>
        </div>

        <article className="mx-auto w-full max-w-[700px] px-3 pb-10 sm:px-6">
          <motion.div
            className={`paper ${look.paper} lifted relative rounded-[1px] px-6 pb-14 pt-10 sm:px-14 sm:pb-16 sm:pt-14`}
            initial={{ opacity: 0, y: 60, rotate: tilt * 3 }}
            animate={{ opacity: 1, y: 0, rotate: tilt }}
            transition={{ duration: 1, ease: soft }}
          >
            {look.paper === 'paper-avion' && <div className="airmail-edge !p-[4px] opacity-60" />}
            <header className="mb-9 sm:mb-12">
              <div className="flex items-baseline justify-between gap-4">
                <p className="typed text-ink-soft">{isFinal ? 'La dernière lettre' : `Lettre n° ${pad(letter.number)}`}</p>
                {isFinal && <p className="typed text-ink-soft">n° {pad(letter.number)}</p>}
              </div>
              <p className="mt-6 font-serif text-base italic text-ink-soft">de la part de</p>
              <h1 className="hand mt-1 text-[clamp(2rem,7vw,2.9rem)] text-pen">{letter.author}</h1>
              {letter.tagline && <p className="mt-1 font-serif text-lg italic text-ink-soft">« {letter.tagline} »</p>}
              {letter.relation && <p className="typed mt-2 text-ink-soft/80">{letter.relation}</p>}
              <div className="mt-6 h-px w-24 bg-ink/20" />
            </header>

            {title && (
              <motion.p
                className="mb-10 font-serif text-[clamp(1.3rem,4vw,1.6rem)] italic leading-snug text-ink"
                style={{ fontVariationSettings: '"opsz" 36' }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.3, ease: soft }}
              >
                {inline(title)}
              </motion.p>
            )}

            {layout === 'photo-haut' && letter.photos[0] && photo(letter.photos[0], 0, 'mb-12')}

            <div className={`letter-body ${short ? 'is-short' : ''}`}>{body}</div>

            {(layout === 'photo-fin' || layout === 'galerie') && (
              <div className={layout === 'galerie' ? 'mt-14 grid gap-10 sm:grid-cols-2' : ''}>
                {letter.photos.map((p, i) => photo(p, i, layout === 'galerie' ? 'my-0' : 'mt-14'))}
              </div>
            )}

            {(letter.signature || signatureLine) && (
              <motion.p
                className="signature mt-12 text-right sm:mt-14"
                initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
                whileInView={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: [0.45, 0.05, 0.4, 1], delay: 0.2 }}
              >
                {signatureLine ? inline(signatureLine) : letter.signature}
              </motion.p>
            )}
          </motion.div>

          <nav className="mt-14 px-1">
            {isFinal ? (
              <motion.div
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, delay: 0.5 }}
              >
                <button className="btn-tag !text-[1.2rem]" onClick={onFinale}>
                  {c.finalLetter.finaleButton}
                </button>
                <button className="link mt-8 p-2" onClick={onClose}>
                  Toutes les lettres
                </button>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="min-w-0">{prev && <NavName l={prev} dir="prev" />}</div>
                  <div className="min-w-0">{next && <NavName l={next} dir="next" />}</div>
                </div>
                <div className="mt-10 text-center">
                  <button className="link p-2" onClick={onClose}>
                    Retour à la table
                  </button>
                </div>
              </>
            )}
          </nav>
          <div className="h-20" />
        </article>
      </div>

      <Lightbox photos={letter.photos} index={lightbox} onClose={() => setLightbox(null)} />
    </motion.div>
  )
}
