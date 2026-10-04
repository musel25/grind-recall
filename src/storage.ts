import { problems } from "./model";
import type { Progress, StudyState } from "./types";
export const STORAGE_KEY = "grind-recall:v1";
const ids = new Set(problems.map((p) => p.id));
function validDate(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v + "T12:00:00Z").toISOString().slice(0, 10) === v
  );
}
function numeric(v: unknown, min: number, max: number) {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}
function object(v: any) {
  return (
    v &&
    typeof v === "object" &&
    !Array.isArray(v) &&
    Object.getPrototypeOf(v) === Object.prototype
  );
}
function checkProgress(p: any): p is Progress {
  if (
    !object(p) ||
    !validDate(p.due) ||
    typeof p.note !== "string" ||
    p.note.length > 5000 ||
    typeof p.imported !== "boolean" ||
    typeof p.independent !== "boolean"
  )
    return false;
  if (p.card === null) return true;
  const c = p.card;
  if (
    !object(c) ||
    typeof c.due !== "string" ||
    !Number.isFinite(Date.parse(c.due)) ||
    !c.last_review ||
    !Number.isFinite(Date.parse(c.last_review))
  )
    return false;
  if (c.due.slice(0, 10) !== p.due) return false;
  return (
    numeric(c.stability, 0, 1e6) &&
    numeric(c.difficulty, 0, 10) &&
    [0, 1, 2, 3].includes(c.state) &&
    [
      "elapsed_days",
      "scheduled_days",
      "reps",
      "lapses",
      "learning_steps",
    ].every((k) => numeric(c[k], 0, 1e6) && Number.isInteger(c[k]))
  );
}
export function validateState(input: unknown): StudyState {
  const s = input as StudyState;
  const fail = () => {
    throw new Error(
      "This backup is invalid or uses an unsupported format. Your current progress has not changed.",
    );
  };
  if (
    !object(s) ||
    s.version !== 1 ||
    !numeric(s.revision, 0, 1e9) ||
    !Number.isInteger(s.revision) ||
    !object(s.settings) ||
    !object(s.progress) ||
    !Array.isArray(s.history) ||
    s.history.length > 100000
  )
    return fail();
  if (s.planning !== undefined) {
    if (
      !object(s.planning) ||
      !object(s.planning.days) ||
      !object(s.planning.weeks)
    )
      return fail();
    const breaks = s.planning.breaks;
    if (
      breaks !== undefined &&
      (!Array.isArray(breaks) ||
        breaks.length > 366 ||
        new Set(breaks).size !== breaks.length ||
        breaks.some((day) => !validDate(day)))
    )
      return fail();
    for (const [day, entry] of Object.entries(s.planning.days)) {
      if (
        !validDate(day) ||
        !object(entry) ||
        (entry.minutes !== undefined &&
          (!numeric(entry.minutes, 0, 1440) ||
            !Number.isInteger(entry.minutes))) ||
        !Array.isArray(entry.extras) ||
        entry.extras.length > 169 ||
        new Set(entry.extras).size !== entry.extras.length ||
        entry.extras.some((id) => !ids.has(id))
      )
        return fail();
    }
    for (const [day, hours] of Object.entries(s.planning.weeks)) {
      if (!validDate(day) || !numeric(hours, 0, 80)) return fail();
    }
  }
  const t = s.settings;
  if (
    !validDate(t.startDate) ||
    !numeric(t.weeks, 1, 52) ||
    !Number.isInteger(t.weeks) ||
    !numeric(t.hours, 1, 80) ||
    !numeric(t.reviewMultiplier, 0.1, 2) ||
    typeof t.timezone !== "string"
  )
    return fail();
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: t.timezone }).format();
  } catch {
    return fail();
  }
  for (const [id, p] of Object.entries(s.progress))
    if (!ids.has(id) || !checkProgress(p)) return fail();
  const seen = new Set<string>();
  const events = new Set<string>();
  for (const a of s.history) {
    if (
      !object(a) ||
      !ids.has(a.problemId) ||
      typeof a.id !== "string" ||
      !a.id ||
      !validDate(a.day) ||
      ![1, 2, 3, 4].includes(a.rating) ||
      !numeric(a.minutes, 1, 600) ||
      typeof a.wasNew !== "boolean" ||
      (a.previous !== null && !checkProgress(a.previous))
    )
      return fail();
    const key = a.day + ":" + a.problemId;
    if (seen.has(key) || events.has(a.id) || !s.progress[a.problemId])
      return fail();
    seen.add(key);
    events.add(a.id);
  }
  return structuredClone(s);
}
type Store = Pick<Storage, "getItem" | "setItem">;
export function saveState(
  next: StudyState,
  expectedRevision: number | null,
  store: Store = localStorage,
) {
  const raw = store.getItem(STORAGE_KEY);
  if (raw && expectedRevision !== null) {
    const existing = validateState(JSON.parse(raw));
    if (existing.revision !== expectedRevision)
      throw new Error(
        "Progress changed in another tab. Reload this page before saving.",
      );
  }
  store.setItem(STORAGE_KEY, JSON.stringify(validateState(next)));
}
export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? validateState(JSON.parse(raw)) : null;
}
export function downloadBackup(state: StudyState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `grind-recall-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
