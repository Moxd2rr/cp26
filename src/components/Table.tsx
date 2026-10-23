import { motion } from 'motion/react'

/** La table sous la lampe. `light` : couleur « r g b » de la lampe, `on` : lampe allumée. */
export function Table({ light = '255 205 145', on = true }: { light?: string; on?: boolean }) {
  return (
    <div aria-hidden className="table-surface pointer-events-none fixed inset-0 z-0">
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{
          opacity: on ? 1 : 0,
          background: `radial-gradient(70% 55% at 42% -8%, rgb(${light} / 0.24), transparent 72%)`,
        }}
        transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}
