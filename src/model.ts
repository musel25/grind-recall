import data from "./problems.json";
import { addDays, nextReview } from "./scheduler";
import type { Problem, StudyState } from "./types";
export const problems: Problem[] = data;
export function initialState(day: string, importTen = false): StudyState {
  const state: StudyState = {
    version: 1,
    revision: 0,
    settings: {
      startDate: day,
      weeks: 15,
      hours: 10,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      reviewMultiplier: 1,
    },
    progress: {},
    history: [],
  };
  if (importTen)
    for (const p of problems.slice(0, 10))
      state.progress[p.id] = {
        due: addDays(day, 1 + Math.floor((p.order - 1) / 2)),
        card: null,
        imported: true,
        note: "",
        independent: false,
      };
  return state;
}
export function recordAttempt(
  state: StudyState,
  id: string,
  rating: 1 | 2 | 3 | 4,
  day: string,
  minutes: number,
  note: string,
): StudyState {
  if (!problems.some((p) => p.id === id)) throw new Error("Unknown problem.");
  if (![1, 2, 3, 4].includes(rating)) throw new Error("Invalid rating.");
  if (!Number.isFinite(minutes) || minutes < 1 || minutes > 600)
    throw new Error("Enter between 1 and 600 minutes.");
  if (state.history.some((a) => a.problemId === id && a.day === day))
    throw new Error(
      "This problem is already recorded today. Undo it to change your rating.",
    );
  const s = structuredClone(state);
  const previous = s.progress[id] ?? null;
  const next = nextReview(previous?.card ?? null, rating, day);
  s.progress[id] = {
    ...next,
    imported: previous?.imported ?? false,
    note: note.slice(0, 5000),
    independent: (previous?.independent ?? false) || rating >= 2,
  };
  s.history.push({
    id: crypto.randomUUID(),
    problemId: id,
    day,
    rating,
    minutes,
    wasNew: !previous,
    previous,
  });
  s.revision++;
  return s;
}
export function undoAttempt(state: StudyState): StudyState {
  const s = structuredClone(state);
  const a = s.history.pop();
  if (!a) return state;
  if (a.previous) s.progress[a.problemId] = a.previous;
  else delete s.progress[a.problemId];
  s.revision++;
  return s;
}
