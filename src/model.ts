import data from "./problems.json";
import {
  addDays,
  nextReview,
  dailyPlan,
  studyWeek,
  dayDiff,
  reviewDay,
  reviewSlot,
  moveReview,
} from "./scheduler";
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
  const next = nextReview(previous?.card ?? null, rating, day, state, id);
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
  if (a.previous) {
    s.progress[a.problemId] = a.previous;
    if (s.planning?.breaks?.includes(a.previous.due)) {
      const last = [...s.history]
        .reverse()
        .find((h) => h.problemId === a.problemId);
      moveReview(
        a.previous,
        last?.rating === 1
          ? reviewDay(a.previous.due, s)
          : reviewSlot(a.previous.due, s, a.problemId),
      );
    }
  } else delete s.progress[a.problemId];
  s.revision++;
  return s;
}

function mutablePlan(state: StudyState) {
  const next = structuredClone(state);
  next.planning ??= { days: {}, weeks: {} };
  next.revision++;
  return next as StudyState & { planning: NonNullable<StudyState["planning"]> };
}
export function setDayMinutes(
  state: StudyState,
  day: string,
  minutes: number | null,
): StudyState {
  if (
    minutes !== null &&
    (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440)
  )
    throw new Error("Choose between 0 and 1440 minutes.");
  const next = mutablePlan(state);
  const adjustment = (next.planning.days[day] ??= { extras: [] });
  if (minutes === null) delete adjustment.minutes;
  else adjustment.minutes = minutes;
  return next;
}
export function setWeekHours(
  state: StudyState,
  day: string,
  hours: number | null,
): StudyState {
  if (hours !== null && (!Number.isFinite(hours) || hours < 0 || hours > 80))
    throw new Error("Choose between 0 and 80 hours.");
  const next = mutablePlan(state);
  const key = studyWeek(state, day).start;
  if (hours === null) delete next.planning.weeks[key];
  else next.planning.weeks[key] = hours;
  return next;
}
export function addExtraProblem(state: StudyState, day: string): StudyState {
  const problem = dailyPlan(state, day).nextExtra;
  if (!problem) throw new Error("No more new problems to add today.");
  const next = mutablePlan(state);
  (next.planning.days[day] ??= { extras: [] }).extras.push(problem.id);
  return next;
}
export function removeExtraProblem(
  state: StudyState,
  day: string,
  id: string,
): StudyState {
  const next = mutablePlan(state);
  const adjustment = next.planning.days[day];
  if (adjustment) adjustment.extras = adjustment.extras.filter((p) => p !== id);
  return next;
}

export function setStudyBreak(
  state: StudyState,
  start: string | null,
  end: string | null,
): StudyState {
  const next = mutablePlan(state);
  if (start === null && end === null) {
    next.planning.breaks = [];
    return next;
  }
  const valid = (s: string | null): s is string =>
    typeof s === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    Number.isFinite(Date.parse(s)) &&
    new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s;
  if (!valid(start) || !valid(end) || end < start || dayDiff(start, end) > 365)
    throw new Error(
      "Choose a valid break of up to 366 days, with the end on or after the start.",
    );
  next.planning.breaks = [];
  for (let day = start; day <= end; day = addDays(day, 1))
    next.planning.breaks.push(day);
  if (
    JSON.stringify(next.planning.breaks) ===
      JSON.stringify(state.planning?.breaks) &&
    !Object.values(next.progress).some((p) => p.due >= start && p.due <= end)
  )
    return next;
  const resume = addDays(end, 1);
  const affected = Object.entries(next.progress).filter(
    ([, p]) => p.due >= start && p.due <= resume,
  );
  const latest = new Map(next.history.map((a) => [a.problemId, a.rating]));
  affected.sort(
    ([a, pa], [b, pb]) =>
      Number(latest.get(b) === 1) - Number(latest.get(a) === 1) ||
      (pa.card?.stability ?? 0) - (pb.card?.stability ?? 0) ||
      pa.due.localeCompare(pb.due) ||
      a.localeCompare(b),
  );
  // Reserve unrelated appointments, then allocate each affected card once.
  for (const [id] of affected) delete next.progress[id];
  for (const [id, p] of affected) {
    moveReview(p, latest.get(id) === 1 ? resume : reviewSlot(resume, next, id));
    next.progress[id] = p;
  }
  return next;
}

export function markMorningStudy(
  state: StudyState,
  id: string,
  day: string,
  marked: boolean,
): StudyState {
  if (!problems.some((p) => p.id === id)) throw Error("Unknown problem.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    !Number.isFinite(Date.parse(day)) ||
    new Date(day + "T12:00:00Z").toISOString().slice(0, 10) !== day
  )
    throw Error("Invalid study date.");
  if (marked && state.history.some((a) => a.problemId === id && a.day === day))
    throw Error("This problem is already rated today.");
  if (
    marked &&
    (day < state.settings.startDate || state.planning?.breaks?.includes(day))
  )
    throw Error("Choose an available study day.");
  const s = structuredClone(state);
  s.morningStudy ??= {};
  if (marked) s.morningStudy[id] = day;
  else delete s.morningStudy[id];
  s.revision++;
  return s;
}
