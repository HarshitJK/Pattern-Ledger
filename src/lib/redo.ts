import { REDO_AFTER_CLEAN_DAYS, REDO_AFTER_STUCK_DAYS } from './constants'
import { addDaysStr } from './dates'
import type { Problem } from '../store/types'

/** Redo date suggested when logging: +3 days if not solved alone, +14 if solved alone. */
export function suggestRedoDate(date: string, solvedAlone: 'Y' | 'N'): string {
  return addDaysStr(date, solvedAlone === 'Y' ? REDO_AFTER_CLEAN_DAYS : REDO_AFTER_STUCK_DAYS)
}

/**
 * Apply the result of a redo.
 * Clean: +14 days after the first clean redo, mastered after the second clean redo.
 * Stuck: back to +3 days.
 */
export function applyRedo(p: Problem, clean: boolean, today: string): Problem {
  const redos = [...p.redos, { date: today, clean }]
  if (!clean) {
    return { ...p, redos, mastered: false, redoDate: addDaysStr(today, REDO_AFTER_STUCK_DAYS) }
  }
  const cleanCount = redos.filter((r) => r.clean).length
  if (cleanCount >= 2) return { ...p, redos, mastered: true, redoDate: '' }
  return { ...p, redos, mastered: false, redoDate: addDaysStr(today, REDO_AFTER_CLEAN_DAYS) }
}

export interface RedoGroups {
  overdue: Problem[]
  dueToday: Problem[]
  upcoming: Problem[]
}

export function redoGroups(problems: Problem[], today: string): RedoGroups {
  const scheduled = problems.filter((p) => !p.mastered && p.redoDate)
  const byDate = (a: Problem, b: Problem) => a.redoDate.localeCompare(b.redoDate)
  return {
    overdue: scheduled.filter((p) => p.redoDate < today).sort(byDate),
    dueToday: scheduled.filter((p) => p.redoDate === today).sort(byDate),
    upcoming: scheduled.filter((p) => p.redoDate > today).sort(byDate),
  }
}
