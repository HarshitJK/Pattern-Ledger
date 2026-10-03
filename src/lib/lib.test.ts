import { describe, expect, it } from 'vitest'
import { computeStreaks } from './streak'
import { applyRedo, redoGroups, suggestRedoDate } from './redo'
import { getWeekInfo, weekNumber } from './week'
import { dedupeKey, headerField, normalizeDate, normalizeRow, planImport } from './excel'
import { excelSerialToDateStr } from './dates'
import { masteryState } from './stats'
import { generateIcs } from './ics'
import type { Problem } from '../store/types'

const prob = (over: Partial<Problem> = {}): Problem => ({
  id: 'x',
  date: '2026-08-03',
  name: 'Two Sum',
  lcNumber: '1',
  pattern: 'Hashing/Prefix Sum',
  difficulty: 'Easy',
  solvedAlone: 'N',
  mistake: '',
  minutes: 20,
  redoDate: '',
  notes: '',
  redos: [],
  mastered: false,
  ...over,
})

describe('streaks', () => {
  it('counts consecutive days ending today', () => {
    const s = computeStreaks(['2026-08-01', '2026-08-02', '2026-08-03'], '2026-08-03')
    expect(s).toMatchObject({ current: 3, longest: 3, loggedToday: true, active: true })
  })
  it('keeps the streak alive until the end of the next day', () => {
    const s = computeStreaks(['2026-08-01', '2026-08-02'], '2026-08-03')
    expect(s).toMatchObject({ current: 2, loggedToday: false, active: true })
  })
  it('breaks after a full missed day and tracks longest', () => {
    const s = computeStreaks(['2026-07-01', '2026-07-02', '2026-07-03', '2026-08-01'], '2026-08-03')
    expect(s.current).toBe(0)
    expect(s.longest).toBe(3)
  })
  it('ignores duplicate dates and handles empty', () => {
    expect(computeStreaks(['2026-08-03', '2026-08-03'], '2026-08-03').current).toBe(1)
    expect(computeStreaks([], '2026-08-03')).toMatchObject({ current: 0, longest: 0 })
  })
  it('crosses month boundaries', () => {
    expect(computeStreaks(['2026-07-31', '2026-08-01'], '2026-08-01').current).toBe(2)
  })
})

describe('redo scheduling', () => {
  it('suggests +3 when not solved alone and +14 when solved alone', () => {
    expect(suggestRedoDate('2026-08-03', 'N')).toBe('2026-08-06')
    expect(suggestRedoDate('2026-08-03', 'Y')).toBe('2026-08-17')
  })
  it('first clean redo goes to +14 days', () => {
    const p = applyRedo(prob({ redoDate: '2026-08-06' }), true, '2026-08-06')
    expect(p.redoDate).toBe('2026-08-20')
    expect(p.mastered).toBe(false)
    expect(p.redos).toEqual([{ date: '2026-08-06', clean: true }])
  })
  it('second clean redo masters the problem', () => {
    const first = applyRedo(prob(), true, '2026-08-06')
    const second = applyRedo(first, true, '2026-08-20')
    expect(second.mastered).toBe(true)
    expect(second.redoDate).toBe('')
    expect(second.redos).toHaveLength(2)
  })
  it('a stuck redo goes back to +3 days and clears mastery', () => {
    const p = applyRedo(prob({ mastered: true }), false, '2026-08-06')
    expect(p.redoDate).toBe('2026-08-09')
    expect(p.mastered).toBe(false)
  })
  it('groups into overdue, due today and upcoming', () => {
    const g = redoGroups(
      [
        prob({ id: 'a', redoDate: '2026-08-01' }),
        prob({ id: 'b', redoDate: '2026-08-03' }),
        prob({ id: 'c', redoDate: '2026-08-09' }),
        prob({ id: 'd', redoDate: '' }),
        prob({ id: 'e', redoDate: '2026-08-01', mastered: true }),
      ],
      '2026-08-03',
    )
    expect(g.overdue.map((p) => p.id)).toEqual(['a'])
    expect(g.dueToday.map((p) => p.id)).toEqual(['b'])
    expect(g.upcoming.map((p) => p.id)).toEqual(['c'])
  })
})

describe('week and phase', () => {
  const start = '2026-08-03'
  it('computes plan week from the start date', () => {
    expect(weekNumber(start, '2026-08-03')).toBe(1)
    expect(weekNumber(start, '2026-08-09')).toBe(1)
    expect(weekNumber(start, '2026-08-10')).toBe(2)
    expect(weekNumber(start, '2026-10-03')).toBe(9)
  })
  it('maps weeks to phases and targets', () => {
    expect(getWeekInfo(start, '2026-08-03')).toMatchObject({ phaseId: 1, phaseName: 'Foundations', target: { min: 5, max: 5 } })
    expect(getWeekInfo(start, '2026-09-07')).toMatchObject({ week: 6, phaseId: 2, target: { min: 6, max: 7 } })
    expect(getWeekInfo(start, '2026-10-03')).toMatchObject({ week: 9, phaseId: 3, target: { min: 7, max: 8 } })
    expect(getWeekInfo(start, '2026-10-25')).toMatchObject({ week: 12, phaseId: 4 })
  })
  it('flags dates before and after the plan', () => {
    expect(getWeekInfo(start, '2026-07-20')).toMatchObject({ beforeStart: true, clamped: 1 })
    expect(getWeekInfo(start, '2027-01-01')).toMatchObject({ afterEnd: true, clamped: 12, phaseId: 4 })
  })
})

