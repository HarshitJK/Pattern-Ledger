import { Link } from 'react-router-dom'
import { BellRing, Flame, NotebookPen } from 'lucide-react'
import { useStore } from '../store'
import { useDerived } from '../hooks'
import { STREAK_NUDGE_HOUR } from '../lib/constants'

/** Slim, situational prompts shown above every page except Log and Session. */
export function Banners() {
  const d = useDerived()
  const settings = useStore((s) => s.settings)
  const hour = d.now.getHours()
  const hhmm = `${String(hour).padStart(2, '0')}:${String(d.now.getMinutes()).padStart(2, '0')}`
  const nudge = hour >= STREAK_NUDGE_HOUR && !d.streak.loggedToday && d.streak.current > 0
  const reminder = !nudge && settings.reminderOn && !d.streak.loggedToday && d.total > 0 && hhmm >= settings.reminderTime

  return (
    <div className="space-y-3">
      {nudge && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ember bg-ember/10 p-4 shadow-ember">
          <div className="flex items-center gap-3">
            <Flame className="shrink-0 text-ember" size={26} aria-hidden="true" />
            <div>
              <p className="font-display text-lg font-bold text-ember">Keep your {d.streak.current}-day streak alive</p>
              <p className="text-sm text-mute">Nothing logged today. One problem is enough.</p>
            </div>
          </div>
          <Link to="/log" className="btn btn-ember">
            Log a problem
          </Link>
        </div>
      )}
      {reminder && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-sm">
            <BellRing size={18} className="text-ice" aria-hidden="true" />
            It is past your {settings.reminderTime} reminder and nothing is logged today.
          </p>
          <Link to="/session" className="btn btn-sm">
            Start a session
          </Link>
        </div>
      )}
      {d.sunday && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-4">
          <p className="flex items-center gap-2 text-sm">
            <NotebookPen size={18} className="text-lime" aria-hidden="true" />
            It is Sunday. Read your error log and pick next week's focus.
          </p>
          <Link to="/review" className="btn btn-sm">
            Open weekly review
          </Link>
        </div>
      )}
    </div>
  )
}
