import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SEED_PROBLEMS } from '../data/seed'
import { DEFAULT_PLAN_START, SESSION_MIN } from '../lib/constants'
import { applyRedo } from '../lib/redo'
import { uid } from '../lib/id'
import { CHECKLIST } from '../data/plan'
import type { Draft, Problem, SessionState, Settings } from './types'

export type Theme = 'dark' | 'light'

export const STORE_VERSION = 1

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
}

export type Store = Data & Actions

const initial = (): Data => ({
  problems: SEED_PROBLEMS,
  planStart: DEFAULT_PLAN_START,
  theme: 'dark',
  settings: { reminderOn: false, reminderTime: '19:00', lastNotifiedOn: '' },
  roadmapChecked: {},
  reflections: {},
  session: null,
  draft: null,
  importCardDismissed: false,
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

/** Placeholder for future schema changes: bump STORE_VERSION and branch on `version` here. */
function migrate(persisted: unknown, version: number): Data {
  void version
  return { ...initial(), ...(persisted as Partial<Data>) }
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
      resetAll: () => set({ ...initial(), problems: [], importCardDismissed: true }),
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
