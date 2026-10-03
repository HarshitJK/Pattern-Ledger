import { addDaysStr } from './dates'

export interface StreakInfo {
  current: number
  longest: number
  loggedToday: boolean
  /** Current streak is still alive (logged today or yesterday). */
  active: boolean
}

/** Consecutive days with at least one log. The streak survives until the end of the day after the last log. */
export function computeStreaks(dates: string[], today: string): StreakInfo {
  const days = Array.from(new Set(dates)).sort()
  const set = new Set(days)

  let longest = 0
  let run = 0
  let prev = ''
  for (const d of days) {
    run = prev && addDaysStr(prev, 1) === d ? run + 1 : 1
    if (run > longest) longest = run
    prev = d
  }

  const loggedToday = set.has(today)
  let cursor = loggedToday ? today : addDaysStr(today, -1)
  let current = 0
  while (set.has(cursor)) {
    current++
    cursor = addDaysStr(cursor, -1)
  }

  return { current, longest, loggedToday, active: current > 0 }
}
