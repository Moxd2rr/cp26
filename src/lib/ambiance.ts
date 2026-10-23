import type { Ambiance } from '../types'

export type EnvelopeStyle = 'creme' | 'kraft' | 'rose' | 'avion' | 'nuit'

interface Look {
  /** Papier de l'enveloppe */
  envelope: EnvelopeStyle
  /** Papier de la lettre */
  paper: '' | 'paper-rose' | 'paper-avion' | 'paper-verge'
  /** Couleurs du timbre [fond, encre] */
  stamp: [string, string]
  /** Cire du sceau (dos de l'enveloppe) [clair, moyen, sombre] */
  wax: [string, string, string]
  /** Lumière de la lampe pendant la lecture « r g b » */
  light: string
}

/** Chaque ambiance se traduit en objets réels : papier, timbre, cire, lumière. */
export const LOOK: Record<Ambiance, Look> = {
  or: { envelope: 'kraft', paper: 'paper-verge', stamp: ['#2d5a4a', '#f1e6cf'], wax: ['#d9a35c', '#9c6a2a', '#4f3210'], light: '255 205 145' },
  aube: { envelope: 'creme', paper: '', stamp: ['#c2603f', '#fbefe0'], wax: ['#d9805c', '#a2482b', '#4e1d0e'], light: '255 196 150' },
  rose: { envelope: 'rose', paper: 'paper-rose', stamp: ['#8e3550', '#fbe9ec'], wax: ['#c9637a', '#8e2f47', '#45121f'], light: '255 190 175' },
  ambre: { envelope: 'kraft', paper: '', stamp: ['#2f4f8f', '#efe7d6'], wax: ['#dc9a48', '#a8641e', '#53300b'], light: '255 200 130' },
  nuit: { envelope: 'avion', paper: 'paper-avion', stamp: ['#24407f', '#e8eef8'], wax: ['#7d93c9', '#3b5294', '#18234a'], light: '205 215 255' },
  bordeaux: { envelope: 'creme', paper: '', stamp: ['#6d1c2b', '#f6e3e3'], wax: ['#b8455a', '#7a1f33', '#3b0914'], light: '255 185 170' },
  minuit: { envelope: 'nuit', paper: 'paper-verge', stamp: ['#1d2547', '#e9d9b4'], wax: ['#d4ad6f', '#9a7438', '#4a3410'], light: '255 214 160' },
}

export const pad = (n: number) => String(n).padStart(2, '0')

/** Petit désordre déterministe : chaque enveloppe a toujours la même inclinaison. */
export function scatter(n: number) {
  const r1 = Math.sin(n * 12.9898) * 43758.5453
  const r2 = Math.sin(n * 78.233) * 12345.6789
  const a = r1 - Math.floor(r1)
  const b = r2 - Math.floor(r2)
  return { rotate: (a - 0.5) * 6, y: (b - 0.5) * 14 }
}
