import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, Lightbulb, Lock, Minus, Play, Plus, Square } from 'lucide-react'
import { useStore } from '../store'
import { useUI } from '../store/ui'
import { useDerived } from '../hooks'
import { Item, Stagger } from '../components/Motion'
import { PageHeader } from '../components/Primitives'
import { CHECKLIST } from '../data/plan'
import { PATTERN_OPTIONS, STARTERS } from '../data/patterns'
import { HINT_LOCK_MIN, SESSION_MIN } from '../lib/constants'
import { planPatterns } from '../lib/week'

const clock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/**
 * The session as a line of time: elapsed fill, a playhead, the hint-lock tick at 25:00,
 * and minute marks. Used static in setup (a preview of the session) and live while running.
 */
function Track({ elapsed, durationMin }: { elapsed: number; durationMin: number }) {
  const totalSec = durationMin * 60
  const hintSec = HINT_LOCK_MIN * 60
  const at = (s: number) => `${Math.min(100, Math.max(0, (s / totalSec) * 100))}%`
  const over = elapsed > totalSec
  const unlocked = elapsed >= hintSec
  const marks = Array.from({ length: Math.floor(durationMin / 5) + 1 }, (_, i) => i * 5)
  const hintAlign = hintSec / totalSec > 0.9 ? '-translate-x-[85%] items-end' : '-translate-x-1/2 items-center'

  return (
    <div className="pb-7 pt-9">
      <div
        className="relative h-3 rounded-full bg-line/70"
        role="progressbar"
        aria-label="Session time"
        aria-valuemin={0}
        aria-valuemax={durationMin}
        aria-valuenow={Math.min(durationMin, Math.floor(elapsed / 60))}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-linear ${over ? 'bg-ember' : 'bg-lime'}`}
          style={{ width: at(elapsed) }}
        />
        <span
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-bg transition-[left] duration-500 ease-linear ${over ? 'bg-ember' : 'bg-lime'}`}
          style={{ left: `calc(${at(elapsed)} - 10px)` }}
          aria-hidden="true"
        />
        <div className={`absolute -top-8 flex flex-col ${hintAlign}`} style={{ left: at(hintSec) }} aria-hidden="true">
          <span className={`flex items-center gap-1 font-mono text-[11px] transition-colors duration-300 ${unlocked ? 'text-lime' : 'text-mute'}`}>
            {unlocked ? <Lightbulb size={12} /> : <Lock size={12} />}
            {unlocked ? 'hints open' : 'hints 25:00'}
          </span>
          <span className={`h-5 w-px transition-colors duration-300 ${unlocked ? 'bg-lime' : 'bg-mute'}`} />
        </div>
      </div>
      <div className="relative mt-3 h-4 font-mono text-[11px] text-mute" aria-hidden="true">
        {marks.map((m, i) => (
          <span
            key={m}
            className={`absolute ${i === 0 ? '' : i === marks.length - 1 && m === durationMin ? '-translate-x-full' : '-translate-x-1/2'}`}
            style={{ left: at(m * 60) }}
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}

function Setup() {
  const location = useLocation()
  const d = useDerived()
  const prefill = (location.state ?? {}) as { problem?: string; pattern?: string }
  const startSession = useStore((s) => s.startSession)
  const [problem, setProblem] = useState(prefill.problem ?? '')
  const [pattern, setPattern] = useState(prefill.pattern ?? '')
  const [dur, setDur] = useState(SESSION_MIN.default)
  const [error, setError] = useState('')

  const weekStarters = planPatterns(d.week.clamped).flatMap((p) => (STARTERS[p] ?? []).map((s) => ({ ...s, pattern: p })))
  const clamp = (n: number) => Math.min(SESSION_MIN.max, Math.max(SESSION_MIN.min, n))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!problem.trim()) return setError('Name the problem you are about to attempt.')
    startSession(problem.trim(), pattern, dur)
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
      <div>
        <label htmlFor="problem" className="font-display text-3xl font-extrabold leading-tight md:text-4xl">
          What are you solving?
        </label>
        <input
          id="problem"
          autoFocus
          aria-describedby={error ? 'problem-err' : undefined}
          aria-invalid={!!error}
          className="mt-4 w-full border-0 border-b-2 border-line bg-transparent pb-3 font-display text-2xl font-bold text-ink placeholder:text-mute/50 transition-colors duration-200 focus:border-lime focus:outline-none md:text-3xl"
          placeholder="Problem name"
          value={problem}
          onChange={(e) => {
            setProblem(e.target.value)
            setError('')
          }}
        />
        {error && (
          <p id="problem-err" className="err" role="alert">
            {error}
          </p>
        )}

        {weekStarters.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm text-mute">This week's starters</p>
            <div className="flex flex-wrap gap-2">
              {weekStarters.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    setProblem(s.name)
                    setPattern(s.pattern)
                    setError('')
                  }}
                  className={`min-h-[44px] rounded-full border px-4 text-sm transition-colors duration-200 ${
                    problem === s.name ? 'border-lime bg-lime/15 text-ink' : 'border-line text-mute hover:border-mute hover:text-ink'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8" role="radiogroup" aria-labelledby="pattern-label">
          <p id="pattern-label" className="mb-1 text-sm font-semibold">
            Your pattern guess
          </p>
          <p className="mb-3 text-sm text-mute">Name it before you code. Wrong is fine, blank is a missed rep. Tap again to clear.</p>
          <div className="flex flex-wrap gap-2">
            {PATTERN_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={pattern === p}
                onClick={() => setPattern(pattern === p ? '' : p)}
                className={`min-h-[44px] rounded-full border px-3.5 text-sm transition-colors duration-200 md:min-h-[36px] ${
                  pattern === p ? 'border-lime bg-lime text-onlime' : 'border-line text-mute hover:border-mute hover:text-ink'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:pt-2">
        <p className="text-sm font-semibold">Focus time</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-line">
            <button type="button" aria-label="One minute less" className="flex h-11 w-11 items-center justify-center rounded-full text-mute hover:text-ink disabled:opacity-30" disabled={dur <= SESSION_MIN.min} onClick={() => setDur(clamp(dur - 1))}>
              <Minus size={16} />
            </button>
            <span className="w-20 text-center font-mono text-2xl font-bold tabular-nums" aria-live="polite">
              {dur}
              <span className="ml-1 text-xs font-normal text-mute">min</span>
            </span>
            <button type="button" aria-label="One minute more" className="flex h-11 w-11 items-center justify-center rounded-full text-mute hover:text-ink disabled:opacity-30" disabled={dur >= SESSION_MIN.max} onClick={() => setDur(clamp(dur + 1))}>
              <Plus size={16} />
            </button>
          </div>
          {[25, 30, 40, 45].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDur(m)}
              className={`min-h-[44px] rounded-full px-3.5 font-mono text-sm transition-colors duration-200 md:min-h-[36px] ${dur === m ? 'text-lime' : 'text-mute hover:text-ink'}`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <Track elapsed={0} durationMin={dur} />
          <p className="text-sm text-mute">
            Hints stay locked until minute {HINT_LOCK_MIN}. The session ends at {dur}:00. Struggling is the point; the lock keeps you honest.
          </p>
        </div>

        <button type="submit" className="btn btn-primary mt-8 w-full !min-h-[56px] text-base sm:w-auto sm:px-10">
          <Play size={18} /> Start session
        </button>
      </div>
    </form>
  )
}

function Running() {
  const navigate = useNavigate()
  const session = useStore((s) => s.session)!
  const patchSession = useStore((s) => s.patchSession)
  const endSession = useStore((s) => s.endSession)
  const setDraft = useStore((s) => s.setDraft)
  const toast = useUI((s) => s.toast)
  const [now, setNow] = useState(Date.now())
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  // Derived from the stored start timestamp, so a refresh can never reset the clock.
  const elapsed = (now - session.startedAt) / 1000
  const total = session.durationMin * 60
  const remaining = Math.max(0, total - elapsed)
  const hintUnlocked = elapsed >= HINT_LOCK_MIN * 60
  const unlockIn = Math.max(0, HINT_LOCK_MIN * 60 - elapsed)
  const done = remaining <= 0
  const doneCount = session.checks.filter(Boolean).length
  const currentStep = session.checks.findIndex((c) => !c)

  const finish = () => {
    setDraft({
      name: session.problem,
      pattern: session.pattern,
      minutes: Math.max(1, Math.ceil(elapsed / 60)),
      solvedAlone: session.hintUsed ? 'N' : undefined,
    })
    endSession()
    navigate('/log')
  }

  const toggleStep = (i: number) => patchSession({ checks: session.checks.map((c, j) => (j === i ? !c : c)) })

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-14">
      <section aria-label="Timer">
        <p className="font-display text-2xl font-bold leading-tight md:text-3xl">{session.problem}</p>
        <p className="mt-1 text-sm text-mute">{session.pattern || 'Pattern not named yet. Name it before you code.'}</p>

        <p
          className={`mt-8 font-mono font-bold leading-none tabular-nums transition-colors duration-300 ${done ? 'text-ember' : 'text-ink'}`}
          style={{ fontSize: 'clamp(4.25rem, 13vw, 8rem)' }}
          role="timer"
          aria-label={`${clock(remaining)} remaining`}
        >
          {clock(remaining)}
        </p>
        <p className="mt-2 font-mono text-sm text-mute">
          {done ? <span className="text-ember">Over by {clock(elapsed - total)}</span> : `${clock(elapsed)} elapsed of ${session.durationMin}:00`}
        </p>

        <Track elapsed={elapsed} durationMin={session.durationMin} />

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn"
            disabled={!hintUnlocked || session.hintUsed}
            onClick={() => {
              patchSession({ hintUsed: true })
              toast('Hint taken. This will be logged as not solved alone.')
            }}
          >
            {hintUnlocked ? <Lightbulb size={16} /> : <Lock size={16} />}
            {session.hintUsed ? 'Hint taken' : hintUnlocked ? 'I need a hint' : `Hint in ${clock(unlockIn)}`}
          </button>
          <button type="button" className="btn btn-primary" onClick={finish}>
            <Square size={15} /> End and log
          </button>
          {confirmDiscard ? (
            <span className="flex items-center gap-2 text-sm">
              <button
                type="button"
                className="btn btn-ember btn-sm"
                onClick={() => {
                  endSession()
                  toast('Session discarded')
                }}
              >
                Discard for good
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setConfirmDiscard(false)}>
                Keep going
              </button>
            </span>
          ) : (
            <button type="button" className="min-h-[44px] px-2 text-sm text-mute underline-offset-4 hover:text-ember hover:underline" onClick={() => setConfirmDiscard(true)}>
              Discard
            </button>
          )}
        </div>
        {session.hintUsed && <p className="mt-3 text-sm text-ember">Hint used: the log form will pre-select "not solved alone".</p>}
        {done && !session.hintUsed && <p className="mt-3 text-sm text-mute">Time is up. Finish and log it, or keep going if you are close.</p>}
      </section>

      <section aria-label="Checklist">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Flight plan</h2>
          <p className="font-mono text-sm text-mute">
            <span className={doneCount === CHECKLIST.length ? 'text-lime' : 'text-ink'}>{doneCount}</span> / {CHECKLIST.length}
          </p>
        </div>
        <ol className="relative mt-5">
          <span className="absolute bottom-6 left-[17px] top-6 w-px bg-line" aria-hidden="true" />
          {CHECKLIST.map((step, i) => {
            const checked = session.checks[i] ?? false
            const locked = i === CHECKLIST.length - 1 && !session.checks[CHECKLIST.length - 2]
            const current = i === currentStep
            return (
              <li key={step} className="relative">
                <label
                  className={`flex min-h-[52px] items-start gap-4 rounded-lg py-2.5 pr-2 transition-colors duration-200 ${locked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-surface'}`}
                >
                  <input type="checkbox" className="peer sr-only" checked={checked} disabled={locked} onChange={() => toggleStep(i)} />
                  <span
                    className={`relative z-[1] mt-px flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-mono text-sm transition-colors duration-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lime ${
                      checked ? 'border-lime bg-lime text-onlime' : current ? 'border-lime bg-bg text-lime' : 'border-line bg-bg text-mute'
                    }`}
                    aria-hidden="true"
                  >
                    {checked ? <Check size={16} strokeWidth={3} /> : locked ? <Lock size={13} /> : i + 1}
                  </span>
                  <span className={`pt-1.5 text-[15px] leading-snug ${checked ? 'text-mute line-through decoration-mute/50' : current ? 'font-semibold text-ink' : 'text-ink/80'} ${locked ? 'opacity-60' : ''}`}>
                    {step}
                    {locked && <span className="mt-0.5 block text-xs font-normal text-mute no-underline">Unlocks after step 7. Never peek earlier.</span>}
                  </span>
                </label>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}

export default function Session() {
  const active = useStore((s) => !!s.session)
  return (
    <Stagger>
      <Item>
        <PageHeader title={active ? 'In session' : 'Solve session'} />
      </Item>
      <Item>{active ? <Running /> : <Setup />}</Item>
    </Stagger>
  )
}
