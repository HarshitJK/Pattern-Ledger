# Pattern Ledger

A personal LeetCode training tracker built around "The Complete LeetCode Mastery Guide": 15 patterns, a 12-week plan, an error log, spaced redos, and daily motivation. Vite + React 18 + TypeScript + Tailwind + Zustand. No backend.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest unit tests (streaks, redo, weeks, Excel import)
npm run build    # type-check + production build into dist/
```

Shortcut: press `N` anywhere to log a problem.

## Deploy to Vercel

1. Push this folder to a Git repository.
2. In Vercel choose **Add New > Project** and import the repo.
3. Keep the detected **Vite** preset (build `npm run build`, output `dist`).
4. Click **Deploy**. `vercel.json` rewrites deep links such as `/redo` to the SPA.

## Where your data lives

All data is stored in this browser's `localStorage` under the key `pattern-ledger`. Nothing is sent anywhere. Clearing site data deletes it, and each browser or device has its own copy.

Back up from **Settings > Your data**:
- **Export JSON backup** restores everything (redo history, reflections, settings).
- **Export to Excel** writes the same headers as the original sheet plus a Summary sheet.
- **Import from Excel** reads your original `.xlsx` with a preview, skipping blanks and duplicates (date + problem name).

Browser notifications only fire while the app is open or installed as an app. For a reliable reminder use **Add daily reminder to my calendar** (a recurring `.ics` file).
