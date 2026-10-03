import { MASTERY, NONE_MISTAKE } from './constants'
import { diffDays } from './dates'
import { weekNumber } from './week'
import { PATTERNS } from '../data/patterns'
import type { Problem } from '../store/types'

export type MasteryState = 'Untouched' | 'Learning' | 'Solid' | 'Mastered'

export const isMistake = (p: Problem): boolean => !!p.mistake && p.mistake !== NONE_MISTAKE
/** A clean solve: alone, with no mistake tagged. */
export const isClean = (p: Problem): boolean => p.solvedAlone === 'Y' && !isMistake(p)

export interface PatternStat {
  pattern: string
  logged: number
  mistaken: number
  clean: number
  cleanRate: number
  state: MasteryState
}

export function masteryState(logged: number, cleanRate: number): MasteryState {
  if (logged >= MASTERY.mastered.minLogged && cleanRate >= MASTERY.mastered.minCleanRate) return 'Mastered'
  if (logged >= MASTERY.solid.minLogged && cleanRate >= MASTERY.solid.minCleanRate) return 'Solid'
  if (logged >= MASTERY.learning.minLogged) return 'Learning'
  return 'Untouched'
}

export function patternStats(problems: Problem[]): PatternStat[] {
  const names: string[] = [...PATTERNS]
  for (const p of problems) if (!names.includes(p.pattern)) names.push(p.pattern)
  return names.map((pattern) => {
    const list = problems.filter((p) => p.pattern === pattern)
    const clean = list.filter(isClean).length
    const cleanRate = list.length ? clean / list.length : 0
    return {
      pattern,
      logged: list.length,
      mistaken: list.filter(isMistake).length,
      clean,
      cleanRate,
      state: masteryState(list.length, cleanRate),
    }
  })
}

export function problemsInWeek(problems: Problem[], planStart: string, week: number): Problem[] {
  return problems.filter((p) => weekNumber(planStart, p.date) === week)
}

export function inLastDays(problems: Problem[], today: string, days: number): Problem[] {
  return problems.filter((p) => {
    const d = diffDays(today, p.date)
    return d >= 0 && d < days
  })
}

/** Pattern with the most mistakes in the set; ties go to the lowest clean rate. */
export function weakestPattern(problems: Problem[]): string | null {
  const map = new Map<string, { mistakes: number; total: number; clean: number }>()
  for (const p of problems) {
    const e = map.get(p.pattern) ?? { mistakes: 0, total: 0, clean: 0 }
    e.total++
    if (isMistake(p) || p.solvedAlone === 'N') e.mistakes++
    if (isClean(p)) e.clean++
    map.set(p.pattern, e)
  }
  let best: string | null = null
  let bestM = 0
  let bestRate = 2
  for (const [pattern, e] of map) {
    if (e.mistakes === 0) continue
    const rate = e.clean / e.total
    if (e.mistakes > bestM || (e.mistakes === bestM && rate < bestRate)) {
      best = pattern
      bestM = e.mistakes
      bestRate = rate
    }
  }
  return best
}

export function mistakeBreakdown(problems: Problem[]): { type: string; count: number }[] {
  const map = new Map<string, number>()
  for (const p of problems) if (isMistake(p)) map.set(p.mistake, (map.get(p.mistake) ?? 0) + 1)
  return [...map.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
}

/** Total minutes per plan-aligned week for the 12 weeks ending at `endWeek`. */
export function minutesPerWeek(problems: Problem[], planStart: string, endWeek: number): number[] {
  return Array.from({ length: 12 }, (_, i) => {
    const w = endWeek - 11 + i
    return problemsInWeek(problems, planStart, w).reduce((s, p) => s + (p.minutes || 0), 0)
  })
}

export function countsByDate(problems: Problem[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const p of problems) m.set(p.date, (m.get(p.date) ?? 0) + 1)
  return m
}

export function lastLogDate(problems: Problem[]): string {
  return problems.reduce((m, p) => (p.date > m ? p.date : m), '')
}

export function idleDays(problems: Problem[], today: string): number {
  const last = lastLogDate(problems)
  return last ? Math.max(0, diffDays(today, last)) : 0
}

