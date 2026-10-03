import { motion } from 'framer-motion'
import { addDaysStr, shortDate } from '../lib/dates'
import { weekNumber } from '../lib/week'
import type { PatternStat, MasteryState } from '../lib/stats'
import { MASTERY_HELP } from '../lib/constants'
import { Tooltip } from './Primitives'

export function Heatmap({
  counts,
  planStart,
  today,
}: {
  counts: Map<string, number>
  planStart: string
  today: string
}) {
  const cur = weekNumber(planStart, today)
  const endWeek = Math.max(12, cur)
  const startWeek = endWeek - 11
  const weeks = Array.from({ length: 12 }, (_, i) => startWeek + i)
  const dayLetters = Array.from({ length: 7 }, (_, d) => {
    const dt = new Date(addDaysStr(planStart, d) + 'T00:00:00')
    return 'SMTWTFS'[dt.getDay()]
  })
  const shade = (n: number) =>
    n === 0 ? 'bg-line/50' : n === 1 ? 'bg-lime/35' : n === 2 ? 'bg-lime/65' : 'bg-lime shadow-glow'

  return (
    <div>
      <div className="flex gap-2">
        <div className="grid grid-rows-7 gap-1 pt-4 font-mono text-[9px] text-mute" aria-hidden="true">
          {dayLetters.map((l, i) => (
            <span key={i} className="flex h-5 items-center">
              {l}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 grid grid-cols-12 gap-1 font-mono text-[9px] text-mute" aria-hidden="true">
            {weeks.map((w) => (
              <span key={w} className={w === cur ? 'text-lime' : ''}>
                {w >= 1 && w <= 12 ? `W${w}` : ''}
              </span>
            ))}
          </div>
          <div
            className="grid grid-flow-col grid-rows-7 gap-1"
            style={{ gridTemplateColumns: 'repeat(12, minmax(0, 1fr))' }}
            role="img"
            aria-label="Activity heatmap for the last 12 weeks"
          >
            {weeks.flatMap((w) =>
              Array.from({ length: 7 }, (_, d) => {
                const date = addDaysStr(planStart, (w - 1) * 7 + d)
                const n = counts.get(date) ?? 0
                const future = date > today
                return (
                  <div
                    key={date}
                    title={`${shortDate(date)}: ${n} problem${n === 1 ? '' : 's'}`}
                    className={`h-5 rounded-[3px] transition-colors ${future ? 'border border-dashed border-line/60' : shade(n)} ${date === today ? 'ring-1 ring-ink' : ''}`}
                  />
                )
              }),
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 font-mono text-[10px] text-mute" aria-hidden="true">
        Less
        {[0, 1, 2, 3].map((n) => (
          <span key={n} className={`h-3 w-3 rounded-[3px] ${shade(n)}`} />
        ))}
        More
      </div>
    </div>
  )
}

export function MistakeBars({ data }: { data: { type: string; count: number }[] }) {
  if (!data.length) return <p className="py-6 text-sm text-mute">No mistakes logged yet. Tag them honestly; they are the curriculum.</p>
  const max = Math.max(...data.map((d) => d.count))
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={d.type}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span>{d.type}</span>
            <span className="font-mono text-mute">{d.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line/60">
            <motion.div
              className="h-full rounded-full bg-ice"
              initial={{ width: 0 }}
              animate={{ width: `${(d.count / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Sparkline({ values, currentIndex = 11 }: { values: number[]; currentIndex?: number }) {
  const w = 300
  const h = 90
  const max = Math.max(60, ...values)
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => [i * step, h - 8 - (v / max) * (h - 20)] as const)
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `0,${h} ${line} ${w},${h}`
  const [cx, cy] = pts[currentIndex]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" role="img" aria-label={`Minutes per week over 12 weeks, this week ${values[currentIndex]} minutes`}>
      <polygon points={area} fill="rgb(var(--ice) / 0.12)" />
      <motion.polyline
        points={line}
        fill="none"
        stroke="rgb(var(--ice))"
        strokeWidth={2}
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      <circle cx={cx} cy={cy} r={4} fill="rgb(var(--ice))" />
    </svg>
  )
}

const STATE_STYLE: Record<MasteryState, string> = {
  Untouched: 'border-dashed border-line text-mute',
  Learning: 'border-ice/60',
  Solid: 'border-lime/60',
  Mastered: 'border-lime shadow-glow bg-lime/10',
}
const STATE_PILL: Record<MasteryState, string> = {
  Untouched: 'text-mute',
  Learning: 'text-ice border-ice/50',
  Solid: 'text-lime border-lime/50',
  Mastered: 'bg-lime text-onlime border-lime',
}

export function PatternMap({ stats }: { stats: PatternStat[] }) {
  const tiles = stats.filter((s) => s.pattern !== 'Other' || s.logged > 0)
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">Pattern mastery map</h2>
        <Tooltip text={MASTERY_HELP} label="How mastery is calculated" />
      </div>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((s) => (
          <li
            key={s.pattern}
            className={`flex flex-col justify-between rounded-lg border bg-bg/50 p-3 transition-transform duration-200 ease-out hover:-translate-y-0.5 ${STATE_STYLE[s.state]}`}
          >
            <p className="min-h-[2.5rem] text-sm font-semibold leading-tight text-ink">{s.pattern}</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="font-display text-3xl font-extrabold leading-none text-ink">{s.logged}</p>
                <p className="font-mono text-[10px] text-mute">
                  {s.logged ? `${Math.round(s.cleanRate * 100)}% clean` : 'not started'}
                </p>
              </div>
              <span className={`pill !py-0 ${STATE_PILL[s.state]}`}>{s.state}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
