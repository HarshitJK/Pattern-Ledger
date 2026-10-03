import { PHASES, PLAN, targetForWeek } from '../data/plan'
import { PLAN_WEEKS } from './constants'
import { addDaysStr, diffDays } from './dates'

export interface WeekInfo {
  /** 1-based plan week; 0 or negative before the plan starts. */
  week: number
  /** Clamped to 1..12 for plan lookups. */
  clamped: number
  phaseId: number
  phaseName: string
  beforeStart: boolean
  afterEnd: boolean
  target: { min: number; max: number }
  start: string
  end: string
}

export function weekNumber(planStart: string, date: string): number {
  return Math.floor(diffDays(date, planStart) / 7) + 1
}

export function weekRange(planStart: string, week: number): { start: string; end: string } {
  const start = addDaysStr(planStart, (week - 1) * 7)
  return { start, end: addDaysStr(start, 6) }
}

export function getWeekInfo(planStart: string, date: string): WeekInfo {
  const week = weekNumber(planStart, date)
  const clamped = Math.min(PLAN_WEEKS, Math.max(1, week))
  const phase = PHASES.find((p) => clamped >= p.weeks[0] && clamped <= p.weeks[1]) ?? PHASES[0]
  return {
    week,
    clamped,
    phaseId: phase.id,
    phaseName: phase.name,
    beforeStart: week < 1,
    afterEnd: week > PLAN_WEEKS,
    target: targetForWeek(clamped),
    ...weekRange(planStart, week),
  }
}

export function planPatterns(week: number): string[] {
  return PLAN[Math.min(PLAN_WEEKS, Math.max(1, week)) - 1].patterns
}

export function targetLabel(t: { min: number; max: number }): string {
  return t.min === t.max ? String(t.min) : `${t.min}-${t.max}`
}
