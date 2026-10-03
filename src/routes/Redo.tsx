import { Link } from 'react-router-dom'
import { Check, ExternalLink, RotateCcw } from 'lucide-react'
import { useStore } from '../store'
import { useUI } from '../store/ui'
import { useDerived } from '../hooks'
import { Item, Stagger } from '../components/Motion'
import { PageHeader } from '../components/Primitives'
import { diffDays, shortDate } from '../lib/dates'
import type { Problem } from '../store/types'

function RedoItem({ p, today, tone }: { p: Problem; today: string; tone: 'overdue' | 'today' | 'upcoming' }) {
  const redo = useStore((s) => s.redo)
  const toast = useUI((s) => s.toast)
  const late = diffDays(today, p.redoDate)

  const act = (clean: boolean) => {
    redo(p.id, clean, today)
    toast(clean ? (p.redos.some((r) => r.clean) ? `Mastered "${p.name}"` : `Clean redo. Next in 14 days.`) : 'Still stuck. Back in 3 days.')
  }

  return (
    <li className={`card p-4 ${tone === 'overdue' ? 'border-ember/70' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{p.name}</p>
          <p className="mt-0.5 flex flex-wrap gap-x-3 font-mono text-xs text-mute">
            <span>{p.pattern}</span>
            <span>first solved {shortDate(p.date)}</span>
            <span>{p.redos.length} redo{p.redos.length === 1 ? '' : 's'}</span>
          </p>
        </div>
        <span className={`pill ${tone === 'overdue' ? '!border-ember !text-ember' : tone === 'today' ? '!border-lime !text-lime' : ''}`}>
          {tone === 'overdue' ? `${late} day${late === 1 ? '' : 's'} overdue` : tone === 'today' ? 'due today' : `in ${-late} day${late === -1 ? '' : 's'}`}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => act(true)}>
          <Check size={15} /> Redone, solved alone
        </button>
        <button type="button" className="btn btn-sm hover:!border-ember hover:!text-ember" onClick={() => act(false)}>
          <RotateCcw size={15} /> Redone, still stuck
        </button>
        <a
          className="btn btn-sm ml-auto"
          href={`https://leetcode.com/problemset/?search=${encodeURIComponent(p.lcNumber && /^\d+$/.test(p.lcNumber) ? p.lcNumber : p.name)}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${p.name} on LeetCode`}
        >
          <ExternalLink size={14} /> LeetCode
        </a>
      </div>
      {p.redos.length > 0 && (
        <p className="mt-2 font-mono text-[11px] text-mute">
          History: {p.redos.map((r) => `${shortDate(r.date)} ${r.clean ? 'clean' : 'stuck'}`).join(' · ')}
        </p>
      )}
    </li>
  )
}

function Group({ title, tone, items, today, empty }: { title: string; tone: 'overdue' | 'today' | 'upcoming'; items: Problem[]; today: string; empty: string }) {
  const color = tone === 'overdue' ? 'text-ember' : tone === 'today' ? 'text-lime' : 'text-ice'
  return (
    <Item>
      <section className="mb-8" aria-label={title}>
        <h2 className={`font-display mb-3 flex items-center gap-2 text-xl font-bold ${color}`}>
          {title}
          <span className="pill">{items.length}</span>
        </h2>
        {items.length === 0 ? (
          <p className="card p-4 text-sm text-mute">{empty}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((p) => (
              <RedoItem key={p.id} p={p} today={today} tone={tone} />
            ))}
          </ul>
        )}
      </section>
    </Item>
  )
}

export default function Redo() {
  const d = useDerived()
  const masteredCount = useStore((s) => s.problems.filter((p) => p.mastered).length)
  const { overdue, dueToday, upcoming } = d.groups
  return (
    <Stagger>
      <Item>
        <PageHeader title="Redo queue" kicker="Spaced repetition: 3 days, then 2 weeks">
          <span className="pill !border-lime/50 !text-lime">{masteredCount} mastered</span>
        </PageHeader>
      </Item>
      <Group title="Overdue" tone="overdue" items={overdue} today={d.today} empty="Nothing overdue. Nicely kept." />
      <Group title="Due today" tone="today" items={dueToday} today={d.today} empty="No redos due today." />
      <Group title="Upcoming" tone="upcoming" items={upcoming} today={d.today} empty="Nothing scheduled. Log a problem to create a redo." />
      <Item>
        <p className="text-sm text-mute">
          Problems without a redo date are not queued. Add one from <Link className="text-lime underline" to="/history">History</Link>.
        </p>
      </Item>
    </Stagger>
  )
}
