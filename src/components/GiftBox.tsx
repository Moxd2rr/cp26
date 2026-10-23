import { forwardRef, useId } from 'react'
import { motion } from 'motion/react'

export type GiftState = 'closed' | 'opening' | 'open'

/** Point d'où sortent les lettres, en coordonnées du dessin (viewBox 400 × 330). */
export const GIFT_MOUTH = { x: 200, y: 139, w: 400, h: 330 }

const soft = [0.22, 1, 0.36, 1] as const
const box = { transformBox: 'fill-box', transformOrigin: 'center' } as const

/**
 * Le grand cadeau : papier d'emballage lie-de-vin, ruban champagne, nœud, étiquette manuscrite.
 * À l'ouverture : le nœud se défait, l'étiquette tombe, le couvercle s'envole, la lumière sort de la boîte.
 */
export const GiftBox = forwardRef<SVGSVGElement, { state: GiftState; tag: string; className?: string }>(function GiftBox(
  { state, tag, className = '' },
  ref,
) {
  const id = useId().replace(/:/g, '')
  const opening = state === 'opening'
  const closed = state === 'closed'
  const lidVisible = state !== 'open'
  const tagW = Math.max(112, Math.round(tag.length * 8.4 + 40))
  const tagPts = `0,13 13,0 ${tagW},0 ${tagW},48 13,48 0,35`

  return (
    <motion.svg
      ref={ref}
      viewBox="0 0 400 330"
      className={`overflow-visible ${className}`}
      aria-hidden
      animate={closed ? { rotate: [0, -1.4, 1.2, -0.6, 0] } : { rotate: 0 }}
      transition={closed ? { duration: 1.1, repeat: Infinity, repeatDelay: 3.2, ease: 'easeInOut' } : { duration: 0.3 }}
      style={box}
    >
      <defs>
        <pattern id={`wrap${id}`} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="22" height="22" fill="#6d1c2b" />
          <path d="M0,11 H22 M11,0 V22" stroke="#7d2637" strokeWidth="1.2" />
          <rect x="8.5" y="8.5" width="5" height="5" fill="#86303f" />
          <circle cx="0" cy="0" r="1.3" fill="#ecdcbc" fillOpacity="0.35" />
          <circle cx="22" cy="22" r="1.3" fill="#ecdcbc" fillOpacity="0.35" />
        </pattern>
        <linearGradient id={`shadeX${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id={`ribbon${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#cdb98f" />
          <stop offset="0.45" stopColor="#f6ead0" />
          <stop offset="1" stopColor="#bfa77a" />
        </linearGradient>
        <radialGradient id={`glow${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff4dc" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#ffd9a0" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`beam${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffe2b0" stopOpacity="0.38" />
          <stop offset="1" stopColor="#ffe2b0" stopOpacity="0" />
        </linearGradient>
        <filter id={`blur${id}`}>
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* Ombre portée sur la table */}
      <ellipse cx="200" cy="314" rx="150" ry="13" fill="#000" fillOpacity="0.5" filter={`url(#blur${id})`} />

      {/* Lumière qui s'échappe */}
      <motion.polygon
        points="104,128 296,128 372,-60 28,-60"
        fill={`url(#beam${id})`}
        initial={false}
        animate={{ opacity: state === 'closed' ? 0 : state === 'opening' ? [0, 0.9, 0.6] : 0.35 }}
        transition={{ duration: 2.2, delay: opening ? 0.9 : 0 }}
      />

      {/* Intérieur de la boîte */}
      <polygon points="80,150 320,150 296,128 104,128" fill="#1c070d" />
      <polygon points="104,128 296,128 290,136 110,136" fill="#3a0f1a" />
      <motion.ellipse
        cx="200"
        cy="140"
        rx="118"
        ry="22"
        fill={`url(#glow${id})`}
        initial={false}
        animate={{ opacity: state === 'closed' ? 0 : state === 'opening' ? [0, 1, 0.75] : 0.45, scale: state === 'opening' ? [0.6, 1.15, 1] : 1 }}
        transition={{ duration: 1.8, delay: opening ? 0.85 : 0 }}
        style={box}
      />

      {/* Corps */}
      <rect x="80" y="150" width="240" height="160" fill={`url(#wrap${id})`} />
      <rect x="80" y="150" width="240" height="160" fill={`url(#shadeX${id})`} />
      <rect x="80" y="150" width="240" height="6" fill="#000" fillOpacity="0.18" />
      <motion.rect
        x="188"
        y="150"
        width="24"
        height="160"
        fill={`url(#ribbon${id})`}
        initial={false}
        animate={{ opacity: lidVisible ? (opening ? 0 : 1) : 0, y: opening ? 14 : 0 }}
        transition={{ duration: 0.6, delay: opening ? 0.3 : 0 }}
      />

      {lidVisible && (
        <>
          {/* Couvercle */}
          <motion.g
            style={box}
            initial={false}
            animate={
              opening
                ? { y: [0, -70, -120], x: [0, 24, 150], rotate: [0, -7, 20], opacity: [1, 1, 0] }
                : { y: 0, x: 0, rotate: 0, opacity: 1 }
            }
            transition={{ duration: 1.15, delay: 0.38, times: [0, 0.4, 1], ease: soft }}
          >
            <polygon points="70,118 330,118 304,92 96,92" fill={`url(#wrap${id})`} />
            <polygon points="70,118 330,118 304,92 96,92" fill="#fff" fillOpacity="0.1" />
            <rect x="70" y="118" width="260" height="38" fill={`url(#wrap${id})`} />
            <rect x="70" y="118" width="260" height="38" fill={`url(#shadeX${id})`} />
            <rect x="70" y="150" width="260" height="6" fill="#000" fillOpacity="0.25" />
            <polygon points="79,109 321,109 313,101 87,101" fill={`url(#ribbon${id})`} />
            <polygon points="186,118 214,118 211,92 189,92" fill={`url(#ribbon${id})`} />
            <rect x="186" y="118" width="28" height="38" fill={`url(#ribbon${id})`} />
          </motion.g>

          {/* Nœud */}
          <motion.g
            style={box}
            initial={false}
            animate={opening ? { scale: 0.2, rotate: -40, y: -30, opacity: 0 } : { scale: 1, rotate: 0, y: 0, opacity: 1 }}
            transition={{ duration: 0.65, ease: soft }}
          >
            <path d="M196,98 L170,134 L179,138 L201,102 Z" fill="#d9c49a" />
            <path d="M204,98 L232,132 L223,137 L199,102 Z" fill="#cdb78b" />
            <path d="M200,96 C182,68 138,64 145,88 C150,105 183,104 200,96 Z" fill={`url(#ribbon${id})`} />
            <path d="M200,96 C218,68 262,64 255,88 C250,105 217,104 200,96 Z" fill={`url(#ribbon${id})`} />
            <path d="M196,94 C184,80 160,78 160,88 C162,96 182,98 196,95 Z" fill="#000" fillOpacity="0.12" />
            <path d="M204,94 C216,80 240,78 240,88 C238,96 218,98 204,95 Z" fill="#000" fillOpacity="0.12" />
            <ellipse cx="200" cy="97" rx="11" ry="8.5" fill="#e6d3ab" />
            <ellipse cx="198" cy="95" rx="5" ry="3" fill="#fff" fillOpacity="0.35" />
          </motion.g>

          {/* Étiquette */}
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: '0% 0%' }}
            initial={false}
            animate={opening ? { y: 70, rotate: 35, opacity: 0 } : { y: 0, rotate: [-1.5, 1.5, -1.5], opacity: 1 }}
            transition={opening ? { duration: 0.9, delay: 0.1, ease: 'easeIn' } : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M206,100 C222,118 232,146 243,168" stroke="#d8c7a2" strokeWidth="1.2" fill="none" />
            <g transform="translate(238 150)">
              <polygon points={tagPts} fill="#cfae80" />
              <polygon points={tagPts} fill="#000" fillOpacity="0.06" transform="translate(2 3)" />
              <polygon points={tagPts} fill="#d6b88b" />
              <circle cx="11" cy="24" r="3.2" fill="#151a2c" />
              <text x="24" y="31" fontFamily="Nothing You Could Do, cursive" fontSize="14.5" fill="#2a1d12">
                {tag}
              </text>
            </g>
          </motion.g>
        </>
      )}
    </motion.svg>
  )
})
