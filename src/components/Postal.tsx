import { useId } from 'react'

/** Timbre-poste dentelé, avec le numéro de la lettre. */
export function Stamp({ number, colors, className = '' }: { number: number; colors: [string, string]; className?: string }) {
  const id = useId().replace(/:/g, '')
  const [bg, ink] = colors
  const W = 60
  const H = 72
  const holes: [number, number][] = []
  for (let x = 3; x <= W; x += 6) holes.push([x, 0], [x, H])
  for (let y = 3; y <= H; y += 6) holes.push([0, y], [W, y])
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden style={{ filter: 'drop-shadow(0 1px 1.5px rgb(0 0 0 / 0.3))' }}>
      <defs>
        <mask id={`m${id}`}>
          <rect width={W} height={H} fill="#fff" />
          {holes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.2" fill="#000" />
          ))}
        </mask>
      </defs>
      <g mask={`url(#m${id})`}>
        <rect width={W} height={H} fill="#fbf7ee" />
        <rect x="5" y="5" width={W - 10} height={H - 10} fill={bg} />
        <rect x="8" y="8" width={W - 16} height={H - 16} fill="none" stroke={ink} strokeOpacity="0.5" strokeWidth="0.6" />
        <text x={W / 2} y="40" textAnchor="middle" fontFamily="Newsreader Variable, Georgia, serif" fontStyle="italic" fontSize="24" fill={ink}>
          {number}
        </text>
        <text x={W / 2} y="56" textAnchor="middle" fontFamily="Courier Prime, monospace" fontSize="6.2" letterSpacing="0.6" fill={ink} fillOpacity="0.85">
          CHAP. 26
        </text>
      </g>
    </svg>
  )
}

/** Cachet de la poste : double cercle et ondulations, encre délavée. */
export function Postmark({ className = '', color = '#2b2a35' }: { className?: string; color?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 150 70" className={className} aria-hidden>
      <defs>
        <path id={`p${id}`} d="M 35,35 m -24,0 a 24,24 0 1,1 48,0 a 24,24 0 1,1 -48,0" />
      </defs>
      <g fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="1.2">
        <circle cx="35" cy="35" r="30" />
        <circle cx="35" cy="35" r="19" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M70,${20 + i * 10} q10,-6 20,0 t20,0 t20,0 t20,0`} />
        ))}
      </g>
      <text fontFamily="Courier Prime, monospace" fontSize="7.2" fill={color} fillOpacity="0.55" letterSpacing="1.2">
        <textPath href={`#p${id}`}>CHAPITRE 26 · ANNIVERSAIRE ·</textPath>
      </text>
      <text x="35" y="39" textAnchor="middle" fontFamily="Courier Prime, monospace" fontSize="11" fontWeight="700" fill={color} fillOpacity="0.55">
        26
      </text>
    </svg>
  )
}

/** Tampon encreur « OUVERTE ». */
export function OpenedStamp({ className = '' }: { className?: string }) {
  return (
    <span
      className={`typed inline-block rounded-[3px] border-2 border-postal-red/70 px-1.5 py-0.5 !text-[0.62rem] font-bold uppercase !tracking-[0.18em] text-postal-red/75 ${className}`}
      style={{ maskImage: 'var(--noise)', WebkitMaskImage: 'var(--noise)', maskSize: '120px', WebkitMaskSize: '120px' }}
    >
      Ouverte
    </span>
  )
}
