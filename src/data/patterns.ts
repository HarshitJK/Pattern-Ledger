export const PATTERNS = [
  'Two Pointers',
  'Sliding Window',
  'Fast & Slow Pointers',
  'Merge Intervals',
  'Binary Search',
  'Hashing/Prefix Sum',
  'Stack (Monotonic)',
  'Tree DFS/BFS',
  'Graph BFS/DFS',
  'Backtracking',
  'DP (1D)',
  'DP (2D)',
  'Heap/Priority Queue',
  'Union-Find',
  'Greedy',
] as const

/** The 15 guide patterns plus the spreadsheet's "Other" bucket. Order matches the sheet dropdown. */
export const PATTERN_OPTIONS: string[] = [...PATTERNS, 'Other']

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const

export const MISTAKE_TYPES: string[] = [
  "didn't recognize pattern",
  'edge case missed',
  'off-by-one',
  'wrong complexity assumption',
  'syntax error',
  'misread problem',
  'wrong data structure choice',
  'ran out of time',
  'none - solved cleanly',
]

export interface Starter {
  name: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

export const SIGNALS: Record<string, string> = {
  'Two Pointers': 'sorted array, pair sum, palindrome',
  'Sliding Window': 'subarray/substring, longest/shortest/contains',
  'Fast & Slow Pointers': 'linked list, cycle detection',
  'Merge Intervals': 'overlapping ranges, scheduling',
  'Binary Search': 'sorted, find min/max satisfying condition',
  'Hashing/Prefix Sum': 'count pairs, subarray sum equals K',
  'Stack (Monotonic)': 'next greater/smaller, matching brackets',
  'Tree DFS/BFS': 'tree traversal, level order, path sum',
  'Graph BFS/DFS': 'grid, islands, shortest path unweighted',
  Backtracking: 'all combinations/permutations, constraints',
  'DP (1D)': 'min/max ways, overlapping subproblems',
  'DP (2D)': 'grids, two strings',
  'Heap/Priority Queue': 'top K, kth largest, merge K lists',
  'Union-Find': 'connected components, cycles in undirected graph',
  Greedy: 'local optimal choice, intervals, jump games',
}

/** Starter problems from the guide's pattern table. */
export const STARTERS: Record<string, Starter[]> = {
  'Two Pointers': [
    { name: 'Two Sum II', difficulty: 'Medium' },
    { name: 'Valid Palindrome', difficulty: 'Easy' },
    { name: 'Container With Most Water', difficulty: 'Medium' },
  ],
  'Sliding Window': [
    { name: 'Longest Substring Without Repeating Characters', difficulty: 'Medium' },
    { name: 'Maximum Sum Subarray of Size K', difficulty: 'Easy' },
  ],
  'Fast & Slow Pointers': [
    { name: 'Linked List Cycle', difficulty: 'Easy' },
    { name: 'Middle of the Linked List', difficulty: 'Easy' },
  ],
  'Merge Intervals': [
    { name: 'Merge Intervals', difficulty: 'Medium' },
    { name: 'Insert Interval', difficulty: 'Medium' },
  ],
  'Binary Search': [
    { name: 'Search in Rotated Sorted Array', difficulty: 'Medium' },
    { name: 'Koko Eating Bananas', difficulty: 'Medium' },
  ],
  'Hashing/Prefix Sum': [
    { name: 'Two Sum', difficulty: 'Easy' },
    { name: 'Subarray Sum Equals K', difficulty: 'Medium' },
  ],
  'Stack (Monotonic)': [
    { name: 'Valid Parentheses', difficulty: 'Easy' },
    { name: 'Daily Temperatures', difficulty: 'Medium' },
  ],
  'Tree DFS/BFS': [
    { name: 'Binary Tree Level Order Traversal', difficulty: 'Medium' },
    { name: 'Path Sum', difficulty: 'Easy' },
  ],
  'Graph BFS/DFS': [
    { name: 'Number of Islands', difficulty: 'Medium' },
    { name: 'Course Schedule', difficulty: 'Medium' },
  ],
  Backtracking: [
    { name: 'Subsets', difficulty: 'Medium' },
    { name: 'Permutations', difficulty: 'Medium' },
    { name: 'N-Queens', difficulty: 'Hard' },
  ],
  'DP (1D)': [
    { name: 'Climbing Stairs', difficulty: 'Easy' },
    { name: 'House Robber', difficulty: 'Medium' },
  ],
  'DP (2D)': [
    { name: 'Longest Common Subsequence', difficulty: 'Medium' },
    { name: 'Edit Distance', difficulty: 'Medium' },
  ],
  'Heap/Priority Queue': [
    { name: 'Kth Largest Element in an Array', difficulty: 'Medium' },
    { name: 'Merge k Sorted Lists', difficulty: 'Hard' },
  ],
  'Union-Find': [
    { name: 'Number of Provinces', difficulty: 'Medium' },
    { name: 'Redundant Connection', difficulty: 'Medium' },
  ],
  Greedy: [
    { name: 'Jump Game', difficulty: 'Medium' },
    { name: 'Gas Station', difficulty: 'Medium' },
  ],
}
