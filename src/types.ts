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
    music: { blob: string; mime: string } | null
  }
}
