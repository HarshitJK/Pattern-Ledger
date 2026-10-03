export interface RedoEntry {
  date: string
  clean: boolean
}

export interface Problem {
  id: string
  date: string // yyyy-MM-dd, local
  name: string
  lcNumber: string
  pattern: string
  difficulty: string
  solvedAlone: 'Y' | 'N'
  mistake: string
  minutes: number
  redoDate: string // '' when none scheduled
  notes: string
  redos: RedoEntry[]
  mastered: boolean
}

export interface SessionState {
  problem: string
  pattern: string
  startedAt: number
  durationMin: number
  checks: boolean[]
  hintUsed: boolean
}

export interface Draft {
  name: string
  pattern: string
  minutes: number
  solvedAlone?: 'Y' | 'N'
}

export interface Settings {
  reminderOn: boolean
  reminderTime: string // HH:mm
  lastNotifiedOn: string
}
