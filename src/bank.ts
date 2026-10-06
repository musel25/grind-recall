import type { Problem } from "./types";

export type BankWeek = { week: number; problems: Problem[] };

// A stable curriculum roadmap, not a prediction of daily assignments. Split the
// whole ordered bank by estimated first-pass effort, before applying filters.
// Reviews, progress and breaks still determine the actual Today queue.
export function bankWeeks(problems: Problem[], weeks: number): BankWeek[] {
  const groups = Array.from({ length: weeks }, (_, i) => ({
    week: i + 1,
    problems: [] as Problem[],
  }));
  const total = problems.reduce((sum, p) => sum + p.minutes, 0);
  let elapsed = 0;
  for (const problem of problems) {
    elapsed += problem.minutes;
    const index = Math.min(weeks - 1, Math.ceil((elapsed * weeks) / total) - 1);
    groups[index].problems.push(problem);
  }
  return groups;
}
