// Structure du contenu déchiffré (produit par scripts/seal.mjs).

export type Ambiance = 'or' | 'aube' | 'rose' | 'ambre' | 'nuit' | 'bordeaux' | 'minuit'
export type Layout = 'auto' | 'texte' | 'photo-haut' | 'photo-fin' | 'entrelace' | 'galerie'

export interface Photo {
  blob: string
  w: number
  h: number
  mime: string
  /** Minuscule aperçu flou (data URL), affiché pendant le déchiffrement. */
  thumb: string
  alt: string
  caption: string | null
}

export interface Letter {
  number: number
  author: string
  relation: string | null
  signature: string | null
  lastLineSignature: boolean
  /** La première ligne est un titre écrit par l'auteur : affichée comme titre, texte inchangé. */
  firstLineTitle?: boolean
  /** Extrait exact de la lettre affiché sous le nom (distingue deux auteurs signant de la même façon). */
  tagline?: string | null
  ambiance: Ambiance
  layout: Layout
  /** Texte intégral, tel que fourni. */
  body: string
  photos: Photo[]
}

export interface Quote {
  letter: number
  author: string
  text: string
}

export interface Content {
  v: 1
  sealedAt: string
  recipient: { firstName: string; fullName: string; nickname: string; age: number }
  welcome: { eyebrow: string; message: string; button: string }
  intro: { lines: string[]; button: string }
  gift: { tag: string; invitation: string; hint: string }
  gallery: { title: string; subtitle: string }
  finalLetter: { number: number; waitForOthers: boolean; finaleButton: string }
  letters: Letter[]
  finale: {
    opening: string[]
    quotes: Quote[]
    photos: { photo: Photo; quote: Quote | null }[]
    subtitle26: string
    message: string[]
    conclusion: string[]
    signature: string
  }
  /** Musique de fond instrumentale (facultative). */
  music: { blob: string; mime: string } | null
}
