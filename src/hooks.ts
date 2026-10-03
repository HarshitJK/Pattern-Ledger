import { useEffect, useMemo, useState } from 'react'
import { useStore } from './store'
import { todayStr, isSunday } from './lib/dates'
import { computeStreaks } from './lib/streak'
import { getWeekInfo } from './lib/week'
import { problemsInWeek, idleDays } from './lib/stats'
import { redoGroups } from './lib/redo'
import { pickMission } from './lib/mission'

/** Re-renders on an interval and on tab focus so "today" stays correct across midnight. */
export function useNow(ms = 30000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, ms)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', tick)
    }
  }, [ms])
  return now
}

export function useDerived() {
  const problems = useStore((s) => s.problems)
  const planStart = useStore((s) => s.planStart)
  const checked = useStore((s) => s.roadmapChecked)
  const now = useNow()
  const today = todayStr(now)

  return useMemo(() => {
    const week = getWeekInfo(planStart, today)
    const streak = computeStreaks(
      problems.map((p) => p.date),
      today,
    )
    const weekCount = problemsInWeek(problems, planStart, week.week).length
    const groups = redoGroups(problems, today)
    const idle = idleDays(problems, today)
    const mission = pickMission(problems, checked, today, week.clamped)
    return { now, today, week, streak, weekCount, groups, idle, mission, total: problems.length, sunday: isSunday(now) }
  }, [problems, planStart, checked, now, today])
}
