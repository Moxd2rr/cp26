import type { CSSProperties, ReactNode } from 'react'
import type { Letter } from '../types'
import { LOOK, type EnvelopeStyle } from '../lib/ambiance'
import { OpenedStamp, Postmark, Stamp } from './Postal'
import { WaxSeal } from './WaxSeal'

const SURFACE: Record<EnvelopeStyle, string> = {
  creme: 'paper',
  kraft: 'kraft',
  rose: 'paper paper-rose',
  avion: 'paper paper-avion',
  nuit: 'bg-[#1b2242] text-cream',
}

const INK: Record<EnvelopeStyle, string> = {
  creme: 'text-pen',
  kraft: 'text-[#2a1d12]',
  rose: 'text-pen',
  avion: 'text-pen',
  nuit: 'text-brass',
}

/** Face avant : expéditeur en haut à gauche, timbre et cachet, destinataire au centre — comme une vraie lettre. */
export function EnvelopeFront({
  letter,
  recipient,
  read = false,
  note,
  className = '',
  style,
}: {
  letter: Letter
  recipient: string
  read?: boolean
  note?: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const look = LOOK[letter.ambiance]
  const env = look.envelope
  const dark = env === 'nuit'
  return (
    <div className={`@container absolute inset-0 overflow-hidden rounded-[2px] ${SURFACE[env]} ${className}`} style={style}>
      {env === 'avion' && <div className="airmail-edge" />}
      {dark && <div className="pointer-events-none absolute inset-[5%] border border-brass/30" />}

      {/* Expéditeur */}
      <div className="absolute left-[7%] top-[8%] max-w-[60%]">
        <span className={`typed block !text-[max(0.5rem,3.4cqw)] uppercase ${dark ? 'text-cream/60' : 'text-ink-soft/80'}`}>De</span>
        <span
          className={`hand line-clamp-2 block leading-[1.05] ${INK[env]}`}
          style={{ fontSize: letter.author.length > 12 ? 'max(0.82rem, 6.6cqw)' : letter.author.length > 9 ? 'max(0.9rem, 7.2cqw)' : 'max(0.95rem, 8cqw)' }}
        >
          {letter.author}
        </span>
        {letter.tagline && (
          <span className={`mt-[0.8cqw] line-clamp-2 block font-serif italic leading-tight ${dark ? 'text-cream/70' : 'text-ink-soft'}`} style={{ fontSize: 'max(0.62rem, 4.1cqw)' }}>
            « {letter.tagline} »
          </span>
        )}
      </div>

      {/* Timbre + cachet */}
      <Stamp number={letter.number} colors={look.stamp} className="absolute right-[6%] top-[8%] w-[15%] rotate-[3deg]" />
      <Postmark className="absolute right-[13%] top-[24%] w-[34%] -rotate-[8deg]" color={dark ? '#e9d9b4' : '#2b2a35'} />

      {/* Destinataire */}
      <div className="absolute bottom-[14%] left-[34%] right-[7%]">
        <span className={`hand block text-[max(0.85rem,6.4cqw)] ${INK[env]} opacity-90`}>{recipient}</span>
        <span className={`mt-[2.5cqw] block h-px ${dark ? 'bg-cream/20' : 'bg-ink/15'}`} />
        <span className={`mt-[4.5cqw] block h-px w-4/5 ${dark ? 'bg-cream/20' : 'bg-ink/15'}`} />
      </div>

      {note && <div className="absolute bottom-[12%] left-[7%] max-w-[30%]">{note}</div>}
      {read && <OpenedStamp className="absolute bottom-[10%] left-[6%] -rotate-[9deg]" />}
    </div>
  )
}

/** Dos : rabats, et le sceau de cire à la pointe. Le rabat supérieur est rendu à part pour pouvoir s'ouvrir. */
export function EnvelopeBack({ letter, className = '' }: { letter: Letter; className?: string }) {
  const env = LOOK[letter.ambiance].envelope
  const dark = env === 'nuit'
  const line = dark ? 'rgb(212 173 111 / 0.35)' : 'rgb(80 60 35 / 0.22)'
  return (
    <div className={`absolute inset-0 overflow-hidden rounded-[2px] ${SURFACE[env]} ${className}`} style={{ filter: 'brightness(0.94)' }}>
      {env === 'avion' && <div className="airmail-edge" />}
      <svg viewBox="0 0 142 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d="M0,100 L60,46 M142,100 L82,46" stroke={line} strokeWidth="0.5" fill="none" />
        <path d="M0,0 L56,52 L0,100 Z M142,0 L86,52 L142,100 Z" fill={dark ? 'rgb(0 0 0 / 0.15)' : 'rgb(90 60 30 / 0.05)'} />
      </svg>
    </div>
  )
}

export function Flap({ letter, open }: { letter: Letter; open: boolean }) {
  const env = LOOK[letter.ambiance].envelope
  return (
    <div className="absolute inset-x-0 top-0 h-[56%]">
      <div
        className={`absolute inset-0 ${SURFACE[env]}`}
        style={{
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
          filter: open ? 'brightness(0.8)' : 'brightness(1.02) drop-shadow(0 2px 2px rgb(0 0 0 / 0.2))',
        }}
      />
      {env === 'avion' && <div className="airmail-edge" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />}
    </div>
  )
}

export function Seal({ letter, size = 64, half }: { letter: Letter; size?: number; half?: 'left' | 'right' }) {
  return <WaxSeal label={String(letter.number)} colors={LOOK[letter.ambiance].wax} size={size} seed={letter.number} half={half} />
}
