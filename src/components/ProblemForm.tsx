import { useState, type FormEvent } from 'react'
import { DIFFICULTIES, MISTAKE_TYPES, PATTERN_OPTIONS } from '../data/patterns'
import { isValidDateStr } from '../lib/dates'
import { suggestRedoDate } from '../lib/redo'
import { Field } from './Primitives'
import type { Problem } from '../store/types'

export type ProblemValues = Omit<Problem, 'id' | 'redos' | 'mastered'>

type Errors = Partial<Record<keyof ProblemValues, string>>

export function validate(v: ProblemValues): Errors {
  const e: Errors = {}
  if (!isValidDateStr(v.date)) e.date = 'Pick a valid date.'
  if (!v.name.trim()) e.name = 'Problem name is required.'
  if (v.lcNumber.length > 60) e.lcNumber = 'Keep this under 60 characters.'
  if (!v.pattern) e.pattern = 'Choose the pattern. Naming it is the habit.'
  if (!v.difficulty) e.difficulty = 'Choose a difficulty.'
  if (!Number.isFinite(v.minutes) || v.minutes < 0 || v.minutes > 600) e.minutes = 'Enter minutes between 0 and 600.'
  if (v.redoDate && !isValidDateStr(v.redoDate)) e.redoDate = 'Pick a valid date or clear it.'
  else if (v.redoDate && isValidDateStr(v.date) && v.redoDate < v.date) e.redoDate = 'Redo cannot be before the solve date.'
  return e
}

export function ProblemForm({
  initial,
  autoRedo = false,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: ProblemValues
  autoRedo?: boolean
  submitLabel: string
  onSubmit: (v: ProblemValues) => void
  onCancel?: () => void
}) {
  const [v, setV] = useState<ProblemValues>(initial)
  const [redoTouched, setRedoTouched] = useState(!autoRedo)
  const [errors, setErrors] = useState<Errors>({})
  const [minutesText, setMinutesText] = useState(String(initial.minutes))

  const set = <K extends keyof ProblemValues>(k: K, val: ProblemValues[K]) =>
    setV((cur) => {
      const next = { ...cur, [k]: val }
      if (autoRedo && !redoTouched && (k === 'date' || k === 'solvedAlone') && isValidDateStr(next.date)) {
        next.redoDate = suggestRedoDate(next.date, next.solvedAlone)
      }
      return next
    })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const clean = { ...v, name: v.name.trim(), lcNumber: v.lcNumber.trim(), notes: v.notes.trim() }
    const errs = validate(clean)
    setErrors(errs)
    if (Object.keys(errs).length === 0) onSubmit(clean)
  }

  const mistakes = MISTAKE_TYPES.includes(v.mistake) || !v.mistake ? MISTAKE_TYPES : [...MISTAKE_TYPES, v.mistake]
  const patterns = PATTERN_OPTIONS.includes(v.pattern) || !v.pattern ? PATTERN_OPTIONS : [...PATTERN_OPTIONS, v.pattern]

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="lg:col-span-2">
        <Field label="Date" error={errors.date}>
          {(id, d) => (
            <input id={id} aria-describedby={d} aria-invalid={!!errors.date} type="date" className="input font-mono" value={v.date} onChange={(e) => set('date', e.target.value)} />
          )}
        </Field>
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <Field label="Problem name" error={errors.name}>
          {(id, d) => (
            <input id={id} aria-describedby={d} aria-invalid={!!errors.name} className="input" value={v.name} placeholder="Longest Substring Without Repeating Characters" onChange={(e) => set('name', e.target.value)} />
          )}
        </Field>
      </div>
      <div className="lg:col-span-1">
        <Field label="LeetCode #" error={errors.lcNumber}>
          {(id, d) => (
            <input id={id} aria-describedby={d} aria-invalid={!!errors.lcNumber} className="input font-mono" value={v.lcNumber} placeholder="3" onChange={(e) => set('lcNumber', e.target.value)} />
          )}
        </Field>
      </div>

      <div className="lg:col-span-2">
        <Field label="Pattern" error={errors.pattern}>
          {(id, d) => (
            <select id={id} aria-describedby={d} aria-invalid={!!errors.pattern} className="input" value={v.pattern} onChange={(e) => set('pattern', e.target.value)}>
              <option value="">Select pattern</option>
              {patterns.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="lg:col-span-2">
        <Field label="Difficulty" error={errors.difficulty}>
          {(id, d) => (
            <select id={id} aria-describedby={d} aria-invalid={!!errors.difficulty} className="input" value={v.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
              <option value="">Select difficulty</option>
              {DIFFICULTIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="lg:col-span-2">
        <span className="label" id="alone-label">
          Solved alone?
        </span>
        <div role="radiogroup" aria-labelledby="alone-label" className="grid grid-cols-2 gap-2">
          {(['Y', 'N'] as const).map((x) => (
            <button
              key={x}
              type="button"
              role="radio"
              aria-checked={v.solvedAlone === x}
              onClick={() => set('solvedAlone', x)}
              className={`btn ${v.solvedAlone === x ? (x === 'Y' ? 'btn-primary' : 'border-ember text-ember') : 'text-mute'}`}
            >
              {x === 'Y' ? 'Y - alone' : 'N - needed help'}
            </button>
          ))}
        </div>
      </div>

      <div className="sm:col-span-2 lg:col-span-3">
        <Field label="Mistake type">
          {(id) => (
            <select id={id} className="input" value={v.mistake} onChange={(e) => set('mistake', e.target.value)}>
              <option value="">None tagged</option>
              {mistakes.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="lg:col-span-1">
        <Field label="Minutes" error={errors.minutes}>
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              aria-invalid={!!errors.minutes}
              inputMode="numeric"
              className="input font-mono"
              value={minutesText}
              onChange={(e) => {
                setMinutesText(e.target.value)
                set('minutes', e.target.value === '' ? NaN : Number(e.target.value))
              }}
            />
          )}
        </Field>
      </div>
      <div className="lg:col-span-2">
        <Field
          label="Redo date"
          error={errors.redoDate}
          hint={autoRedo ? (v.solvedAlone === 'Y' ? 'Suggested +14 days.' : 'Suggested +3 days.') : undefined}
        >
          {(id, d) => (
            <input
              id={id}
              aria-describedby={d}
              aria-invalid={!!errors.redoDate}
              type="date"
              className="input font-mono"
              value={v.redoDate}
              onChange={(e) => {
                setRedoTouched(true)
                set('redoDate', e.target.value)
              }}
            />
          )}
        </Field>
      </div>

      <div className="sm:col-span-2 lg:col-span-6">
        <Field label="Notes">
          {(id) => (
            <textarea id={id} rows={2} className="input py-2" value={v.notes} placeholder="What broke? What was the trick?" onChange={(e) => set('notes', e.target.value)} />
          )}
        </Field>
      </div>

      <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-6">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