describe('excel normalisation', () => {
  it('converts Excel serials and ISO strings to local dates', () => {
    expect(excelSerialToDateStr(46243)).toBe('2026-08-09')
    expect(normalizeDate(46244)).toBe('2026-08-10')
    expect(normalizeDate('2026-08-03')).toBe('2026-08-03')
    expect(normalizeDate('2026-08-03T10:00:00')).toBe('2026-08-03')
  })
  it('treats 0, blank and junk as no date', () => {
    expect(normalizeDate(0)).toBe('')
    expect(normalizeDate('')).toBe('')
    expect(normalizeDate('0')).toBe('')
    expect(normalizeDate(undefined)).toBe('')
    expect(normalizeDate('not a date')).toBe('')
  })
  it('maps headers by name', () => {
    expect(headerField('Solved Alone? (Y/N)')).toBe('solvedAlone')
    expect(headerField('Time Spent (min)')).toBe('minutes')
    expect(headerField('LeetCode #')).toBe('lcNumber')
    expect(headerField('Redo Date')).toBe('redoDate')
    expect(headerField('whatever')).toBeNull()
  })
  it('keeps free-text LeetCode # and normalises the rest', () => {
    const { problem } = normalizeRow({
      date: 46243,
      name: ' Palindrome alphanumeric ',
      lcNumber: 'neetcode',
      pattern: 'two pointers',
      difficulty: 'easy',
      solvedAlone: 'n',
      mistake: 'off-by-one',
      minutes: 20,
      redoDate: 0,
      notes: '',
    })
    expect(problem).toMatchObject({
      date: '2026-08-09',
      name: 'Palindrome alphanumeric',
      lcNumber: 'neetcode',
      pattern: 'Two Pointers',
      difficulty: 'Easy',
      solvedAlone: 'N',
      redoDate: '',
      minutes: 20,
    })
  })
  it('rejects empty rows and rows without a valid date', () => {
    expect(normalizeRow({}).problem).toBeNull()
    expect(normalizeRow({ name: 'X', date: '' }).reason).toBe('bad date')
  })
  it('plans an import: finds the header row, skips blanks, de-duplicates', () => {
    const rows: unknown[][] = [
      ['LeetCode Error Log'],
      [],
      ['Date', 'Problem Name', 'LeetCode #', 'Pattern', 'Difficulty', 'Solved Alone? (Y/N)', 'Mistake Type', 'Time Spent (min)', 'Redo Date', 'Notes'],
      ['2026-08-03', 'Longest Substring Without Repeating Characters', '3', 'Sliding Window', 'Medium', 'N', "didn't recognize pattern", 40, '2026-08-10', 'n'],
      [46243, 'Palindrome alphanumeric', 'neetcode', 'Two Pointers', 'Easy', 'N', 'off-by-one', 20, 0, ''],
      ['', '', '', '', '', '', '', '', '', ''],
      [46243, 'palindrome alphanumeric', 'neetcode', 'Two Pointers', 'Easy', 'N', 'off-by-one', 20, 0, ''],
    ]
    const existing = [prob({ date: '2026-08-03', name: 'longest substring without repeating characters' })]
    const plan = planImport(rows, existing)
    expect(plan.fresh).toHaveLength(1)
    expect(plan.fresh[0].name).toBe('Palindrome alphanumeric')
    expect(plan.duplicates).toBe(2)
    expect(plan.skipped).toBe(1)
    expect(dedupeKey(plan.fresh[0])).toBe('2026-08-09|palindrome alphanumeric')
  })
  it('throws when no header row exists', () => {
    expect(() => planImport([['a', 'b']], [])).toThrow()
  })
})

describe('mastery thresholds', () => {
  it('assigns states', () => {
    expect(masteryState(0, 0)).toBe('Untouched')
    expect(masteryState(1, 0)).toBe('Learning')
    expect(masteryState(3, 0.5)).toBe('Learning')
    expect(masteryState(3, 0.67)).toBe('Solid')
    expect(masteryState(5, 0.8)).toBe('Mastered')
    expect(masteryState(5, 0.7)).toBe('Solid')
  })
})

describe('ics', () => {
  it('generates a daily recurring 30 minute event', () => {
    const ics = generateIcs('19:00', new Date(2026, 9, 3, 10, 0, 0))
    expect(ics).toContain('RRULE:FREQ=DAILY')
    expect(ics).toContain('DURATION:PT30M')
    expect(ics).toContain('DTSTART:20261003T190000')
    expect(ics).toContain('\r\n')
  })
  it('starts tomorrow if the time already passed', () => {
    expect(generateIcs('09:00', new Date(2026, 9, 3, 10, 0, 0))).toContain('DTSTART:20261004T090000')
  })
})

describe('real spreadsheet', () => {
  it('imports reference/leetcode_error_log.xlsx including messy rows', async () => {
    const { existsSync, readFileSync } = await import('node:fs')
    const path = 'reference/leetcode_error_log.xlsx'
    if (!existsSync(path)) return
    const XLSX = await import('xlsx')
    const wb = XLSX.read(readFileSync(path), { type: 'buffer' })
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['Error Log'], { header: 1, raw: true, defval: '' })
    const plan = planImport(rows, [])
    expect(plan.fresh.map((p) => [p.date, p.name, p.lcNumber, p.pattern, p.redoDate])).toEqual([
      ['2026-08-03', 'Longest Substring Without Repeating Characters', '3', 'Sliding Window', '2026-08-10'],
      ['2026-08-09', 'Palindrome alphanumeric', 'neetcode', 'Two Pointers', ''],
      ['2026-08-10', 'Container With Most Water', 'neetcode', 'Two Pointers', ''],
    ])
    expect(plan.badDates).toBe(0)
  })
})
