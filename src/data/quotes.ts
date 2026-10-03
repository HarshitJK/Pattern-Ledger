export type Situation =
  | 'streakAlive'
  | 'streakBroken'
  | 'hardProblem'
  | 'redoOverdue'
  | 'milestone'
  | 'sunday'
  | 'returning'
  | 'general'

export const QUOTES: Record<Situation, string[]> = {
  streakAlive: [
    'Another day on the ledger. Consistency beats a burnout week of ten hours.',
    'The streak is a side effect. The real product is a brain that sees patterns.',
    'One problem, deeply understood, beats five peeked at. Keep the standard high.',
    'Show up, struggle for 25 minutes, then learn. That is the whole method.',
    'You are building a reflex. Reflexes come from repetition, not from heroics.',
    'Small daily reps compound. Your future self is already grateful.',
  ],
  streakBroken: [
    'A missed day is data, not a verdict. Log one problem and you are back.',
    'The streak reset. The skills did not. Start a new one today.',
    'Marathons have walking breaks. Lace up and run the next mile.',
    'Do not make up for lost time. Just do today well.',
    'Restart small: one Easy, full checklist, honest log entry.',
  ],
  hardProblem: [
    'Struggling is where learning happens. Write down what broke, then move on.',
    'Could not solve it alone? Good, now you know exactly what to redo.',
    'Read the solution, close it, wait ten minutes, retype it from memory.',
    'Hard problems are pattern recognition in disguise. Name the pattern first.',
    'A logged mistake is worth more than a silent success.',
    'Quality over quantity: three problems deeply understood beats fifteen peeked at.',
  ],
  redoOverdue: [
    'Solving once means little. Redo it without looking and it becomes yours.',
    'Overdue redos are the cheapest wins on the board. Clear one first.',
    'Redo after 3 days, then after 2 weeks. The gap is the point.',
    'Your older self left you a problem. Pay it forward by redoing it clean.',
    'Memory fades on schedule. The redo queue is how you beat the curve.',
  ],
  milestone: [
    'Milestone reached. Every one of those problems was a decision to show up.',
    'Look at the ledger: that is evidence, not luck.',
    'You are not the person who started this plan. Keep going.',
    'Numbers are just receipts for the thinking you did. Well earned.',
  ],
  sunday: [
    'Sunday review: if one pattern keeps showing up in the log, that is next week.',
    'Read your own mistakes today. They are the best textbook you have.',
    'Close the week honestly. Then pick one focus, not five.',
    'Review beats grinding. Spend twenty minutes with the log.',
  ],
  returning: [
    'Welcome back. Nothing is lost, the patterns are still in there.',
    'No guilt, no catch-up. One easy problem and you are moving again.',
    'The plan waited for you. Start with a warm-up and rebuild the rhythm.',
    'Coming back is the hardest rep. You just did it.',
  ],
  general: [
    'Name the pattern before you write a line of code.',
    'Talk through your approach out loud before coding. Interviewers will ask.',
    'Constraints hint at the answer: n up to 10^5 means you need O(n log n) or better.',
    'Never copy-paste a solution. Understand why each line exists.',
    'Give yourself 25 to 30 minutes before any hint. Earn the insight.',
    'Predict the next test case: empty input, duplicates, negatives, a single element.',
  ],
}
