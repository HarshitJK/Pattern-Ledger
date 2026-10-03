export const GOAL_TOTAL = 150
export const PLAN_WEEKS = 12
export const DEFAULT_PLAN_START = '2026-08-03'
export const REDO_AFTER_STUCK_DAYS = 3
export const REDO_AFTER_CLEAN_DAYS = 14
export const HINT_LOCK_MIN = 25
export const SESSION_MIN = { min: 25, max: 45, default: 30 }
export const STREAK_NUDGE_HOUR = 18
export const IDLE_DAYS_WELCOME = 3
export const MILESTONE_COUNTS = [1, 10, 25, 50, 100, 150]
export const MILESTONE_STREAKS = [7, 30]

/** Mastery thresholds, one place. A tile is judged on logged count and clean-solve rate. */
export const MASTERY = {
  learning: { minLogged: 1 },
  solid: { minLogged: 3, minCleanRate: 0.6 },
  mastered: { minLogged: 5, minCleanRate: 0.8 },
} as const

export const MASTERY_HELP =
  'Untouched: 0 logged. Learning: 1+ logged. Solid: 3+ logged and 60%+ clean. Mastered: 5+ logged and 80%+ clean.'

export const NONE_MISTAKE = 'none - solved cleanly'
