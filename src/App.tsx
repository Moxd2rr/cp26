import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useVault } from './vault/VaultProvider'
import { useProgress } from './lib/progress'
import { LOOK } from './lib/ambiance'
import { MusicProvider, SoundToggle, useMusic } from './lib/music'
import { Table } from './components/Table'
import { EnvelopeOpening } from './components/EnvelopeOpening'
import { Welcome } from './screens/Welcome'
import { Intro } from './screens/Intro'
import { Gallery } from './screens/Gallery'
import { Reader } from './screens/Reader'
import { Finale } from './finale/Finale'

type View = { stage: 'welcome' } | { stage: 'intro' } | { stage: 'gallery' } | { stage: 'reader'; n: number } | { stage: 'finale' }

export function App() {
  const { status } = useVault()
  return (
    <MotionConfig reducedMotion="user">
      <div className="grain" aria-hidden />
      {status === 'open' ? (
        <MusicProvider>
          <Experience />
          <SoundToggle />
        </MusicProvider>
      ) : (
        <>
          <Table on={false} />
          {status === 'error' && (
            <main className="relative z-10 flex min-h-dvh items-center justify-center px-6 text-center">
              <p className="font-serif text-xl italic text-cream/70">Les lettres ne sont pas disponibles pour l’instant. Réessaie dans un moment.</p>
            </main>
          )}
        </>
      )}
    </MotionConfig>
  )
}

function Experience() {
  const { content, vaultTag } = useVault()
  const c = content!
  const music = useMusic()
  const { progress, markRead, markIntro, setGiftOpened, markFinale } = useProgress(vaultTag)
  const [view, setView] = useState<View>({ stage: 'welcome' })
  const [opening, setOpening] = useState<{ n: number; reread: boolean } | null>(null)
  const [giftRun, setGiftRun] = useState(0)
  const depth = useRef(0)

  // Historique du navigateur : le geste « retour » du téléphone ferme la lettre au lieu de quitter le site.
  const go = useCallback((v: View, mode: 'push' | 'replace' = 'replace') => {
    if (mode === 'push') {
      history.pushState({ cp26: v }, '')
      depth.current += 1
    } else {
      history.replaceState({ cp26: v }, '')
    }
    setView(v)
  }, [])

  useEffect(() => {
    history.replaceState({ cp26: { stage: 'welcome' } }, '')
    const onPop = (e: PopStateEvent) => {
      depth.current = Math.max(0, depth.current - 1)
      setOpening(null)
      setView((e.state?.cp26 as View) ?? { stage: 'gallery' })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const back = useCallback(() => {
    if (depth.current > 0) history.back()
    else go({ stage: 'gallery' })
  }, [go])

  const byNumber = (n: number) => c.letters.find((l) => l.number === n)!

  const openLetter = useCallback((n: number) => setOpening({ n, reread: progress.read.includes(n) }), [progress.read])

  const finishOpening = useCallback(() => {
    if (!opening) return
    const { n } = opening
    markRead(n)
    setOpening(null)
    go({ stage: 'reader', n }, view.stage === 'reader' ? 'replace' : 'push')
  }, [opening, markRead, view.stage, go])

  const navigateTo = useCallback(
    (n: number) => {
      if (progress.read.includes(n)) go({ stage: 'reader', n }, 'replace')
      else openLetter(n)
    },
    [progress.read, go, openLetter],
  )

  const sorted = [...c.letters].sort((a, b) => a.number - b.number)
  const finalNo = c.finalLetter.number
  const othersUnread = sorted.some((l) => l.number !== finalNo && !progress.read.includes(l.number))
  const neighbours = (n: number) => {
    const others = sorted.filter((l) => l.number !== finalNo)
    const i = others.findIndex((l) => l.number === n)
    if (n === finalNo) return { prev: others.at(-1) ?? null, next: null }
    const prev = i > 0 ? others[i - 1] : null
    let next = i < others.length - 1 ? others[i + 1] : null
    // Après la dernière lettre « ordinaire », proposer la lettre finale seulement si toutes les autres ont été lues.
    if (!next && (!c.finalLetter.waitForOthers || !othersUnread || progress.read.includes(finalNo))) next = byNumber(finalNo)
    return { prev, next }
  }

  const stage = view.stage
  const light = stage === 'reader' ? LOOK[byNumber(view.n).ambiance].light : undefined

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
      <Table light={light} />

      <AnimatePresence mode="wait">
        {stage === 'welcome' && (
          <Welcome
            key="welcome"
            onEnter={() => {
              music.start()
              go(progress.introSeen ? { stage: 'gallery' } : { stage: 'intro' })
            }}
          />
        )}
        {stage === 'intro' && (
          <Intro
            key="intro"
            onDone={() => {
              music.start()
              markIntro()
              go({ stage: 'gallery' })
            }}
          />
        )}
        {(stage === 'gallery' || stage === 'reader') && (
          <Gallery
            key={`gallery-${giftRun}`}
            progress={progress}
            onOpen={openLetter}
            onFinale={() => go({ stage: 'finale' }, 'push')}
            onIntro={() => go({ stage: 'intro' })}
            onGiftOpened={() => setGiftOpened(true)}
            onReplayGift={() => {
              setGiftOpened(false)
              setGiftRun((r) => r + 1)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stage === 'reader' && (
          <Reader
            key="reader"
            letter={byNumber(view.n)}
            isFinal={view.n === finalNo}
            {...neighbours(view.n)}
            onClose={back}
            onNavigate={navigateTo}
            onFinale={() => go({ stage: 'finale' }, 'replace')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {opening && (
          <EnvelopeOpening
            key={`open-${opening.n}`}
            letter={byNumber(opening.n)}
            recipient={c.recipient.firstName}
            reread={opening.reread}
            onDone={finishOpening}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{stage === 'finale' && <Finale key="finale" onExit={() => go({ stage: 'gallery' })} onSeen={markFinale} />}</AnimatePresence>
    </motion.div>
  )
}
