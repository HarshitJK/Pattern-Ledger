import { PLAN } from '../data/plan'
import { STARTERS } from '../data/patterns'
import { hashStr } from './dates'
import { inLastDays, weakestPattern } from './stats'
import { redoGroups } from './redo'
import type { Problem } from '../store/types'

export const starterKey = (pattern: string, name: string): string => `${pattern}|${name}`

export interface Mission {
  kind: 'overdue' | 'due' | 'weak' | 'roadmap' | 'done'
  title: string
  detail: string
  pattern?: string
  problemName?: string
  to: string
  cta: string
}

/** First unchecked starter problem, scanning from the current plan week and wrapping to week 1. */
export function nextRoadmapItem(
  checked: Record<string, boolean>,
  currentWeek: number,
): { pattern: string; name: string } | null {
  const order = [...PLAN.slice(currentWeek - 1), ...PLAN.slice(0, currentWeek - 1)]
  for (const w of order) {
    for (const pattern of w.patterns) {
      for (const s of STARTERS[pattern] ?? []) {
        if (!checked[starterKey(pattern, s.name)]) return { pattern, name: s.name }
      }
    }
  }
  return null
}

export function pickMission(
  problems: Problem[],
  checked: Record<string, boolean>,
  today: string,
  clampedWeek: number,
): Mission {
  const g = redoGroups(problems, today)
  if (g.overdue.length) {
    const p = g.overdue[0]
    return {
      kind: 'overdue',
      title: `Redo "${p.name}"`,
      detail: `${g.overdue.length} redo${g.overdue.length > 1 ? 's' : ''} overdue. Start with the oldest, no peeking.`,
      pattern: p.pattern,
      problemName: p.name,
      to: '/redo',
      cta: 'Open redo queue',
    }
  }
  if (g.dueToday.length) {
    const p = g.dueToday[0]
    return {
      kind: 'due',
      title: `Redo "${p.name}" today`,
      detail: 'Due today. Solve it fresh and see whether the pattern stuck.',
      pattern: p.pattern,
      problemName: p.name,
      to: '/redo',
      cta: 'Open redo queue',
    }
  }
  const weak = weakestPattern(inLastDays(problems, today, 14))
  if (weak) {
    const starter = (STARTERS[weak] ?? [])[0]
    return {
      kind: 'weak',
      title: `Drill ${weak}`,
      detail: 'Most trouble in the last 14 days. One more rep with the full checklist.',
      pattern: weak,
      problemName: starter?.name,
      to: '/session',
      cta: 'Start a session',
    }
  }
  const next = nextRoadmapItem(checked, clampedWeek)
  if (next) {
    return {
      kind: 'roadmap',
      title: `${next.name}`,
      detail: `Next on the roadmap: ${next.pattern}.`,
      pattern: next.pattern,
      problemName: next.name,
      to: '/session',
      cta: 'Start a session',
    }
  }
  return {
    kind: 'done',
    title: 'Roadmap complete',
    detail: 'Every starter problem is checked. Do timed mocks on your weakest pattern.',
    to: '/review',
    cta: 'Open review',
  }
}

const EASY_RESTART = [
  { pattern: 'Two Pointers', name: 'Valid Palindrome' },
  { pattern: 'Hashing/Prefix Sum', name: 'Two Sum' },
  { pattern: 'Stack (Monotonic)', name: 'Valid Parentheses' },
  { pattern: 'Fast & Slow Pointers', name: 'Linked List Cycle' },
  { pattern: 'DP (1D)', name: 'Climbing Stairs' },
  { pattern: 'Tree DFS/BFS', name: 'Path Sum' },
]

/** One easy problem for the welcome-back screen, stable for the day. */
export function easyRestart(today: string): { pattern: string; name: string } {
  return EASY_RESTART[hashStr(today) % EASY_RESTART.length]
}
