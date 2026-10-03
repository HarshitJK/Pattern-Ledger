import { planPatterns, weekRange } from './week'
import { isClean, isMistake, mistakeBreakdown, problemsInWeek, weakestPattern, patternStats } from './stats'
import type { Problem } from '../store/types'

export interface ReviewSummary {
  week: number
  start: string
  end: string
  solved: number
  cleanRate: number
  minutes: number
  topMistake: string | null
  weakest: string | null
  nextFocus: string
  nextFocusReason: string
}

export function buildReview(problems: Problem[], planStart: string, week: number): ReviewSummary {
  const list = problemsInWeek(problems, planStart, week)
  const clean = list.filter(isClean).length
  const top = mistakeBreakdown(list)[0]?.type ?? null
  const weakest = weakestPattern(list)

  let nextFocus = ''
  let nextFocusReason = ''
  if (weakest) {
    nextFocus = weakest
    nextFocusReason = 'It keeps showing up in this week\'s error log. Fix it before adding new topics.'
  } else {
    const worst = patternStats(problems)
      .filter((s) => s.mistaken > 0)
      .sort((a, b) => b.mistaken - a.mistaken)[0]
    if (worst) {
      nextFocus = worst.pattern
      nextFocusReason = 'No mistakes this week, but this pattern has the most mistakes overall.'
    } else {
      nextFocus = planPatterns(week + 1).join(' + ') || 'Mixed review'
      nextFocusReason = 'No recurring mistakes yet. Continue with the roadmap.'
    }
  }

  return {
    week,
    ...weekRange(planStart, week),
    solved: list.length,
    cleanRate: list.length ? clean / list.length : 0,
    minutes: list.reduce((s, p) => s + (p.minutes || 0), 0),
    topMistake: top,
    weakest: list.some(isMistake) ? weakest : null,
    nextFocus,
    nextFocusReason,
  }
}
