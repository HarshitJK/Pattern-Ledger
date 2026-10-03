import { QUOTES, type Situation } from '../data/quotes'
import { IDLE_DAYS_WELCOME } from './constants'
import { hashStr } from './dates'
import type { StreakInfo } from './streak'

export interface MotivationContext {
  today: string
  isSunday: boolean
  hasLogs: boolean
  idle: number
  streak: StreakInfo
  overdueRedos: number
  lastLogHard: boolean
}

export function pickSituation(c: MotivationContext): Situation {
  if (!c.hasLogs) return 'general'
  if (c.idle >= IDLE_DAYS_WELCOME) return 'returning'
  if (c.isSunday) return 'sunday'
  if (c.overdueRedos > 0) return 'redoOverdue'
  if (c.lastLogHard && c.streak.loggedToday) return 'hardProblem'
  if (c.streak.active) return 'streakAlive'
  if (c.streak.longest > 0) return 'streakBroken'
  return 'general'
}

/** Deterministic by day and situation, so re-renders never change the line. */
export function pickQuote(situation: Situation, today: string): string {
  const list = QUOTES[situation]
  return list[hashStr(`${today}:${situation}`) % list.length]
}
