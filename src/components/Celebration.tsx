import { useEffect, useMemo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useUI } from '../store/ui'

const COLORS = ['rgb(var(--lime))', 'rgb(var(--ember))', 'rgb(var(--ice))', 'rgb(var(--ink))']

function Particles({ count, duration, spread }: { count: number; duration: number; spread: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
        const dist = spread * (0.45 + Math.random() * 0.55)
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - spread * 0.2,
          rot: Math.random() * 540 - 270,
          color: COLORS[i % COLORS.length],
          w: 5 + Math.random() * 5,
          h: 8 + Math.random() * 8,
        }
      }),
    [count, spread],
  )
  return (
    <>
      {parts.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 rounded-[2px]"
          style={{ width: p.w, height: p.h, background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.x, y: p.y + 60, opacity: 0, rotate: p.rot, scale: 0.7 }}
          transition={{ duration, ease: 'easeOut' }}
        />
      ))}
    </>
  )
}

export function Celebration() {
  const c = useUI((s) => s.celebration)
  const clear = useUI((s) => s.clearCelebration)
  const reduce = useReducedMotion()

  useEffect(() => {
    if (!c) return
    const t = setTimeout(clear, c.kind === 'big' ? 3200 : 900)
    return () => clearTimeout(t)
  }, [c, clear])

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-live="polite">
      <AnimatePresence>
        {c && (
          <motion.div key={c.id} className="absolute inset-0" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {!reduce && <Particles count={c.kind === 'big' ? 70 : 26} duration={c.kind === 'big' ? 1.6 : 0.85} spread={c.kind === 'big' ? 340 : 190} />}
            {c.kind === 'big' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="absolute left-1/2 top-[18%] w-[min(88vw,26rem)] -translate-x-1/2 rounded-card border border-lime bg-surface p-5 text-center shadow-glow"
              >
                <p className="kicker text-lime">Milestone</p>
                <p className="font-display mt-1 text-3xl font-extrabold">{c.title}</p>
                {c.sub && <p className="mt-1 text-sm text-mute">{c.sub}</p>}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
