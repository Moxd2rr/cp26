import type { Content, Photo, Quote } from '../types'

export type Scene =
  | { kind: 'opening'; lines: string[]; dur: number }
  | { kind: 'names'; names: string[]; dur: number }
  | { kind: 'quote'; quote: Quote; dur: number }
  | { kind: 'photo'; photo: Photo; quote: Quote | null; dur: number }
  | { kind: 'converge'; names: string[]; dur: number }
  | { kind: 'reveal'; subtitle: string; age: number; dur: number }
  | { kind: 'message'; lines: string[]; dur: number }
  | { kind: 'end'; conclusion: string[]; signature: string; names: string[]; dur: number }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

/** Temps de lecture d'une citation (secondes). */
export const quoteDuration = (text: string) => clamp(2.3 + text.length * 0.024, 3, 4.4)

/**
 * Construit la séquence finale à partir du contenu fourni (aucun texte inventé :
 * citations extraites mot pour mot, noms des auteurs, photos fournies, textes du fichier de configuration).
 * Les photos sont intercalées entre les citations.
 */
export function buildScenes(c: Content): Scene[] {
  const f = c.finale
  const names = c.letters.map((l) => l.author)
  const scenes: Scene[] = []
  if (f.opening.length) scenes.push({ kind: 'opening', lines: f.opening, dur: 1.2 + f.opening.length * 1.4 })
  scenes.push({ kind: 'names', names, dur: 4.2 })

  const quotes: Scene[] = f.quotes.map((q) => ({ kind: 'quote', quote: q, dur: quoteDuration(q.text) }))
  const photos: Scene[] = f.photos.map((p) => ({
    kind: 'photo',
    photo: p.photo,
    quote: p.quote,
    dur: p.quote ? clamp(4.6 + p.quote.text.length * 0.02, 5.4, 7) : 4.8,
  }))
  // Intercale : les photos se répartissent entre les citations, la dernière juste avant la convergence.
  const total = quotes.length + photos.length
  const mixed: Scene[] = []
  let qi = 0
  let pi = 0
  for (let i = 0; i < total; i++) {
    const photoSlot = photos.length && pi < photos.length && Math.round(((pi + 1) * total) / photos.length) - 1 === i
    if (photoSlot || qi >= quotes.length) mixed.push(photos[pi++])
    else mixed.push(quotes[qi++])
  }
  scenes.push(...mixed)

  scenes.push({ kind: 'converge', names, dur: 3.4 })
  scenes.push({ kind: 'reveal', subtitle: f.subtitle26, age: c.recipient.age, dur: 6.8 })
  if (f.message.length) scenes.push({ kind: 'message', lines: f.message, dur: 1 + f.message.length * 1.6 + 1.4 })
  scenes.push({ kind: 'end', conclusion: f.conclusion, signature: f.signature, names, dur: Infinity })
  return scenes
}

export const totalDuration = (scenes: Scene[]) => scenes.filter((s) => Number.isFinite(s.dur)).reduce((a, s) => a + s.dur, 0)
