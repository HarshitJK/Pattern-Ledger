import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { todayStr } from '../lib/dates'
import { SESSION_MIN } from '../lib/constants'
import { applyRedo } from '../lib/redo'
import { uid } from '../lib/id'
import { CHECKLIST } from '../data/plan'
import type { Draft, Problem, SessionState, Settings } from './types'

export type Theme = 'dark' | 'light'

export const STORE_VERSION = 2

/** Everything that is saved to localStorage and exported as a JSON backup. */
export interface Data {
  problems: Problem[]
  planStart: string
  theme: Theme
  settings: Settings
  roadmapChecked: Record<string, boolean>
  reflections: Record<string, string>
  session: SessionState | null
  draft: Draft | null
  importCardDismissed: boolean
  welcomeDismissedOn: string
}

interface Actions {
  addProblem: (p: Omit<Problem, 'id' | 'redos' | 'mastered'>) => Problem
  updateProblem: (id: string, patch: Partial<Problem>) => void
  deleteProblem: (id: string) => void
  restoreProblem: (p: Problem) => void
  redo: (id: string, clean: boolean, today: string) => void
  importProblems: (list: Problem[]) => void
  setTheme: (t: Theme) => void
  setPlanStart: (d: string) => void
  setSettings: (patch: Partial<Settings>) => void
  toggleStarter: (key: string) => void
  setReflection: (weekKey: string, text: string) => void
  startSession: (problem: string, pattern: string, durationMin: number) => void
  patchSession: (patch: Partial<SessionState>) => void
  endSession: () => void
  setDraft: (d: Draft | null) => void
  dismissImportCard: () => void
  dismissWelcome: (today: string) => void
  replaceAll: (data: Partial<Data>) => void
  resetAll: () => void
  restartPlan: () => void
}

export type Store = Data & Actions

/** The old default plan-start date that shipped with the seed data. */
const LEGACY_PLAN_START = '2026-08-03'

const initial = (): Data => ({
  problems: [],
  planStart: todayStr(),
  theme: 'dark',
  settings: { reminderOn: false, reminderTime: '19:00', lastNotifiedOn: '' },
  roadmapChecked: {},
  reflections: {},
  session: null,
  draft: null,
  importCardDismissed: true,
  welcomeDismissedOn: '',
})

const DATA_KEYS: (keyof Data)[] = [
  'problems',
  'planStart',
  'theme',
  'settings',
  'roadmapChecked',
  'reflections',
  'session',
  'draft',
  'importCardDismissed',
  'welcomeDismissedOn',
]

/** Migrate persisted state across schema versions. */
function migrate(persisted: unknown, version: number): Data {
  const base = { ...initial(), ...(persisted as Partial<Data>) }

  // v1 → v2: replace the legacy seed plan-start with today so week 1 is correct.
  if (version < 2) {
    if (base.planStart === LEGACY_PLAN_START) {
      base.planStart = todayStr()
    }
    // Also remove any seed problems that shipped with v1 (identified by their fixed ids).
    const seedIds = new Set(['seed-1', 'seed-2', 'seed-3'])
    base.problems = base.problems.filter((p) => !seedIds.has(p.id))
    // importCardDismissed: if the user had the card, treat it as dismissed now.
    base.importCardDismissed = true
  }

  return base
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      ...initial(),
      addProblem: (p) => {
        const problem: Problem = { ...p, id: uid(), redos: [], mastered: false }
        set((s) => ({ problems: [...s.problems, problem] }))
        return problem
      },
      updateProblem: (id, patch) =>
        set((s) => ({ problems: s.problems.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteProblem: (id) => set((s) => ({ problems: s.problems.filter((p) => p.id !== id) })),
      restoreProblem: (p) => set((s) => (s.problems.some((x) => x.id === p.id) ? s : { problems: [...s.problems, p] })),
      redo: (id, clean, today) =>
        set((s) => ({ problems: s.problems.map((p) => (p.id === id ? applyRedo(p, clean, today) : p)) })),
      importProblems: (list) => set((s) => ({ problems: [...s.problems, ...list], importCardDismissed: true })),
      setTheme: (theme) => set({ theme }),
      setPlanStart: (planStart) => set({ planStart }),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      toggleStarter: (key) =>
        set((s) => ({ roadmapChecked: { ...s.roadmapChecked, [key]: !s.roadmapChecked[key] } })),
      setReflection: (weekKey, text) => set((s) => ({ reflections: { ...s.reflections, [weekKey]: text } })),
      startSession: (problem, pattern, durationMin) =>
        set({
          session: {
            problem,
            pattern,
            startedAt: Date.now(),
            durationMin: Math.min(SESSION_MIN.max, Math.max(SESSION_MIN.min, durationMin)),
            checks: CHECKLIST.map(() => false),
            hintUsed: false,
          },
        }),
      patchSession: (patch) => set((s) => (s.session ? { session: { ...s.session, ...patch } } : s)),
      endSession: () => set({ session: null }),
      setDraft: (draft) => set({ draft }),
      dismissImportCard: () => set({ importCardDismissed: true }),
      dismissWelcome: (d) => set({ welcomeDismissedOn: d }),
      replaceAll: (data) => set(() => ({ ...initial(), ...data })),
      /** Wipe everything and start fresh at Week 1 today. Keeps theme. */
      resetAll: () =>
        set((s) => ({
          ...initial(),
          theme: s.theme,
        })),
      /** Keep problems; reset the plan to start today and clear roadmap + reflections. */
      restartPlan: () =>
        set((_s) => ({
          planStart: todayStr(),
          roadmapChecked: {},
          reflections: {},
        })),
    }),
    {
      name: 'pattern-ledger',
      version: STORE_VERSION,
      migrate: (persisted, version) => migrate(persisted, version),
      partialize: (s) => Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]])) as unknown as Store,
    },
  ),
)

export function snapshot(): Data {
  const s = useStore.getState()
  return Object.fromEntries(DATA_KEYS.map((k) => [k, s[k]])) as unknown as Data
}
