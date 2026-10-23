import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import type { Letter, Photo } from '../types'
import { useContent } from '../vault/VaultProvider'
import { AMBIANCE, pad } from '../lib/ambiance'
import { inline, scriptFriendly, splitBody, wordCount } from '../lib/text'
import { PhotoPrint, Lightbox } from '../components/PhotoPrint'

const silk = [0.22, 1, 0.36, 1] as const

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

/** Choisit une mise en page adaptée au contenu (nombre de photos, longueur). */
function resolveLayout(l: Letter, paragraphs: number, words: number): Resolved {
  if (l.layout !== 'auto') return l.layout
  const n = l.photos.length
  if (n === 0) return 'texte'
  if (n === 1) return words > 110 ? 'photo-fin' : 'photo-haut'
  if (paragraphs >= n + 1) return 'entrelace'
  return 'galerie'
}

function Ornament({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden>
      <span className={`h-px w-14 ${dark ? 'bg-gold/50' : 'bg-gold-deep/40'}`} />
      <span className={`text-[0.6rem] ${dark ? 'text-gold' : 'text-gold-deep'}`}>✦</span>
      <span className={`h-px w-14 ${dark ? 'bg-gold/50' : 'bg-gold-deep/40'}`} />
    </div>
  )
}

/** Lecture immersive d'une lettre. */
export function Reader({ letter, isFinal, prev, next, onClose, onNavigate, onFinale }: Props) {
  const c = useContent()
  const amb = AMBIANCE[letter.ambiance]
  const [lightbox, setLightbox] = useState<number | null>(null)

  const { paragraphs, signatureLine, words } = useMemo(() => {
    const ps = splitBody(letter.body)
    let sig: string | null = null
    if (letter.lastLineSignature) {
      const last = ps[ps.length - 1]
      sig = last[last.length - 1]
      ps[ps.length - 1] = last.slice(0, -1)
      if (!ps[ps.length - 1].length) ps.pop()
    }
    return { paragraphs: ps, signatureLine: sig, words: wordCount(letter.body) }
  }, [letter])

  const layout = resolveLayout(letter, paragraphs.length, words)
  const short = words < 55 && paragraphs.length <= 2 && paragraphs.every((p) => p.length <= 3)
  const startsWithLetter = /^\p{L}/u.test(letter.body)

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
    <PhotoPrint key={p.blob + i} photo={p} tilt={i % 2 ? 1.2 : -1.4} onOpen={() => setLightbox(i)} className={cls} />
  )

  // Répartition des photos entre les paragraphes (mise en page « entrelacée »).
  const interleaveAt = new Map<number, number[]>()
  if (layout === 'entrelace') {
    letter.photos.forEach((_, i) => {
      const at = Math.min(paragraphs.length - 1, Math.round(((i + 1) * paragraphs.length) / (letter.photos.length + 1)) - 1)
      interleaveAt.set(at, [...(interleaveAt.get(at) ?? []), i])
    })
  }

  const body: ReactNode[] = paragraphs.map((lines, pi) => (
    <div key={pi}>
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.1, ease: silk, delay: pi === 0 ? 0.5 : 0 }}
      >
        {lines.map((line, li) => (
          <span key={li} className={`line block ${pi === 0 && li === 0 && startsWithLetter && !short ? 'dropcap' : ''}`}>
            {inline(line)}
          </span>
        ))}
      </motion.p>
      {interleaveAt.get(pi)?.map((i) => photo(letter.photos[i], i, 'my-12'))}
    </div>
  ))

  return (
    <motion.div
      className="fixed inset-0 z-30 bg-night"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.6 }}
    >
      {/* Lumière propre à la lettre */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background: `radial-gradient(70% 45% at 50% 0%, rgb(${amb.glow} / ${isFinal ? 0.3 : 0.2}), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgb(${amb.glow} / 0.1), transparent 70%)`,
        }}
      />
      <div className="vignette" />

      <div key={letter.number} className="scroll-area relative z-10 h-dvh">
        {/* Barre du haut */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-b from-night via-night/80 to-transparent px-4 pb-6 pt-4 sm:px-8">
          <button className="btn-ghost p-2" onClick={onClose}>
            ← Lettres
          </button>
          <span className="smallcaps !text-[0.6rem] text-ivory/45">
            {pad(letter.number)} / {pad(c.letters.length)}
          </span>
          <span className="w-[4.5rem]" aria-hidden />
        </div>

        <article className="mx-auto w-full max-w-[720px] px-3 pb-10 sm:px-6">
          <motion.div
            className="paper relative rounded-[3px] px-6 pb-14 pt-12 sm:px-14 sm:pb-20 sm:pt-16"
            initial={{ opacity: 0, y: 50, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, ease: silk }}
          >
            {isFinal && <div aria-hidden className="pointer-events-none absolute inset-[10px] rounded-[2px] border border-gold-deep/25" />}
            <header className="mb-10 text-center sm:mb-14">
              <p className="smallcaps text-gold-deep">{isFinal ? `La dernière lettre · n° ${pad(letter.number)}` : `Lettre n° ${pad(letter.number)}`}</p>
              <div className="my-5">
                <Ornament />
              </div>
              <p className="font-display text-base italic text-ink-soft">de la part de</p>
              <h1 className="mt-1 font-display text-[clamp(2.3rem,7vw,3.4rem)] font-medium leading-[1.05] italic text-ink">
                {letter.author}
              </h1>
              {letter.relation && <p className="smallcaps mt-3 !text-[0.6rem] text-ink-soft/80">{letter.relation}</p>}
            </header>

            {layout === 'photo-haut' && letter.photos[0] && photo(letter.photos[0], 0, 'mb-12')}

            <div className={`letter-body ${short ? 'is-short' : ''}`}>{body}</div>

            {(layout === 'photo-fin' || layout === 'galerie') && (
              <div className={layout === 'galerie' ? 'mt-14 grid gap-8 sm:grid-cols-2' : ''}>
                {letter.photos.map((p, i) => photo(p, i, layout === 'galerie' ? 'my-0' : 'mt-14'))}
              </div>
            )}

            {(letter.signature || signatureLine) && (
              <motion.p
                className={`signature mt-12 text-right sm:mt-14 ${scriptFriendly(signatureLine ?? letter.signature ?? '') ? '' : 'signature-plain'}`}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: silk, delay: 0.2 }}
              >
                {signatureLine ? inline(signatureLine) : letter.signature}
              </motion.p>
            )}
          </motion.div>

          {/* Suite */}
          <nav className="mt-14 text-center">
            {isFinal ? (
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 2, delay: 0.6 }}>
                <Ornament dark />
                <motion.button
                  className="btn-gold mt-10 !px-8 !py-5 !text-[0.72rem]"
                  onClick={onFinale}
                  animate={{ boxShadow: ['0 0 0px rgba(201,164,92,0)', '0 0 46px rgba(201,164,92,0.45)', '0 0 0px rgba(201,164,92,0)'] }}
                  transition={{ duration: 3.2, repeat: Infinity }}
                >
                  {c.finalLetter.finaleButton}
                </motion.button>
              </motion.div>
            ) : (
              <>
                <Ornament dark />
                <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6">
                  <div className="text-left">
                    {prev && (
                      <button className="group block w-full rounded-sm border border-ivory/10 p-4 text-left transition-colors hover:border-gold/40 sm:p-5" onClick={() => onNavigate(prev.number)}>
                        <span className="smallcaps !text-[0.55rem] text-ivory/40">← Précédente</span>
                        <span className={`mt-1 block truncate text-ivory/80 group-hover:text-gold-soft ${scriptFriendly(prev.author) ? 'font-script text-xl sm:text-2xl' : 'font-display text-lg italic sm:text-xl'}`}>{prev.author}</span>
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    {next && (
                      <button className="group block w-full rounded-sm border border-ivory/10 p-4 text-right transition-colors hover:border-gold/40 sm:p-5" onClick={() => onNavigate(next.number)}>
                        <span className="smallcaps !text-[0.55rem] text-ivory/40">{next.number === c.finalLetter.number ? 'La dernière →' : 'Suivante →'}</span>
                        <span className={`mt-1 block truncate text-ivory/80 group-hover:text-gold-soft ${scriptFriendly(next.author) ? 'font-script text-xl sm:text-2xl' : 'font-display text-lg italic sm:text-xl'}`}>{next.author}</span>
                      </button>
                    )}
                  </div>
                </div>
                <button className="btn-ghost mt-10 p-2" onClick={onClose}>
                  Retour aux enveloppes
                </button>
              </>
            )}
          </nav>
          <div className="h-16" />
        </article>
      </div>

      <Lightbox photos={letter.photos} index={lightbox} onClose={() => setLightbox(null)} />
    </motion.div>
  )
}
