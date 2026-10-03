export interface Phase {
  id: number
  name: string
  weeks: [number, number]
  blurb: string
  tips: string[]
}

export const PHASES: Phase[] = [
  {
    id: 1,
    name: 'Foundations',
    weeks: [1, 4],
    blurb: 'Arrays, strings, two pointers, sliding window, hashing, stack. Recognise these on sight.',
    tips: ['4-5 problems per pattern, mixing Easy into Medium.'],
  },
  {
    id: 2,
    name: 'Linear Structures',
    weeks: [5, 7],
    blurb: 'Linked lists, trees, BFS/DFS, graphs.',
    tips: ['Draw every tree and graph problem on paper first.', 'Learn recursive and iterative traversal for trees.'],
  },
  {
    id: 3,
    name: 'Advanced',
    weeks: [8, 10],
    blurb: 'Backtracking, DP (1D then 2D), heaps.',
    tips: ['For every DP problem: brute-force recursion, then memoize, then tabulate.'],
  },
  {
    id: 4,
    name: 'Polish',
    weeks: [11, 12],
    blurb: 'Greedy, Union-Find, mixed random problems.',
    tips: ['Timed mocks: 2 mediums in 45 minutes, no hints.', 'Revisit your weakest pattern from the error log.'],
  },
]

export interface PlanWeek {
  week: number
  phase: number
  patterns: string[]
  focus?: string
  target: { min: number; max: number }
}

/** Patterns per week. The guide names phases, not weeks, so patterns are spread in guide order. */
const WEEK_PATTERNS: string[][] = [
  ['Two Pointers'],
  ['Sliding Window'],
  ['Hashing/Prefix Sum'],
  ['Stack (Monotonic)'],
  ['Fast & Slow Pointers', 'Merge Intervals'],
  ['Tree DFS/BFS', 'Binary Search'],
  ['Graph BFS/DFS'],
  ['Backtracking'],
  ['DP (1D)'],
  ['DP (2D)', 'Heap/Priority Queue'],
  ['Greedy', 'Union-Find'],
  [],
]

export function targetForWeek(week: number): { min: number; max: number } {
  if (week <= 4) return { min: 5, max: 5 }
  if (week <= 8) return { min: 6, max: 7 }
  return { min: 7, max: 8 }
}

export const PLAN: PlanWeek[] = WEEK_PATTERNS.map((patterns, i) => {
  const week = i + 1
  const phase = PHASES.find((p) => week >= p.weeks[0] && week <= p.weeks[1])!.id
  return {
    week,
    phase,
    patterns,
    focus: week === 12 ? 'Mixed random problems, timed mocks, and your weakest pattern' : undefined,
    target: targetForWeek(week),
  }
})

export const CHECKLIST = [
  'Restate the problem in your own words',
  'Identify constraints (n <= 20 brute force, n <= 1000 O(n^2), n <= 10^5 needs O(n log n) or O(n))',
  'Work a small example by hand on paper',
  'State your approach out loud in plain English',
  'Code it',
  'Trace through your example manually',
  'State time and space complexity',
  'Only now compare with the editorial or discussion',
]
