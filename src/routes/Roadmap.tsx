import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { useStore } from '../store'
import { useDerived } from '../hooks'
import { Item, Stagger } from '../components/Motion'
import { PageHeader } from '../components/Primitives'
import { PHASES, PLAN } from '../data/plan'
import { SIGNALS, STARTERS } from '../data/patterns'
import { starterKey } from '../lib/mission'
import { shortDate } from '../lib/dates'
import { targetLabel, weekRange } from '../lib/week'

export default function Roadmap() {
  const d = useDerived()
  const planStart = useStore((s) => s.planStart)
  const checked = useStore((s) => s.roadmapChecked)
  const toggle = useStore((s) => s.toggleStarter)
  const reduce = useReducedMotion()
  const currentRef = useRef<HTMLElement>(null)
  const currentWeek = d.week.beforeStart || d.week.afterEnd ? 0 : d.week.week

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
  }, [reduce])

  return (
    <Stagger>
      <Item>
        <PageHeader title="Roadmap" kicker="12 weeks, 4 phases, about 150 problems" />
      </Item>
      {PHASES.map((phase) => (
        <Item key={phase.id}>
          <section className="mb-10" aria-label={`Phase ${phase.id}: ${phase.name}`}>
            <div className="mb-4 flex items-center gap-3">
              <span className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-lime text-lg font-extrabold text-lime">{phase.id}</span>
              <div>
                <h2 className="font-display text-2xl font-bold">{phase.name}</h2>
                <p className="text-sm text-mute">
                  Weeks {phase.weeks[0]}-{phase.weeks[1]}. {phase.blurb}
                </p>
              </div>
            </div>
            {phase.tips.length > 0 && (
              <ul className="mb-4 ml-5 list-disc space-y-1 text-sm text-mute">
                {phase.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            <ol className="relative ml-5 space-y-4 border-l border-line pl-6">
              {PLAN.filter((w) => w.phase === phase.id).map((w) => {
                const isCurrent = w.week === currentWeek
                const range = weekRange(planStart, w.week)
                return (
                  <li key={w.week} className="relative">
                    <span
                      className={`absolute -left-[31px] top-5 h-3 w-3 rounded-full border-2 ${isCurrent ? 'border-lime bg-lime shadow-glow' : 'border-line bg-bg'}`}
                      aria-hidden="true"
                    />
                    <article ref={isCurrent ? currentRef : undefined} className={`card p-5 ${isCurrent ? 'border-lime shadow-glow' : ''}`} aria-current={isCurrent ? 'step' : undefined}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-display text-xl font-bold">
                          Week {w.week}
                          {isCurrent && <span className="pill ml-3 !border-lime !text-lime">current</span>}
                        </h3>
                        <p className="font-mono text-xs text-mute">
                          {shortDate(range.start)} - {shortDate(range.end)} · target {targetLabel(w.target)}
                        </p>
                      </div>
                      {w.focus && <p className="mt-2 text-sm">{w.focus}</p>}
                      {w.patterns.map((pattern) => (
                        <div key={pattern} className="mt-4">
                          <p className="font-semibold">{pattern}</p>
                          <p className="mb-1 text-xs text-mute">Signals: {SIGNALS[pattern]}</p>
                          <ul>
                            {(STARTERS[pattern] ?? []).map((s) => {
                              const key = starterKey(pattern, s.name)
                              return (
                                <li key={key} className="flex items-center gap-1">
                                  <label className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-3 rounded-lg px-1 hover:bg-bg/60">
                                    <input type="checkbox" className="h-5 w-5 shrink-0" checked={!!checked[key]} onChange={() => toggle(key)} />
                                    <span className={`text-sm ${checked[key] ? 'text-mute line-through' : ''}`}>{s.name}</span>
                                    <span className="pill">{s.difficulty}</span>
                                  </label>
                                  <a
                                    className="btn btn-sm !px-2.5"
                                    href={`https://leetcode.com/problemset/?search=${encodeURIComponent(s.name)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`Search ${s.name} on LeetCode`}
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                    </article>
                  </li>
                )
              })}
            </ol>
          </section>
        </Item>
      ))}
    </Stagger>
  )
}
