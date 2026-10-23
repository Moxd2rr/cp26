import { useId, useMemo } from 'react'

/** Contour irrégulier de cire, déterministe (même sceau à chaque rendu). */
function blobPath(seed: number, r = 46, bumps = 14) {
  const pts: [number, number][] = []
  let s = seed * 9301 + 49297
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2
    const rr = r + (rnd() - 0.5) * 6
    pts.push([50 + Math.cos(a) * rr, 50 + Math.sin(a) * rr])
  }
  let d = ''
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[(i + 1) % pts.length]
    const mx = (x0 + x1) / 2
    const my = (y0 + y1) / 2
    d += i === 0 ? `M${mx.toFixed(2)},${my.toFixed(2)}` : ''
    const [x2, y2] = pts[(i + 2) % pts.length]
    d += ` Q${x1.toFixed(2)},${y1.toFixed(2)} ${((x1 + x2) / 2).toFixed(2)},${((y1 + y2) / 2).toFixed(2)}`
  }
  return d + 'Z'
}

interface Props {
  label: string
  colors: [string, string, string]
  size?: number
  seed?: number
  /** 'left' | 'right' : n'affiche qu'une moitié (pour l'animation du sceau brisé). */
  half?: 'left' | 'right'
  className?: string
}

export function WaxSeal({ label, colors, size = 64, seed = 3, half, className = '' }: Props) {
  const id = useId().replace(/:/g, '')
  const d = useMemo(() => blobPath(seed), [seed])
  const [hi, mid, lo] = colors
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`w${id}`} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor={hi} />
          <stop offset="0.5" stopColor={mid} />
          <stop offset="1" stopColor={lo} />
        </radialGradient>
        <filter id={`s${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.45" />
        </filter>
        {half && (
          <clipPath id={`c${id}`}>
            {/* Ligne de cassure en zigzag */}
            <path
              d={
                half === 'left'
                  ? 'M-10,-10 L52,-10 L46,22 L56,40 L45,58 L55,76 L48,110 L-10,110 Z'
                  : 'M52,-10 L110,-10 L110,110 L48,110 L55,76 L45,58 L56,40 L46,22 Z'
              }
            />
          </clipPath>
        )}
      </defs>
      <g clipPath={half ? `url(#c${id})` : undefined} filter={`url(#s${id})`}>
        <path d={d} fill={`url(#w${id})`} />
        <circle cx="50" cy="50" r="31" fill="none" stroke={lo} strokeOpacity="0.55" strokeWidth="2.2" />
        <circle cx="50" cy="50" r="31" fill="none" stroke={hi} strokeOpacity="0.35" strokeWidth="0.8" transform="translate(-0.8 -0.8)" />
        <text
          x="50"
          y="50"
          dy="0.36em"
          textAnchor="middle"
          fontFamily="Newsreader Variable, Georgia, serif"
          fontStyle="italic"
          fontWeight={600}
          fontSize={label.length > 2 ? 22 : 30}
          fill={lo}
          fillOpacity="0.85"
        >
          {label}
        </text>
        <text
          x="49.3"
          y="49.3"
          dy="0.36em"
          textAnchor="middle"
          fontFamily="Newsreader Variable, Georgia, serif"
          fontStyle="italic"
          fontWeight={600}
          fontSize={label.length > 2 ? 22 : 30}
          fill={hi}
          fillOpacity="0.35"
        >
          {label}
        </text>
      </g>
    </svg>
  )
}
