import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { BellRing, CalendarPlus, Download, FileJson, FileSpreadsheet, RotateCcw, Upload } from 'lucide-react'
import { snapshot, STORE_VERSION, useStore, type Data } from '../store'
import { useUI } from '../store/ui'
import { Item, Stagger } from '../components/Motion'
import { Dialog, Field, PageHeader, Segmented } from '../components/Primitives'
import { buildWorkbook, planImport, readWorkbookRows, type ImportPlan } from '../lib/excel'
import { generateIcs } from '../lib/ics'
import { isValidDateStr, prettyDate, todayStr } from '../lib/dates'
import { uid } from '../lib/id'
import type { Problem } from '../store/types'

function download(data: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <Item>
      <section id={id} className="card mb-4 scroll-mt-6 p-5 md:p-6" aria-label={title}>
        <h2 className="font-display mb-4 text-xl font-bold">{title}</h2>
        {children}
      </section>
    </Item>
  )
}

/** Coerce a JSON backup into a valid Data shape; throws if it is not one of ours. */
function parseBackup(text: string): Partial<Data> {
  const raw = JSON.parse(text)
  const data = raw && typeof raw === 'object' && 'data' in raw ? raw.data : raw
  if (!data || !Array.isArray(data.problems)) throw new Error('This file is not a Pattern Ledger backup.')
  const problems: Problem[] = data.problems
    .filter((p: Partial<Problem>) => p && typeof p.name === 'string' && isValidDateStr(String(p.date)))
    .map((p: Partial<Problem>) => ({
      id: p.id || uid(),
      date: p.date!,
      name: p.name!,
      lcNumber: String(p.lcNumber ?? ''),
      pattern: p.pattern || 'Other',
      difficulty: p.difficulty || '',
      solvedAlone: p.solvedAlone === 'Y' ? 'Y' : 'N',
      mistake: p.mistake || '',
      minutes: Number(p.minutes) || 0,
      redoDate: p.redoDate || '',
      notes: p.notes || '',
      redos: Array.isArray(p.redos) ? p.redos : [],
      mastered: !!p.mastered,
    }))
  return { ...data, problems }
}

