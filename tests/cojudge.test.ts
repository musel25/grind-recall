import { test } from "node:test";
import assert from "node:assert/strict";
import {
  problems,
  initialState,
  recordAttempt,
  undoAttempt,
} from "../src/model";
import { activeProblems } from "../src/catalog";
import { dailyPlan, addDays, studyWeek } from "../src/scheduler";
import { validateState } from "../src/storage";
import type { StudyState } from "../src/types";

const day = "2026-10-28";
const first = "pb-01-write-a-property";
const python = () => problems.filter((p) => p.course?.startsWith("pybites-"));
const saved = {
  due: "2027-01-01",
  card: null,
  imported: true,
  independent: false,
  note: "",
};
function legacyCompletion(): StudyState {
  const state = initialState(day);
  state.progress[first] = {
    ...saved,
    due: day,
    imported: false,
    note: "Read-only property",
  };
  state.history.push({
    id: "legacy-completion",
    problemId: first,
    day,
    rating: null,
    minutes: 25,
    wasNew: true,
    previous: null,
  });
  return state;
}

test("all five Python catalogs retain 72 ordered archived Cojudge links", () => {
  assert.equal(python().length, 72);
  assert.deepEqual(
    [...new Set(python().map((p) => p.course))],
    [
      "pybites-oop",
      "pybites-pytest",
      "pybites-data-formats",
      "pybites-collections",
      "pybites-decorators-context-managers",
    ],
  );
  assert.deepEqual(
    [
      "pybites-oop",
      "pybites-pytest",
      "pybites-data-formats",
      "pybites-collections",
      "pybites-decorators-context-managers",
    ].map((course) => python().filter((p) => p.course === course).length),
    [22, 10, 17, 11, 12],
  );
  for (const p of python()) {
    assert.equal(p.url, `https://cojudge.musel.dev/problems/${p.id}`);
    assert.equal(
      activeProblems().some((active) => active.id === p.id),
      false,
    );
  }
});

test("Python ratings create review cards, retain notes and time, and undo restores progress", () => {
  for (const rating of [1, 2, 3, 4] as const) {
    const original = initialState(day, true);
    const state = recordAttempt(
      original,
      first,
      rating,
      day,
      18,
      "Read-only property",
    );
    assert.equal(state.history.at(-1)!.rating, rating);
    assert.ok(state.progress[first].card);
    assert.equal(state.progress[first].note, "Read-only property");
    assert.equal(studyWeek(state, day).doneMinutes, 18);
    const due = state.progress[first].due;
    assert.ok(due > day);
    assert.ok(!dailyPlan(state, due).reviews.some((p) => p.id === first));
    assert.ok(!dailyPlan(state, day).reviews.some((p) => p.id === first));
    assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
    assert.deepEqual(undoAttempt(state).progress, original.progress);
    assert.deepEqual(original.progress, initialState(day, true).progress);
    assert.throws(
      () => recordAttempt(state, first, rating, day, 18, ""),
      /already/,
    );
    const reviewed = recordAttempt(state, first, 1, due, 9, "Remember setter");
    assert.equal(reviewed.progress[first].due, addDays(due, 1));
    assert.equal(reviewed.progress[first].card!.reps, 2);
    assert.deepEqual(undoAttempt(reviewed).progress, state.progress);
  }
  assert.throws(
    () => recordAttempt(initialState(day), first, null, day, 18, ""),
    /rating/i,
  );
});

test("legacy completions remain intact in the archive without invented ratings", () => {
  const legacy = legacyCompletion();
  const restored = validateState(JSON.parse(JSON.stringify(legacy)));
  assert.deepEqual(restored, legacy);
  assert.equal(restored.progress[first].card, null);
  assert.deepEqual(
    dailyPlan(restored, "2026-10-29").reviews.map((p) => p.id),
    [],
  );
  assert.ok(!dailyPlan(restored, day).newProblems.some((p) => p.id === first));
  const rated = recordAttempt(
    restored,
    first,
    3,
    "2026-10-29",
    9,
    "Keep the note",
  );
  assert.equal(rated.history[0].rating, null);
  assert.equal(rated.history[0].minutes, 25);
  assert.ok(rated.progress[first].card);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(rated))), rated);
  assert.deepEqual(undoAttempt(rated).progress, legacy.progress);
  assert.deepEqual(undoAttempt(rated).history, legacy.history);
});

test("backup validation permits old completions only as one unrated first attempt", () => {
  const legacy = legacyCompletion();
  const duplicate = structuredClone(legacy);
  duplicate.history.push({
    ...duplicate.history[0],
    id: "duplicate",
    day: "2026-10-29",
  });
  assert.throws(() => validateState(duplicate));
  for (const invalid of [
    { wasNew: false },
    { previous: { ...saved } },
    { problemId: "two-sum" },
    { rating: 5 },
  ]) {
    const state = structuredClone(legacy);
    Object.assign(state.history[0], invalid);
    if (invalid.problemId) state.progress[invalid.problemId] = { ...saved };
    assert.throws(() => validateState(state));
  }
  const afterRating = recordAttempt(legacy, first, 3, "2026-10-29", 9, "");
  afterRating.history.push({
    ...legacy.history[0],
    id: "late-null",
    day: "2026-10-30",
  });
  assert.throws(() => validateState(afterRating));
});
