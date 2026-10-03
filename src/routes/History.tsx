import { Fragment, useMemo, useState, type KeyboardEvent } from 'react'
import { ArrowDown, ArrowUp, Pencil, Search, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { useUI } from '../store/ui'
import { Item, Stagger } from '../components/Motion'
import { PageHeader } from '../components/Primitives'
import { ProblemForm, type ProblemValues } from '../components/ProblemForm'
import { DIFFICULTIES, MISTAKE_TYPES, PATTERN_OPTIONS } from '../data/patterns'
import { prettyDate, shortDate } from '../lib/dates'
import type { Problem } from '../store/types'

type SortKey = 'date' | 'name' | 'pattern' | 'difficulty' | 'solvedAlone' | 'mistake' | 'minutes' | 'redoDate'

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'name', label: 'Problem' },
  { key: 'pattern', label: 'Pattern' },
  { key: 'difficulty', label: 'Diff' },
  { key: 'solvedAlone', label: 'Alone' },
  { key: 'mistake', label: 'Mistake' },
  { key: 'minutes', label: 'Min', className: 'text-right' },
  { key: 'redoDate', label: 'Redo' },
]

const DIFF_ORDER: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 }

function compare(a: Problem, b: Problem, key: SortKey): number {
  if (key === 'minutes') return a.minutes - b.minutes
  if (key === 'difficulty') return (DIFF_ORDER[a.difficulty] ?? 9) - (DIFF_ORDER[b.difficulty] ?? 9)
  return String(a[key]).localeCompare(String(b[key]), undefined, { sensitivity: 'base' })
}

const toValues = (p: Problem): ProblemValues => ({
  date: p.date,
  name: p.name,
  lcNumber: p.lcNumber,
  pattern: p.pattern,
  difficulty: p.difficulty,
  solvedAlone: p.solvedAlone,
  mistake: p.mistake,
  minutes: p.minutes,
  redoDate: p.redoDate,
  notes: p.notes,
})

