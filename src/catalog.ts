import data from "./problems.json";
import type { Problem, StudyState } from "./types";
export const problems: Problem[] = data;
export const initialTen = [
  "two-sum",
  "valid-parentheses",
  "merge-two-sorted-lists",
  "best-time-to-buy-and-sell-stock",
  "valid-palindrome",
  "invert-binary-tree",
  "valid-anagram",
  "binary-search",
  "flood-fill",
  "lowest-common-ancestor-of-a-binary-search-tree",
];
export function activeProblems(state?: StudyState | null): Problem[] {
  return problems
    .filter(
      (p) =>
        p.core ||
        (p.bloomberg && !p.deferred) ||
        !!state?.progress[p.id] ||
        !!state?.morningStudy?.[p.id],
    )
    .map((p, i) => ({ ...p, order: i + 1 }));
}
export function archivedProblems(state?: StudyState | null): Problem[] {
  const active = new Set(activeProblems(state).map((p) => p.id));
  return problems.filter((p) => !active.has(p.id));
}
export function problemSource(p: Problem): string {
  return p.core && p.bloomberg
    ? "Grind 75 · Bloomberg"
    : p.core
      ? "Grind 75"
      : p.bloomberg
        ? "Bloomberg"
        : "Extra";
}
