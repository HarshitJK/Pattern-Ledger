import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame } from 'lucide-react'
import { useStore } from '../store'
import { useDerived } from '../hooks'
import { CountUp, Item, Ring, Stagger } from '../components/Motion'
import { Heatmap, MistakeBars, PatternMap, Sparkline } from '../components/Charts'
import { GOAL_TOTAL, PLAN_WEEKS } from '../lib/constants'
import { countsByDate, mistakeBreakdown, minutesPerWeek, patternStats } from '../lib/stats'
import { pickQuote, pickSituation } from '../lib/motivation'
import { targetLabel } from '../lib/week'

export default function Dashboard() {
  const d = useDerived()
  const problems = useStore((s) => s.problems)
  const planStart = useStore((s) => s.planStart)

  const stats = useMemo(() => patternStats(problems), [problems])
  const counts = useMemo(() => countsByDate(problems), [problems])
  const mistakes = useMemo(() => mistakeBreakdown(problems), [problems])
  const endWeek = Math.max(12, d.week.week)
  const minutes = useMemo(() => minutesPerWeek(problems, planStart, endWeek), [problems, planStart, endWeek])
  const curIdx = Math.min(11, Math.max(0, d.week.week - endWeek + 11))

  const lastHard = useMemo(() => {
    const latest = [...problems].sort((a, b) => b.date.localeCompare(a.date))[0]
    return !!latest && latest.solvedAlone === 'N'
  }, [problems])
  const message = pickQuote(
    pickSituation({
      today: d.today,
      isSunday: d.sunday,
      hasLogs: d.total > 0,
      idle: d.idle,
      streak: d.streak,
      overdueRedos: d.groups.overdue.length,
      lastLogHard: lastHard,
    }),
    d.today,
  )

  const { week, mission } = d
  // beforeStart is treated as Week 1 — never show a calendar date in the heading
  const displayWeek = week.beforeStart ? 1 : week.week
  const heading = week.afterEnd
    ? `Week ${week.week} - plan complete`
    : `Week ${displayWeek} of ${PLAN_WEEKS}`
  const sub = week.afterEnd ? 'Keep the loop going' : week.phaseName
  const weekPct = Math.min(100, (d.weekCount / week.target.min) * 100)
  const hit = d.weekCount >= week.target.min

  return (
    <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Item className="lg:col-span-8">
        <section className="card relative h-full overflow-hidden p-6 md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lime/10 blur-3xl" aria-hidden="true" />
          <h1 className="font-display mt-2 text-4xl font-extrabold leading-[1.05] md:text-6xl">
            {heading}
            <span className="text-lime"> · </span>
            <span className="text-mute">{sub}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-ink/90 md:text-lg">{message}</p>
        </section>
      </Item>

      <Item className="lg:col-span-4 lg:row-span-2">
        <section className="card flex h-full flex-col items-center p-6" aria-label="Progress">
          <Ring value={d.total} max={GOAL_TOTAL} size={208} stroke={14}>
            <span className="font-display text-6xl font-extrabold leading-none">
              <CountUp value={d.total} />
            </span>
            <span className="mt-1 font-mono text-xs text-mute">of {GOAL_TOTAL} solved</span>
          </Ring>
          <div className="mt-7 w-full">
            <div className="flex items-baseline justify-between">
              <p className="kicker">This week</p>
              <p className="font-mono text-sm">
                <span className={hit ? 'text-lime' : 'text-ink'}>{d.weekCount}</span>
                <span className="text-mute"> / {targetLabel(week.target)}</span>
              </p>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-line/60"
              role="progressbar"
              aria-valuenow={d.weekCount}
              aria-valuemin={0}
              aria-valuemax={week.target.min}
              aria-label="Problems solved this week"
            >
              <div className="h-full rounded-full bg-lime transition-all duration-500 ease-out" style={{ width: `${weekPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-mute">
              {hit ? 'Weekly target hit. Quality over quantity from here.' : `${Math.max(0, week.target.min - d.weekCount)} more to hit the weekly target.`}
            </p>
          </div>
        </section>
      </Item>

      <Item className="lg:col-span-8">
        <section
          className={`card relative flex h-full flex-col justify-between gap-5 p-6 ${mission.kind === 'overdue' ? 'border-ember' : 'border-lime/40'}`}
          aria-label="Today's mission"
        >
          <div>
            <p className={`kicker ${mission.kind === 'overdue' ? '!text-ember' : '!text-lime'}`}>Today's mission</p>
            <h2 className="font-display mt-1 text-2xl font-bold md:text-3xl">{mission.title}</h2>
            <p className="mt-1 text-mute">{mission.detail}</p>
          </div>
          <div>
            <Link
              to={mission.to}
              state={mission.problemName ? { problem: mission.problemName, pattern: mission.pattern } : undefined}
              className={`btn ${mission.kind === 'overdue' ? 'btn-ember' : 'btn-primary'}`}
            >
              {mission.cta}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </Item>

      <Item className="lg:col-span-4">
        <section className="card relative h-full overflow-hidden p-6" aria-label="Streak">
          <div
            className={`pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full blur-3xl ${d.streak.current > 0 ? 'bg-ember/20' : 'bg-line/30'}`}
            aria-hidden="true"
          />
          <p className="kicker">Streak</p>
          <div className="mt-2 flex items-center gap-3">
            <Flame size={44} className={d.streak.current > 0 ? 'text-ember' : 'text-mute'} aria-hidden="true" />
            <span className={`font-display text-7xl font-extrabold leading-none ${d.streak.current > 0 ? 'text-ember' : 'text-mute'}`}>
              <CountUp value={d.streak.current} />
            </span>
            <span className="self-end pb-2 font-mono text-xs text-mute">days</span>
          </div>
          <p className="mt-3 text-sm text-mute">
            {d.streak.loggedToday ? 'Logged today. Streak extended.' : d.streak.current > 0 ? 'Log one today to extend it.' : 'Log a problem to start a new streak.'}
          </p>
          <p className="mt-1 font-mono text-xs text-mute">Longest: {d.streak.longest} days</p>
        </section>
      </Item>

      <Item className="lg:col-span-8">
        <section className="card h-full p-6" aria-label="Activity">
          <h2 className="font-display mb-4 text-xl font-bold">Activity, 12 weeks</h2>
          <Heatmap counts={counts} planStart={planStart} today={d.today} />
        </section>
      </Item>

      <Item className="lg:col-span-12">
        <section className="card p-6" aria-label="Pattern mastery">
          <PatternMap stats={stats} />
        </section>
      </Item>

      <Item className="lg:col-span-7">
        <section className="card h-full p-6" aria-label="Mistake types">
          <h2 className="font-display mb-4 text-xl font-bold">Where it breaks</h2>
          <MistakeBars data={mistakes} />
        </section>
      </Item>

      <Item className="lg:col-span-5">
        <section className="card h-full p-6" aria-label="Time spent">
          <h2 className="font-display text-xl font-bold">Time per week</h2>
          <p className="mb-2 font-mono text-xs text-mute">
            This week: {minutes[curIdx]} min · 12-week total: {minutes.reduce((a, b) => a + b, 0)} min
          </p>
          <Sparkline values={minutes} currentIndex={curIdx} />
        </section>
      </Item>
    </Stagger>
  )
}
