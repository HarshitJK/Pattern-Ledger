import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { useDerived } from '../hooks'
import { CountUp, Item, Stagger } from '../components/Motion'
import { PageHeader } from '../components/Primitives'
import { buildReview } from '../lib/review'
import { prettyDate } from '../lib/dates'
import { targetLabel } from '../lib/week'
import { targetForWeek } from '../data/plan'

function Stat({ label, children, tone = '' }: { label: string; children: React.ReactNode; tone?: string }) {
  return (
    <div className="card p-5">
      <p className="kicker">{label}</p>
      <div className={`font-display mt-2 text-3xl font-extrabold leading-tight ${tone}`}>{children}</div>
    </div>
  )
}

export default function Review() {
  const d = useDerived()
  const problems = useStore((s) => s.problems)
  const planStart = useStore((s) => s.planStart)
  const reflections = useStore((s) => s.reflections)
  const setReflection = useStore((s) => s.setReflection)
  const [week, setWeek] = useState(Math.max(1, d.week.week))

  const r = useMemo(() => buildReview(problems, planStart, week), [problems, planStart, week])
  const key = `w${week}`
  const target = targetForWeek(Math.min(12, week))

  return (
    <Stagger>
      <Item>
        <PageHeader title="Sunday review" kicker="Read the log. Pick one focus.">
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-sm !px-3" aria-label="Previous week" disabled={week <= 1} onClick={() => setWeek(week - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span className="font-mono text-sm">Week {week}</span>
            <button type="button" className="btn btn-sm !px-3" aria-label="Next week" disabled={week >= Math.max(12, d.week.week)} onClick={() => setWeek(week + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </PageHeader>
        <p className="-mt-3 mb-5 font-mono text-xs text-mute">
          {prettyDate(r.start)} - {prettyDate(r.end)}
        </p>
      </Item>

      <Item className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Problems solved" tone={r.solved >= target.min ? 'text-lime' : ''}>
          <CountUp value={r.solved} />
          <span className="font-mono text-sm font-normal text-mute"> / {targetLabel(target)}</span>
        </Stat>
        <Stat label="Clean-solve rate">
          <CountUp value={Math.round(r.cleanRate * 100)} />%
        </Stat>
        <Stat label="Minutes">
          <CountUp value={r.minutes} />
        </Stat>
        <Stat label="Top mistake">
          <span className="text-xl">{r.topMistake ?? 'None logged'}</span>
        </Stat>
      </Item>

      <Item className="mb-4 grid gap-3 lg:grid-cols-2">
        <div className="card p-5">
          <p className="kicker">Weakest pattern this week</p>
          <p className="font-display mt-2 text-2xl font-bold">{r.weakest ?? 'No clear weak spot'}</p>
        </div>
        <div className="card border-lime/50 p-5">
          <p className="kicker !text-lime">Next week's focus</p>
          <p className="font-display mt-2 text-2xl font-bold">{r.nextFocus}</p>
          <p className="mt-1 text-sm text-mute">{r.nextFocusReason}</p>
        </div>
      </Item>

      <Item>
        <section className="card p-5">
          <label htmlFor="reflection" className="font-display text-xl font-bold">
            Reflection
          </label>
          <p className="mb-3 mt-1 text-sm text-mute">What did you struggle with? What pattern clicked? What will you do differently?</p>
          <textarea
            id="reflection"
            rows={6}
            className="input py-3"
            value={reflections[key] ?? ''}
            placeholder="Write it down. Your future self will thank you."
            onChange={(e) => setReflection(key, e.target.value)}
          />
          <p className="mt-2 font-mono text-[11px] text-mute">Saved automatically for week {week}.</p>
        </section>
      </Item>
    </Stagger>
  )
}
