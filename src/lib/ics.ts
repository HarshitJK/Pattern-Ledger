import { format } from 'date-fns'

const stamp = (d: Date) => format(d, "yyyyMMdd'T'HHmmss")

/** Recurring daily 30 minute event at a local HH:mm, as an iCalendar string. */
export function generateIcs(time: string, now: Date = new Date()): string {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10) || 0)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0)
  if (start.getTime() < now.getTime()) start.setDate(start.getDate() + 1)
  const utcStamp = format(new Date(now.getTime() + now.getTimezoneOffset() * 60000), "yyyyMMdd'T'HHmmss'Z'")
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pattern Ledger//Daily reminder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:daily-reminder@pattern-ledger',
    `DTSTAMP:${utcStamp}`,
    `DTSTART:${stamp(start)}`,
    'DURATION:PT30M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:Pattern Ledger - solve and log one problem',
    'DESCRIPTION:Struggle for 25 minutes first. Log the problem and check your redo queue.',
    'BEGIN:VALARM',
    'TRIGGER:PT0M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Time for your daily problem',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n') + '\r\n'
}
