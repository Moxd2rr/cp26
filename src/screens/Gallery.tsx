import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useContent } from '../vault/VaultProvider'
import { EnvelopeCard, type Flight } from '../components/EnvelopeCard'
import { GiftBox, GIFT_MOUTH, type GiftState } from '../components/GiftBox'
import { useMusic } from '../lib/music'
import type { Progress } from '../lib/progress'

const soft = [0.22, 1, 0.36, 1] as const

interface Props {
  progress: Progress
  onOpen: (n: number) => void
  onFinale: () => void
  onIntro: () => void
  onGiftOpened: () => void
  onReplayGift: () => void
}

/** La table : le grand cadeau, puis les lettres qui en sortent et se posent une à une. */
export function Gallery({ progress, onOpen, onFinale, onIntro, onGiftOpened, onReplayGift }: Props) {
  const c = useContent()
  const music = useMusic()
  const finalNo = c.finalLetter.number
  const others = c.letters.filter((l) => l.number !== finalNo)
  const final = c.letters.find((l) => l.number === finalNo)!
  const readCount = c.letters.filter((l) => progress.read.includes(l.number)).length
  const remaining = others.filter((l) => !progress.read.includes(l.number)).length
  const finalLocked = c.finalLetter.waitForOthers && remaining > 0 && !progress.read.includes(finalNo)

  const [gift, setGift] = useState<GiftState>(progress.giftOpened ? 'open' : 'closed')
  const [cards, setCards] = useState<'hidden' | 'flying' | 'placed'>(progress.giftOpened ? 'placed' : 'hidden')
  const [flights, setFlights] = useState<Map<number, Flight>>(new Map())
  const [confirm, setConfirm] = useState(false)
  const giftRef = useRef<SVGSVGElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef(new Map<number, HTMLButtonElement>())
  const settled = cards === 'placed'

  function openGift() {
    if (gift !== 'closed') return
    music.start()
    const svg = giftRef.current?.getBoundingClientRect()
    if (!svg) return
    const mx = svg.left + (svg.width * GIFT_MOUTH.x) / GIFT_MOUTH.w
    const my = svg.top + (svg.height * GIFT_MOUTH.y) / GIFT_MOUTH.h
    const order = [...others, final]
    const map = new Map<number, Flight>()
    order.forEach((l, i) => {
      const r = cardRefs.current.get(l.number)?.getBoundingClientRect()
      if (!r) return
      const isLast = l.number === finalNo
      map.set(l.number, {
        dx: mx - (r.left + r.width / 2),
        dy: my - (r.top + r.height / 2),
        delay: 1.05 + i * 0.13 + (isLast ? 0.35 : 0),
        spread: (i - (order.length - 1) / 2) * 13,
      })
    })
    setFlights(map)
    setGift('opening')
    setCards('flying')
    // La « caméra » suit les lettres vers la table.
    setTimeout(() => {
      const grid = gridRef.current
      const sc = scroller.current
      if (grid && sc) sc.scrollTo({ top: Math.max(0, grid.offsetTop - sc.clientHeight * 0.3), behavior: 'smooth' })
    }, 1500)
    const total = 1.05 + order.length * 0.13 + 0.35 + 1.6
    setTimeout(() => {
      setCards('placed')
      setGift('open')
      onGiftOpened()
    }, total * 1000)
  }

  const reveal = { initial: false, animate: { opacity: settled ? 1 : 0 }, transition: { duration: 1.2, ease: soft } } as const

  return (
    <motion.main
      ref={scroller}
      className={`relative z-10 h-dvh ${gift === 'closed' ? 'overflow-hidden' : 'scroll-area'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      transition={{ duration: 1 }}
    >
      <div className="mx-auto w-full max-w-6xl px-[max(16px,env(safe-area-inset-left))] pb-24 pt-6 sm:px-8">
        <p className="typed text-cream/45">Chapitre {c.recipient.age}</p>

        {/* Le cadeau */}
        <section className={`flex flex-col items-center ${gift === 'closed' ? 'min-h-[82dvh] justify-center' : 'pt-6'}`}>
          <button
            onClick={openGift}
            disabled={gift !== 'closed'}
            aria-label="Ouvrir le cadeau"
            className="relative w-[min(96vw,560px)] disabled:cursor-default"
          >
            <GiftBox ref={giftRef} state={gift} tag={c.gift.tag} className="w-full" />
          </button>
          <AnimatePresence>
            {gift === 'closed' && (
              <motion.div
                className="mt-8 flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.4 } }}
                transition={{ duration: 1.2, delay: 0.6 }}
              >
                {c.gift.invitation && <p className="font-serif text-[1.7rem] italic text-cream">{c.gift.invitation}</p>}
                <button className="btn-tag mt-6" onClick={openGift}>
                  Ouvrir le cadeau
                </button>
                {c.gift.hint && <p className="typed mt-5 text-cream/40">{c.gift.hint}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Titre */}
        <motion.header className="mx-auto mt-10 max-w-xl text-center sm:mt-14" {...reveal}>
          <h1 className="font-serif text-[clamp(2.6rem,9vw,4.2rem)] font-light italic leading-none text-cream">{c.gallery.title}</h1>
          <p className="mt-3 font-serif text-lg text-cream/65">{c.gallery.subtitle}</p>
          <p className="typed mt-4 text-cream/45">
            {readCount === 0 ? 'Aucune ouverte pour l’instant' : `${readCount} / ${c.letters.length} ouverte${readCount > 1 ? 's' : ''}`}
          </p>
        </motion.header>

        {/* Les enveloppes */}
        <div ref={gridRef} className="mt-10 grid grid-cols-2 gap-x-4 gap-y-7 sm:mt-14 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-11 lg:grid-cols-4">
          {others.map((l, i) => (
            <EnvelopeCard
              key={l.number}
              ref={(el) => {
                if (el) cardRefs.current.set(l.number, el)
              }}
              letter={l}
              recipient={c.recipient.firstName}
              read={progress.read.includes(l.number)}
              phase={cards}
              flight={flights.get(l.number)}
              index={i}
              onOpen={() => onOpen(l.number)}
            />
          ))}
        </div>

        {/* La dernière lettre */}
        <section className="mx-auto mt-16 max-w-lg sm:mt-24">
          <motion.p className="hand mb-4 text-center text-2xl text-brass" {...reveal}>
            Et la dernière, pour la fin…
          </motion.p>
          <EnvelopeCard
            ref={(el) => {
              if (el) cardRefs.current.set(final.number, el)
            }}
            letter={final}
            recipient={c.recipient.firstName}
            read={progress.read.includes(finalNo)}
            phase={cards}
            flight={flights.get(finalNo)}
            index={others.length}
            large
            onOpen={() => (finalLocked ? setConfirm(true) : onOpen(finalNo))}
            note={<span className="hand block -rotate-6 text-[max(0.8rem,4.6cqw)] leading-tight text-cream/80">À ouvrir en dernier</span>}
          />
          <motion.p className="mt-6 text-center font-serif text-base italic text-cream/55" {...reveal}>
            {finalLocked
              ? `Garde-la pour la fin : encore ${remaining} lettre${remaining > 1 ? 's' : ''} avant elle.`
              : progress.read.includes(finalNo)
                ? 'Elle t’attend toujours, si tu veux la relire.'
                : 'Elle est prête. Prends ton temps.'}
          </motion.p>
          <AnimatePresence>
            {confirm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden text-center"
              >
                <p className="mx-auto mt-6 max-w-md font-serif text-lg italic text-cream/85">
                  Elle a été pensée pour être lue en dernier. L’ouvrir quand même ?
                </p>
                <div className="mt-5 flex items-center justify-center gap-6">
                  <button className="link p-2" onClick={() => setConfirm(false)}>
                    J’attends
                  </button>
                  <button
                    className="btn-tag"
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
        </section>

        <motion.footer className="mt-24 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-center" {...reveal}>
          {progress.finaleSeen && (
            <button className="link p-2" onClick={onFinale}>
              Revoir le final
            </button>
          )}
          <button className="link p-2" onClick={onIntro}>
            Revoir l’introduction
          </button>
          <button className="link p-2" onClick={onReplayGift}>
            Rejouer l’ouverture du cadeau
          </button>
        </motion.footer>
      </div>
    </motion.main>
  )
}
