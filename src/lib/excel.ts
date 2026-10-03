import { DIFFICULTIES, MISTAKE_TYPES, PATTERN_OPTIONS } from '../data/patterns'
import { excelSerialToDateStr, fmt, isValidDateStr } from './dates'
import { uid } from './id'
import { patternStats } from './stats'
import { isValid } from 'date-fns'
import type { Problem } from '../store/types'

export const HEADERS = [
  'Date',
  'Problem Name',
  'LeetCode #',
  'Pattern',
  'Difficulty',
  'Solved Alone? (Y/N)',
  'Mistake Type',
  'Time Spent (min)',
  'Redo Date',
  'Notes',
] as const

type Field =
  | 'date'
  | 'name'
  | 'lcNumber'
  | 'pattern'
  | 'difficulty'
  | 'solvedAlone'
  | 'mistake'
  | 'minutes'
  | 'redoDate'
  | 'notes'

const squash = (s: unknown): string => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')

/** Map a header cell to a field by its text, so column order does not matter. */
export function headerField(h: unknown): Field | null {
  const k = squash(h)
  if (k === 'date') return 'date'
  if (k.startsWith('problem')) return 'name'
  if (k.startsWith('leetcode')) return 'lcNumber'
  if (k === 'pattern') return 'pattern'
  if (k === 'difficulty') return 'difficulty'
  if (k.startsWith('solved')) return 'solvedAlone'
  if (k.startsWith('mistake')) return 'mistake'
  if (k.startsWith('time')) return 'minutes'
  if (k.startsWith('redo')) return 'redoDate'
  if (k === 'notes') return 'notes'
  return null
}

/** Normalise a date cell: Excel serial, ISO string, Date object, or junk (returns ''). */
export function normalizeDate(v: unknown): string {
  if (v instanceof Date) return isValid(v) ? fmt(v) : ''
  if (typeof v === 'number') return v > 20000 && v < 80000 ? excelSerialToDateStr(v) : ''
  const s = String(v ?? '').trim()
  if (!s || s === '0') return ''
  if (/^\d{5}(\.\d+)?$/.test(s)) return excelSerialToDateStr(parseFloat(s))
  const iso = s.slice(0, 10).replace(/\//g, '-')
  if (isValidDateStr(iso)) return iso
  const d = new Date(s)
  return isValid(d) ? fmt(d) : ''
}

export function normalizeLcNumber(v: unknown): string {
  if (typeof v === 'number') return Number.isFinite(v) ? String(Math.trunc(v)) : ''
  return String(v ?? '').trim()
}

const matchList = (v: unknown, list: readonly string[]): string => {
  const s = String(v ?? '').trim()
  if (!s) return ''
  const k = squash(s)
  return list.find((x) => squash(x) === k) ?? ''
}

export function normalizeRow(raw: Partial<Record<Field, unknown>>): { problem: Problem | null; reason?: string } {
  const name = String(raw.name ?? '').trim()
  if (!name) return { problem: null, reason: 'empty' }
  const date = normalizeDate(raw.date)
  if (!date) return { problem: null, reason: 'bad date' }
  const sa = squash(raw.solvedAlone)
  const mistakeRaw = String(raw.mistake ?? '').trim()
  const minutes = Math.max(0, Math.round(parseFloat(String(raw.minutes ?? '')) || 0))
  return {
    problem: {
      id: uid(),
      date,
      name,
      lcNumber: normalizeLcNumber(raw.lcNumber),
      pattern: matchList(raw.pattern, PATTERN_OPTIONS) || 'Other',
      difficulty: matchList(raw.difficulty, DIFFICULTIES),
      solvedAlone: sa === 'y' || sa === 'yes' || sa === 'true' ? 'Y' : 'N',
      mistake: matchList(mistakeRaw, MISTAKE_TYPES) || mistakeRaw,
      minutes,
      redoDate: normalizeDate(raw.redoDate),
      notes: String(raw.notes ?? '').trim(),
      redos: [],
      mastered: false,
    },
  }
}

export const dedupeKey = (p: { date: string; name: string }): string => `${p.date}|${p.name.trim().toLowerCase()}`

export interface ImportPlan {
  fresh: Problem[]
  duplicates: number
  skipped: number
  badDates: number
  total: number
}

/** Turn a matrix of cells (header row + data) into a de-duplicated import plan. */
export function planImport(rows: unknown[][], existing: Problem[]): ImportPlan {
  const headerIdx = rows.findIndex((r) => r.filter((c) => headerField(c)).length >= 3)
  if (headerIdx < 0) throw new Error('Could not find a header row with Date, Problem Name, Pattern columns.')
  const cols = rows[headerIdx].map(headerField)
  const seen = new Set(existing.map(dedupeKey))
  const fresh: Problem[] = []
  let duplicates = 0
  let skipped = 0
  let badDates = 0
  for (const r of rows.slice(headerIdx + 1)) {
    const raw: Partial<Record<Field, unknown>> = {}
    cols.forEach((f, i) => {
      if (f) raw[f] = r[i]
    })
    const { problem, reason } = normalizeRow(raw)
    if (!problem) {
      if (reason === 'bad date') badDates++
      else skipped++
      continue
    }
    const key = dedupeKey(problem)
    if (seen.has(key)) {
      duplicates++
      continue
    }
    seen.add(key)
    fresh.push(problem)
  }
  return { fresh, duplicates, skipped, badDates, total: fresh.length + duplicates + badDates }
}

/** SheetJS is large, so it loads only when an import or export is actually used. */
const loadXlsx = () => import('xlsx')

export async function readWorkbookRows(file: File): Promise<unknown[][]> {
  const XLSX = await loadXlsx()
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const name = wb.SheetNames.find((n) => n.toLowerCase().includes('error')) ?? wb.SheetNames[0]
  return XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, raw: true, defval: '' })
}

export async function buildWorkbook(problems: Problem[]): Promise<ArrayBuffer> {
  const XLSX = await loadXlsx()
  const sorted = [...problems].sort((a, b) => a.date.localeCompare(b.date))
  const log = [
    [...HEADERS],
    ...sorted.map((p) => [
      p.date,
      p.name,
      /^\d+$/.test(p.lcNumber) ? Number(p.lcNumber) : p.lcNumber,
      p.pattern,
      p.difficulty,
      p.solvedAlone,
      p.mistake,
      p.minutes,
      p.redoDate,
      p.notes,
    ]),
  ]
  const summary = [
    ['Pattern', 'Times Logged', 'Times Mistaken'],
    ...patternStats(problems).map((s) => [s.pattern, s.logged, s.mistaken]),
    ['TOTAL', problems.length, problems.filter((p) => p.mistake && p.mistake !== 'none - solved cleanly').length],
  ]
  const wb = XLSX.utils.book_new()
  const ws1 = XLSX.utils.aoa_to_sheet(log)
  ws1['!cols'] = [12, 44, 12, 22, 11, 18, 28, 16, 12, 50].map((wch) => ({ wch }))
  const ws2 = XLSX.utils.aoa_to_sheet(summary)
  ws2['!cols'] = [24, 15, 16].map((wch) => ({ wch }))
  XLSX.utils.book_append_sheet(wb, ws1, 'Error Log')
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary')
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
}