export default function History() {
  const problems = useStore((s) => s.problems)
  const updateProblem = useStore((s) => s.updateProblem)
  const deleteProblem = useStore((s) => s.deleteProblem)
  const restoreProblem = useStore((s) => s.restoreProblem)
  const toast = useUI((s) => s.toast)

  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'date', dir: -1 })
  const [f, setF] = useState({ pattern: '', difficulty: '', mistake: '', alone: '', from: '', to: '', q: '' })
  const [editing, setEditing] = useState<string | null>(null)

  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    return problems
      .filter(
        (p) =>
          (!f.pattern || p.pattern === f.pattern) &&
          (!f.difficulty || p.difficulty === f.difficulty) &&
          (!f.mistake || p.mistake === f.mistake) &&
          (!f.alone || p.solvedAlone === f.alone) &&
          (!f.from || p.date >= f.from) &&
          (!f.to || p.date <= f.to) &&
          (!q || `${p.name} ${p.lcNumber} ${p.notes} ${p.pattern}`.toLowerCase().includes(q)),
      )
      .sort((a, b) => compare(a, b, sort.key) * sort.dir || b.date.localeCompare(a.date))
  }, [problems, f, sort])

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === 'date' || key === 'minutes' ? -1 : 1 }))

  const remove = (p: Problem) => {
    deleteProblem(p.id)
    if (editing === p.id) setEditing(null)
    toast(`Deleted "${p.name}"`, { label: 'Undo', run: () => restoreProblem(p) })
  }

  const save = (p: Problem, v: ProblemValues) => {
    updateProblem(p.id, v)
    setEditing(null)
    toast('Saved')
  }

  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, p: Problem) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const next = e.key === 'ArrowDown'
      let el = next ? e.currentTarget.nextElementSibling : e.currentTarget.previousElementSibling
      while (el && !el.matches('tr[data-row]')) el = next ? el.nextElementSibling : el.previousElementSibling
      ;(el as HTMLElement | null)?.focus()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      setEditing(p.id)
    }
  }

  const sel = (k: keyof typeof f, label: string, options: readonly string[]) => (
    <select aria-label={label} className="input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}>
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  )

  return (
    <Stagger>
      <Item>
        <PageHeader title="History" kicker={`${rows.length} of ${problems.length} problems`} />
      </Item>

      <Item>
        <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" aria-hidden="true" />
            <input
              aria-label="Search problems"
              className="input !pl-9"
              placeholder="Search name, number, notes"
              value={f.q}
              onChange={(e) => setF({ ...f, q: e.target.value })}
            />
          </div>
          {sel('pattern', 'All patterns', PATTERN_OPTIONS)}
          {sel('difficulty', 'All difficulties', DIFFICULTIES)}
          {sel('mistake', 'All mistakes', MISTAKE_TYPES)}
          {sel('alone', 'Solved alone: any', ['Y', 'N'])}
          <input aria-label="From date" type="date" className="input font-mono" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
          <input aria-label="To date" type="date" className="input font-mono" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
        </div>
      </Item>

      <Item>
        {rows.length === 0 ? (
          <div className="card p-10 text-center text-mute">No problems match. Loosen a filter or log a new one.</div>
        ) : (
          <>
            <div className="card hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    {COLUMNS.map((c) => (
                      <th
                        key={c.key}
                        scope="col"
                        aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
                        className={`px-3 py-2 ${c.className ?? ''}`}
                      >
                        <button type="button" onClick={() => toggleSort(c.key)} className="kicker inline-flex min-h-[36px] items-center gap-1 hover:text-ink">
                          {c.label}
                          {sort.key === c.key && (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                        </button>
                      </th>
                    ))}
                    <th scope="col" className="px-3 py-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <Fragment key={p.id}>
                      <tr
                        data-row
                        tabIndex={0}
                        onKeyDown={(e) => onRowKey(e, p)}
                        className="border-b border-line/60 outline-offset-[-2px] transition-colors hover:bg-bg/60 focus-visible:bg-bg/60"
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{shortDate(p.date)}</td>
                        <td className="max-w-[260px] px-3 py-2.5">
                          <span className="font-semibold">{p.name}</span>
                          {p.lcNumber && <span className="ml-2 font-mono text-xs text-mute">#{p.lcNumber}</span>}
                          {p.mastered && <span className="pill ml-2 !border-lime/50 !text-lime">mastered</span>}
                        </td>
                        <td className="px-3 py-2.5">{p.pattern}</td>
                        <td className="px-3 py-2.5">{p.difficulty || '-'}</td>
                        <td className={`px-3 py-2.5 font-mono ${p.solvedAlone === 'Y' ? 'text-lime' : 'text-ember'}`}>{p.solvedAlone}</td>
                        <td className="px-3 py-2.5 text-mute">{p.mistake || '-'}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{p.minutes}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{p.redoDate ? shortDate(p.redoDate) : '-'}</td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-right">
                          <button type="button" aria-label={`Edit ${p.name}`} className="btn btn-sm !px-2.5" onClick={() => setEditing(editing === p.id ? null : p.id)}>
                            <Pencil size={14} />
                          </button>{' '}
                          <button type="button" aria-label={`Delete ${p.name}`} className="btn btn-sm !px-2.5 hover:!border-ember hover:!text-ember" onClick={() => remove(p)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                      {editing === p.id && (
                        <tr className="border-b border-line bg-bg/40">
                          <td colSpan={COLUMNS.length + 1} className="p-4">
                            <ProblemForm initial={toValues(p)} submitLabel="Save changes" onSubmit={(v) => save(p, v)} onCancel={() => setEditing(null)} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3 md:hidden">
              {rows.map((p) => (
                <li key={p.id} className="card p-4">
                  {editing === p.id ? (
                    <ProblemForm initial={toValues(p)} submitLabel="Save changes" onSubmit={(v) => save(p, v)} onCancel={() => setEditing(null)} />
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold leading-snug">{p.name}</p>
                          <p className="mt-0.5 font-mono text-xs text-mute">
                            {prettyDate(p.date)}
                            {p.lcNumber && ` · #${p.lcNumber}`}
                          </p>
                        </div>
                        <span className={`pill shrink-0 ${p.solvedAlone === 'Y' ? '!border-lime/50 !text-lime' : '!border-ember/50 !text-ember'}`}>
                          {p.solvedAlone === 'Y' ? 'alone' : 'helped'}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="pill">{p.pattern}</span>
                        {p.difficulty && <span className="pill">{p.difficulty}</span>}
                        <span className="pill">{p.minutes} min</span>
                        {p.redoDate && <span className="pill">redo {shortDate(p.redoDate)}</span>}
                      </div>
                      {p.mistake && <p className="mt-2 text-sm text-mute">{p.mistake}</p>}
                      <div className="mt-3 flex gap-2">
                        <button type="button" className="btn btn-sm" onClick={() => setEditing(p.id)}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button type="button" className="btn btn-sm hover:!border-ember hover:!text-ember" onClick={() => remove(p)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </Item>
    </Stagger>
  )
}
