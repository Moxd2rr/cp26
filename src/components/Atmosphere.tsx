import { motion } from 'motion/react'
import { GoldDust } from './GoldDust'

/** Fond commun : halo lumineux teinté, poussière dorée, vignettage. */
export function Atmosphere({ tint = '201 164 92', dust = 1 }: { tint?: string; dust?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(60% 50% at 50% 0%, rgb(${tint} / 0.22), transparent 70%), radial-gradient(50% 40% at 85% 100%, rgb(${tint} / 0.10), transparent 70%), radial-gradient(40% 40% at 10% 80%, rgb(${tint} / 0.07), transparent 70%)`,
        }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute left-1/2 top-[-20vh] h-[80vh] w-[60vw] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(closest-side, rgb(${tint} / 0.10), transparent)` }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.08, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      {dust > 0 && <GoldDust density={dust} />}
      <div className="vignette" />
    </div>
  )
}
