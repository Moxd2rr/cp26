import type { Ambiance } from '../types'

/** Teinte de lumière (halo) et couleur de cire par ambiance. */
export const AMBIANCE: Record<Ambiance, { glow: string; wax: [string, string, string]; label: string }> = {
  or: { glow: '201 164 92', wax: ['#f0d79a', '#c29a4f', '#6e4f1c'], label: 'Or' },
  aube: { glow: '224 150 110', wax: ['#f0b48f', '#b8643f', '#5e2c18'], label: 'Aube' },
  rose: { glow: '214 138 150', wax: ['#eeb0ba', '#b05a6b', '#5a2432'], label: 'Rose' },
  ambre: { glow: '222 150 70', wax: ['#f3c27a', '#c07a2b', '#5f3810'], label: 'Ambre' },
  nuit: { glow: '110 140 210', wax: ['#9fb4e6', '#3f5c9e', '#18264d'], label: 'Nuit' },
  bordeaux: { glow: '190 70 90', wax: ['#e07a8a', '#8e2238', '#420c18'], label: 'Bordeaux' },
  minuit: { glow: '150 160 230', wax: ['#f3dfa6', '#b38a3e', '#3b2a10'], label: 'Minuit' },
}

export const pad = (n: number) => String(n).padStart(2, '0')
