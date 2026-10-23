import { useEffect, useRef } from 'react'

type Mode = 'drift' | 'converge' | 'burst'

interface Props {
  density?: number
  mode?: Mode
  /** Couleur RVB « r g b » des particules. */
  color?: string
  className?: string
}

interface P {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  a: number
  tw: number
  ph: number
}

/** Poussière dorée en suspension (canvas léger, s'arrête quand l'onglet est caché). */
export function GoldDust({ density = 1, mode = 'drift', color = '230 200 140', className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const modeRef = useRef<Mode>(mode)
  const modeChangedAt = useRef(0)

  useEffect(() => {
    if (modeRef.current !== mode) modeChangedAt.current = performance.now()
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let raf = 0
    let ps: P[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const spawn = (anywhere = true): P => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 10,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(0.08 + Math.random() * 0.28),
      r: 0.4 + Math.random() * 1.6,
      a: 0.15 + Math.random() * 0.6,
      tw: 0.4 + Math.random() * 1.6,
      ph: Math.random() * Math.PI * 2,
    })

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(140, (w * h) / 11000) * density * (reduce ? 0.4 : 1))
      ps = Array.from({ length: count }, () => spawn())
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      const m = modeRef.current
      const since = (t - modeChangedAt.current) / 1000
      const cx = w / 2
      const cy = h / 2
      for (const p of ps) {
        if (!reduce) {
          if (m === 'converge') {
            const dx = cx - p.x
            const dy = cy - p.y
            const pull = Math.min(0.06, 0.012 + since * 0.02)
            p.vx += dx * pull * 0.02
            p.vy += dy * pull * 0.02
            p.vx *= 0.9
            p.vy *= 0.9
          } else if (m === 'burst') {
            if (since < 0.05) {
              p.x = cx + (Math.random() - 0.5) * 20
              p.y = cy + (Math.random() - 0.5) * 20
              const ang = Math.random() * Math.PI * 2
              const sp = 2 + Math.random() * 7
              p.vx = Math.cos(ang) * sp
              p.vy = Math.sin(ang) * sp
            }
            p.vx *= 0.975
            p.vy = p.vy * 0.975 - 0.004
          } else {
            p.vx += (Math.random() - 0.5) * 0.004
            p.vx = Math.max(-0.25, Math.min(0.25, p.vx))
            if (p.vy > -0.05) p.vy -= 0.01
          }
          p.x += p.vx
          p.y += p.vy
          if (m === 'drift' && (p.y < -10 || p.x < -10 || p.x > w + 10)) Object.assign(p, spawn(false))
          if (m === 'burst' && (p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20)) Object.assign(p, spawn(true), { vx: 0, vy: -0.2 })
        }
        const twinkle = 0.55 + 0.45 * Math.sin(t / 1000 * p.tw + p.ph)
        const alpha = p.a * twinkle
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4)
        g.addColorStop(0, `rgb(${color} / ${alpha})`)
        g.addColorStop(1, `rgb(${color} / 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2)
        ctx.fill()
      }
      if (!reduce || t < 50) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    const onVis = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(draw)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [density, color])

  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />
}
