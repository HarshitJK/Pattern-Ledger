import { useEffect, useState, type ReactNode } from 'react'
import { animate, motion, useReducedMotion } from 'framer-motion'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
}

/** Container that staggers its <Item> children in on mount (route load). */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={stagger} initial="hidden" animate="show">
      {children}
    </motion.div>
  )
}

export function Item({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={rise}>
      {children}
    </motion.div>
  )
}

export function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const reduce = useReducedMotion()
  const [shown, setShown] = useState(reduce ? value : 0)
  useEffect(() => {
    if (reduce) {
      setShown(value)
      return
    }
    const c = animate(0, value, { duration: 0.9, ease: 'easeOut', onUpdate: (v) => setShown(v) })
    return () => c.stop()
  }, [value, reduce])
  return <>{shown.toFixed(decimals)}</>
}

export function Ring({
  value,
  max,
  size = 200,
  stroke = 14,
  children,
}: {
  value: number
  max: number
  size?: number
  stroke?: number
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.min(1, max > 0 ? value / max : 0)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--line))" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--lime))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ filter: pct > 0 ? 'drop-shadow(0 0 6px rgb(var(--lime) / 0.5))' : undefined }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}
