# Pattern Ledger

A personal training tracker for LeetCode pattern mastery. It turns "The Complete LeetCode Mastery Guide" (15 patterns, a 12-week plan, an error log, spaced redos) into an app that tracks your progress and keeps you consistent.

Runs entirely in your browser. No backend, no accounts, no environment variables.

## Features

- **Dashboard** - week and phase, progress toward 150 problems, streak, 12-week heatmap, pattern mastery map, mistake breakdown, and a daily "next best action".
- **Log** - record a problem with the same fields as the original spreadsheet. Redo dates are suggested automatically (+3 days if you needed help, +14 if you solved it alone).
- **History** - sortable, filterable table with inline edit and undoable delete.
- **Redo queue** - overdue, due today and upcoming, with the guide's 3-day then 2-week spacing.
- **Solve session** - a focus timer with a 25-minute hint lock and the guide's 8-step checklist.
- **Roadmap** - the 12-week plan with checkable starter problems.
- **Weekly review** - auto-generated summary and next week's focus.
- **Reminders** - in-app banners, browser notifications, a recurring calendar (`.ics`) file, and streak-protection nudges.
- **Your data** - import and export Excel, plus JSON backup and restore.

## Tech stack

Vite, React 18, TypeScript, Tailwind CSS 4, Zustand, Framer Motion, date-fns, SheetJS.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # unit tests
npm run build    # type-check and build to dist/
```

Press `N` anywhere in the app to log a problem.

## Deploy to Vercel

1. Push the repository to GitHub.
2. In Vercel, choose **Add New > Project** and import it.
3. Keep the detected **Vite** preset and click **Deploy**.

`vercel.json` already rewrites deep links such as `/redo` to the app.

## Your data

Everything is stored in your browser's `localStorage` (key `pattern-ledger`) and never leaves your device. Clearing site data deletes it, and each browser keeps its own copy, so back up from **Settings > Your data**:

- **JSON backup** restores everything, including redo history and reflections.
- **Excel export** writes the original column layout plus a Summary sheet.
- **Excel import** shows a preview and skips blanks and duplicates.

Browser notifications only fire while the app is open or installed as an app. For a dependable daily reminder, use the calendar file in **Settings**.

## Project structure

```
src/lib/        pure logic: streaks, weeks, redo scheduling, Excel, ics (unit tested)
src/data/       plan, patterns, starter problems, motivational lines
src/store/      persisted Zustand store
src/routes/     one file per page
src/components/ shared UI
```
