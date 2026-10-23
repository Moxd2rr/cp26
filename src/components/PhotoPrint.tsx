import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Photo } from '../types'
import { useMedia } from '../vault/VaultProvider'

/** Photo présentée comme un tirage papier : aperçu flou pendant le déchiffrement, puis netteté. */
export function PhotoPrint({ photo, tilt = 0, onOpen, className = '' }: { photo: Photo; tilt?: number; onOpen?: () => void; className?: string }) {
  const url = useMedia(photo)
  const [loaded, setLoaded] = useState(false)
  const portrait = photo.h > photo.w
  return (
    <motion.figure
      className={`mx-auto ${className}`}
      style={{ maxWidth: portrait ? 'min(100%, 380px)' : 'min(100%, 580px)' }}
      initial={{ opacity: 0, y: 30, rotate: tilt * 2 }}
      whileInView={{ opacity: 1, y: 0, rotate: tilt }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="group relative block w-full bg-[#fbf8f1] p-2.5 pb-9 shadow-[0_30px_60px_-25px_rgba(40,25,10,0.65),0_8px_18px_-10px_rgba(40,25,10,0.45)] transition-transform duration-700 hover:-translate-y-1 sm:p-3 sm:pb-12"
        aria-label={`Agrandir : ${photo.alt}`}
      >
        <span className="tape -top-3 left-1/2 z-10 -translate-x-1/2 -rotate-3" aria-hidden />
        <div
          className="relative overflow-hidden bg-cover bg-center"
          style={{ aspectRatio: `${photo.w} / ${photo.h}`, backgroundImage: `url(${photo.thumb})` }}
        >
          {!loaded && <div className="absolute inset-0 backdrop-blur-xl" />}
          {url && (
            <motion.img
              src={url}
              alt={photo.alt}
              onLoad={() => setLoaded(true)}
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0, scale: 1.05, filter: 'blur(14px)' }}
              animate={loaded ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              draggable={false}
            />
          )}
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.18)]" />
        </div>
      </button>
      {photo.caption && <figcaption className="hand mt-3 text-center text-2xl text-pen">{photo.caption}</figcaption>}
    </motion.figure>
  )
}

/** Visionneuse plein écran. */
export function Lightbox({ photos, index, onClose }: { photos: Photo[]; index: number | null; onClose: () => void }) {
  const [i, setI] = useState(index ?? 0)
  useEffect(() => {
    if (index !== null) setI(index)
  }, [index])
  const open = index !== null
  const photo = photos[i]
  const url = useMedia(open ? photo : null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'ArrowRight') setI((v) => Math.min(photos.length - 1, v + 1))
      if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1))
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose, photos.length])

  return (
    <AnimatePresence>
      {open && photo && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={photo.alt}
        >
          <motion.img
            key={photo.blob}
            src={url ?? photo.thumb}
            alt={photo.alt}
            className="max-h-[86dvh] max-w-full object-contain shadow-2xl"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          />
          {photo.caption && <p className="hand absolute bottom-6 text-2xl text-cream/80">{photo.caption}</p>}
          <button className="link absolute right-4 top-4 p-3" onClick={onClose} aria-label="Fermer">
            Fermer ✕
          </button>
          {photos.length > 1 && (
            <div className="absolute bottom-6 flex gap-8" onClick={(e) => e.stopPropagation()}>
              <button className="link p-2 disabled:opacity-20" disabled={i === 0} onClick={() => setI(i - 1)}>
                ← Précédente
              </button>
              <button className="link p-2 disabled:opacity-20" disabled={i === photos.length - 1} onClick={() => setI(i + 1)}>
                Suivante →
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
