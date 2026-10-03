import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useStore } from '../store'
import { useDerived } from '../hooks'
import { IDLE_DAYS_WELCOME } from '../lib/constants'
import { easyRestart } from '../lib/mission'
import { pickQuote } from '../lib/motivation'

/** Gentle full-screen restart offer after 3+ idle days. */
export function WelcomeBack() {
  const d = useDerived()
  const dismissed = useStore((s) => s.welcomeDismissedOn)
  const dismiss = useStore((s) => s.dismissWelcome)
  const navigate = useNavigate()
  const btn = useRef<HTMLButtonElement>(null)
  const show = d.total > 0 && d.idle >= IDLE_DAYS_WELCOME && dismissed !== d.today

  useEffect(() => {
    if (show) btn.current?.focus()
  }, [show])

  if (!show) return null
  const pick = easyRestart(d.today)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      className="fixed inset-0 z-[55] flex items-center justify-center overflow-y-auto bg-bg/95 p-5 backdrop-blur"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-lg"
      >
        <p className="kicker">{d.idle} days since your last log</p>
        <h1 id="welcome-title" className="font-display mt-2 text-4xl font-extrabold leading-tight md:text-5xl">
          Welcome back.
        </h1>
        <p className="mt-4 text-lg text-mute">{pickQuote('returning', d.today)}</p>
        <div className="card mt-8 p-5">
          <p className="kicker">One easy problem to restart</p>
          <p className="font-display mt-1 text-2xl font-bold">{pick.name}</p>
          <p className="text-sm text-mute">{pick.pattern}. Take your time, struggle first, log it honestly.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            ref={btn}
            type="button"
            className="btn btn-primary"
            onClick={() => {
              dismiss(d.today)
              navigate('/session', { state: { problem: pick.name, pattern: pick.pattern } })
            }}
          >
            Start this problem
          </button>
          <button type="button" className="btn" onClick={() => dismiss(d.today)}>
            Show me the dashboard
          </button>
        </div>
      </motion.div>
    </div>
  )
}
