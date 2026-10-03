import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useUI } from '../store/ui'
import { PageHeader } from '../components/Primitives'
import { Item, Stagger } from '../components/Motion'
import { ProblemForm, type ProblemValues } from '../components/ProblemForm'
import { MILESTONE_COUNTS, MILESTONE_STREAKS } from '../lib/constants'
import { todayStr } from '../lib/dates'
import { suggestRedoDate } from '../lib/redo'
import { computeStreaks } from '../lib/streak'

export default function Log() {
  const navigate = useNavigate()
  const problems = useStore((s) => s.problems)
  const draft = useStore((s) => s.draft)
  const addProblem = useStore((s) => s.addProblem)
  const setDraft = useStore((s) => s.setDraft)
  const { toast, celebrate } = useUI.getState()

  const initial = useMemo<ProblemValues>(() => {
    const date = todayStr()
    const solvedAlone = draft?.solvedAlone ?? 'N'
    return {
      date,
      name: draft?.name ?? '',
      lcNumber: '',
      pattern: draft?.pattern ?? '',
      difficulty: '',
      solvedAlone,
      mistake: '',
      minutes: draft?.minutes ?? 30,
      redoDate: suggestRedoDate(date, solvedAlone),
      notes: '',
    }
    // The draft is consumed once on mount.
  }, [])

  useEffect(() => {
    setDraft(null)
  }, [setDraft])

  const onSubmit = (v: ProblemValues) => {
    const today = todayStr()
    const before = computeStreaks(problems.map((p) => p.date), today)
    addProblem(v)
    setDraft(null)
    const after = computeStreaks([...problems.map((p) => p.date), v.date], today)
    const count = problems.length + 1

    if (MILESTONE_COUNTS.includes(count)) {
      celebrate('big', count === 1 ? 'First problem logged' : `${count} problems logged`, count === 150 ? 'Plan goal reached.' : 'Keep the standard high.')
    } else if (after.current !== before.current && MILESTONE_STREAKS.includes(after.current)) {
      celebrate('big', `${after.current}-day streak`, 'Consistency is the whole game.')
    } else {
      celebrate('small')
    }
    toast(after.current > 0 ? `Logged. ${after.current}-day streak.` : 'Logged.')
    navigate('/')
  }

  return (
    <Stagger>
      <Item>
        <PageHeader title="Log a problem" kicker="Error log entry" />
      </Item>
      <Item>
        <div className="card p-5 md:p-6">
          <ProblemForm initial={initial} autoRedo submitLabel="Save to ledger" onSubmit={onSubmit} onCancel={() => navigate(-1)} />
        </div>
      </Item>
    </Stagger>
  )
}
