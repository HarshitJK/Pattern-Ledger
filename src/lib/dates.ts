import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns'

/** All day math uses local dates as yyyy-MM-dd strings, never UTC. */
export const fmt = (d: Date): string => format(d, 'yyyy-MM-dd')
export const todayStr = (now: Date = new Date()): string => fmt(now)
export const toDate = (s: string): Date => parseISO(s)
export const addDaysStr = (s: string, n: number): string => fmt(addDays(parseISO(s), n))
/** Calendar days from b to a (a - b). */
export const diffDays = (a: string, b: string): number => differenceInCalendarDays(parseISO(a), parseISO(b))
export const isValidDateStr = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s) && isValid(parseISO(s))
export const prettyDate = (s: string): string => (isValidDateStr(s) ? format(parseISO(s), 'd MMM yyyy') : s)
export const shortDate = (s: string): string => (isValidDateStr(s) ? format(parseISO(s), 'd MMM') : s)
export const isSunday = (now: Date = new Date()): boolean => now.getDay() === 0

/** Convert an Excel serial day number to a local yyyy-MM-dd string. */
export function excelSerialToDateStr(serial: number): string {
  const base = new Date(1899, 11, 30)
  return fmt(addDays(base, Math.floor(serial)))
}

/** Stable small hash so daily choices do not change on re-render. */
export function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