export default function Settings() {
  const { hash } = useLocation()
  const s = useStore()
  const toast = useUI((u) => u.toast)
  const excelInput = useRef<HTMLInputElement>(null)
  const jsonInput = useRef<HTMLInputElement>(null)
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [importError, setImportError] = useState('')
  const [pendingJson, setPendingJson] = useState<Partial<Data> | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash])

  const askPermission = async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPerm(result)
    if (result !== 'granted') toast('Notifications are blocked. The in-app banner and calendar file still work.')
  }

  const toggleReminder = async () => {
    const on = !s.settings.reminderOn
    s.setSettings({ reminderOn: on })
    if (on && perm === 'default') await askPermission()
  }

  const onExcel = async (file: File | undefined) => {
    if (!file) return
    setImportError('')
    try {
      setPlan(planImport(await readWorkbookRows(file), s.problems))
    } catch (e) {
      setPlan(null)
      setImportError(e instanceof Error ? e.message : 'Could not read that file.')
    }
    if (excelInput.current) excelInput.current.value = ''
  }

  const onJson = async (file: File | undefined) => {
    if (!file) return
    try {
      setPendingJson(parseBackup(await file.text()))
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not read that backup.')
    }
    if (jsonInput.current) jsonInput.current.value = ''
  }

  return (
    <Stagger>
      <Item>
        <PageHeader title="Settings" kicker="Plan, reminders, your data" />
      </Item>

      <Section title="Plan and appearance">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Plan start date" hint="Week 1 begins here. Weekly targets and the heatmap align to it.">
            {(id, d) => (
              <input
                id={id}
                aria-describedby={d}
                type="date"
                className="input font-mono"
                value={s.planStart}
                onChange={(e) => isValidDateStr(e.target.value) && s.setPlanStart(e.target.value)}
              />
            )}
          </Field>
          <div>
            <span className="label">Theme</span>
            <Segmented
              label="Theme"
              value={s.theme}
              onChange={s.setTheme}
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section title="Reminders">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <span className="label" id="rem-label">
              Daily reminder
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={s.settings.reminderOn}
              aria-labelledby="rem-label"
              onClick={toggleReminder}
              className={`relative h-11 w-20 rounded-full border transition-colors duration-200 ${s.settings.reminderOn ? 'border-lime bg-lime/20' : 'border-line bg-bg'}`}
            >
              <span
                className={`absolute top-1.5 h-7 w-7 rounded-full transition-all duration-200 ease-out ${s.settings.reminderOn ? 'left-[44px] bg-lime' : 'left-1.5 bg-mute'}`}
              />
              <span className="sr-only">{s.settings.reminderOn ? 'On' : 'Off'}</span>
            </button>
          </div>
          <Field label="Reminder time">
            {(id) => (
              <input id={id} type="time" className="input font-mono" value={s.settings.reminderTime} onChange={(e) => s.setSettings({ reminderTime: e.target.value || '19:00' })} />
            )}
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className="btn" onClick={askPermission} disabled={perm === 'granted' || perm === 'unsupported'}>
            <BellRing size={16} />
            {perm === 'granted' ? 'Notifications enabled' : perm === 'denied' ? 'Blocked in browser settings' : 'Enable notifications'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => download(generateIcs(s.settings.reminderTime), 'pattern-ledger-daily.ics', 'text/calendar')}
          >
            <CalendarPlus size={16} />
            Add daily reminder to my calendar
          </button>
        </div>
        <p className="mt-4 rounded-lg border border-line bg-bg/60 p-3 text-sm text-mute">
          Browser notifications only fire while Pattern Ledger is open in a tab or installed as an app. If the app is closed, nothing can wake it up. The calendar file is the reliable option: it creates a repeating daily event in your own calendar app.
          {perm === 'unsupported' && ' This browser does not support notifications.'}
        </p>
      </Section>

      <Section id="data" title="Your data">
        <p className="mb-4 text-sm text-mute">
          Everything lives in this browser's localStorage. {s.problems.length} problems stored. Back up regularly.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" className="btn justify-start" onClick={() => excelInput.current?.click()}>
            <FileSpreadsheet size={16} /> Import from Excel
          </button>
          <button
            type="button"
            className="btn justify-start"
            onClick={async () =>
              download(await buildWorkbook(s.problems), 'leetcode_error_log.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            }
          >
            <Download size={16} /> Export to Excel
          </button>
          <button
            type="button"
            className="btn justify-start"
            onClick={() =>
              download(
                JSON.stringify({ app: 'pattern-ledger', version: STORE_VERSION, exportedAt: new Date().toISOString(), data: snapshot() }, null, 2),
                `pattern-ledger-backup-${todayStr()}.json`,
                'application/json',
              )
            }
          >
            <FileJson size={16} /> Export JSON backup
          </button>
          <button type="button" className="btn justify-start" onClick={() => jsonInput.current?.click()}>
            <Upload size={16} /> Import JSON backup
          </button>
        </div>
        <input ref={excelInput} type="file" accept=".xlsx,.xls" className="sr-only" aria-label="Choose Excel file" tabIndex={-1} onChange={(e) => onExcel(e.target.files?.[0])} />
        <input ref={jsonInput} type="file" accept=".json,application/json" className="sr-only" aria-label="Choose JSON backup" tabIndex={-1} onChange={(e) => onJson(e.target.files?.[0])} />
        {importError && (
          <p className="err mt-3" role="alert">
            {importError}
          </p>
        )}
        <div className="mt-6 border-t border-line pt-5">
          <button type="button" className="btn hover:!border-ember hover:!text-ember" onClick={() => setResetOpen(true)}>
            <RotateCcw size={16} /> Reset all data
          </button>
        </div>
      </Section>

      <Dialog open={!!plan} onClose={() => setPlan(null)} title="Import preview">
        {plan && (
          <div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                ['New problems', plan.fresh.length, 'text-lime'],
                ['Duplicates skipped', plan.duplicates, ''],
                ['Empty rows skipped', plan.skipped, ''],
                ['Unreadable dates', plan.badDates, plan.badDates ? 'text-ember' : ''],
              ].map(([label, n, tone]) => (
                <div key={label as string} className="rounded-lg border border-line p-3">
                  <dt className="kicker">{label}</dt>
                  <dd className={`font-display text-3xl font-extrabold ${tone}`}>{n}</dd>
                </div>
              ))}
            </dl>
            {plan.fresh.length > 0 && (
              <ul className="mt-4 max-h-44 space-y-1 overflow-y-auto rounded-lg border border-line p-3 font-mono text-xs">
                {plan.fresh.slice(0, 50).map((p) => (
                  <li key={p.id} className="flex justify-between gap-3">
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 text-mute">{prettyDate(p.date)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-primary"
                disabled={plan.fresh.length === 0}
                onClick={() => {
                  s.importProblems(plan.fresh)
                  toast(`Imported ${plan.fresh.length} problems`)
                  setPlan(null)
                }}
              >
                Import {plan.fresh.length} problems
              </button>
              <button type="button" className="btn" onClick={() => setPlan(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={!!pendingJson} onClose={() => setPendingJson(null)} title="Replace data with this backup?">
        <p className="text-sm text-mute">
          This backup holds {pendingJson?.problems?.length ?? 0} problems. Restoring replaces everything currently stored in this browser.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (pendingJson) s.replaceAll({ ...pendingJson, importCardDismissed: true })
              setPendingJson(null)
              toast('Backup restored')
            }}
          >
            Restore backup
          </button>
          <button type="button" className="btn" onClick={() => setPendingJson(null)}>
            Cancel
          </button>
        </div>
      </Dialog>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} title="Reset all data?">
        <p className="text-sm text-mute">
          This permanently deletes all {s.problems.length} problems, redo history, reflections, checked roadmap items and settings from this browser. Export a backup first if you might want them back.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="btn btn-ember"
            onClick={() => {
              s.resetAll()
              setResetOpen(false)
              toast('All data cleared')
            }}
          >
            Delete everything
          </button>
          <button type="button" className="btn" onClick={() => setResetOpen(false)}>
            Keep my data
          </button>
        </div>
      </Dialog>
    </Stagger>
  )
}
