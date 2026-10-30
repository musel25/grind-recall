import { test } from "node:test";
import assert from "node:assert/strict";
import {
  problems,
  initialState,
  recordAttempt,
  undoAttempt,
  setDayMinutes,
  setProblemSkipped,
  setStudyBreak,
  markMorningStudy,
} from "../src/model";
import { activeProblems } from "../src/catalog";
import { dailyPlan, addDays, studyWeek } from "../src/scheduler";
import { simulatePace } from "../src/planning";
import { validateState } from "../src/storage";
import type { StudyState } from "../src/types";

const day = "2026-10-28";
const first = "pb-01-write-a-property";
const python = () => problems.filter((p) => !!p.course);
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

test("all five Python courses stay active and retain 72 ordered Cojudge links", () => {
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
    assert.ok(activeProblems().some((active) => active.id === p.id));
  }
  const state = setDayMinutes(initialState(day), day, 240);
  for (const p of python().filter(
    (p) => p.course !== "pybites-decorators-context-managers",
  ))
    state.progress[p.id] = { ...saved };
  assert.equal(
    dailyPlan(state, day).newProblems.find((p) => p.course)?.id,
    "pbdc-01-create-a-sandwich-decorator",
  );
});

test("Python first-study and review budgets use 60 percent of the previous durations", () => {
  for (const [difficulty, initial, review] of [
    ["Easy", 18, 9],
    ["Medium", 36, 18],
    ["Hard", 54, 27],
  ] as const) {
    const p = python().find((p) => p.difficulty === difficulty)!;
    assert.ok(p);
    let state = setDayMinutes(initialState(day), day, initial);
    for (const other of activeProblems(state))
      if (other.id !== p.id) state.progress[other.id] = { ...saved };
    const plan = dailyPlan(state, day);
    assert.deepEqual(
      plan.newProblems.map((p) => p.id),
      [p.id],
    );
    assert.equal(plan.newMinutes, initial);
    assert.equal(simulatePace(state, day, 10, 30).minutes, initial);
    state = recordAttempt(state, p.id, 1, day, initial, "");
    assert.equal(dailyPlan(state, "2026-10-29").reviewMinutes, review);
    state.settings.reviewMultiplier = 0.5;
    assert.equal(
      dailyPlan(state, "2026-10-29").reviewMinutes,
      Math.round(review / 2),
    );
  }
  const algorithm = problems.find((p) => p.id === "two-sum")!;
  assert.equal(algorithm.minutes, 15);
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
    assert.ok(dailyPlan(state, due).reviews.some((p) => p.id === first));
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

test("legacy completions remain intact and enter reviews without invented ratings", () => {
  const legacy = legacyCompletion();
  const restored = validateState(JSON.parse(JSON.stringify(legacy)));
  assert.deepEqual(restored, legacy);
  assert.equal(restored.progress[first].card, null);
  assert.deepEqual(
    dailyPlan(restored, "2026-10-29").reviews.map((p) => p.id),
    [first],
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

test("new algorithms and Python exercises still alternate without refilling completed work", () => {
  let state = setDayMinutes(initialState(day, true), day, 240);
  const queue = dailyPlan(state, day).newProblems;
  assert.ok(queue.some((p) => p.course));
  assert.ok(queue.some((p) => !p.course));
  for (let i = 1; i < queue.length; i++)
    assert.notEqual(!!queue[i].course, !!queue[i - 1].course);
  assert.ok(dailyPlan(state, day).totalMinutes <= 240);
  assert.equal(queue.filter((p) => p.course)[0].id, first);
  for (const p of [...queue].reverse())
    state = recordAttempt(state, p.id, 3, day, 15, "");
  assert.equal(dailyPlan(state, day).newProblems.length, 0);
  assert.equal(
    dailyPlan(state, "2026-10-29").newProblems[0]?.course,
    "pybites-oop",
  );
});

test("skips and breaks retain Python review dates, cards, course order and algorithm progress", () => {
  const original = setDayMinutes(initialState(day, true), day, 240);
  const queue = dailyPlan(original, day).newProblems;
  const skipped = setProblemSkipped(original, day, first, true);
  assert.deepEqual(
    dailyPlan(skipped, day).newProblems.map((p) => p.id),
    queue.filter((p) => p.id !== first).map((p) => p.id),
  );
  assert.equal(
    dailyPlan(skipped, "2026-10-29").newProblems.find((p) => p.course)?.id,
    first,
  );
  const state = recordAttempt(
    initialState(day),
    first,
    1,
    day,
    18,
    "Keep this",
  );
  const due = state.progress[first].due;
  const skippedReview = setProblemSkipped(state, due, first, true);
  assert.ok(!dailyPlan(skippedReview, due).reviews.some((p) => p.id === first));
  assert.deepEqual(skippedReview.progress, state.progress);
  assert.ok(
    dailyPlan(skippedReview, addDays(due, 1)).reviews.some(
      (p) => p.id === first,
    ),
  );
  const onBreak = setStudyBreak(state, due, addDays(due, 2));
  assert.equal(onBreak.progress[first].due, addDays(due, 3));
  assert.equal(
    onBreak.progress[first].card!.stability,
    state.progress[first].card!.stability,
  );
  assert.deepEqual(dailyPlan(onBreak, due).reviews, []);
  assert.ok(
    dailyPlan(onBreak, addDays(due, 3)).reviews.some((p) => p.id === first),
  );
});

test("morning Python study stays unrated until evening and undo restores the pending item", () => {
  const state = markMorningStudy(initialState(day), first, day, true);
  assert.deepEqual(state.progress, {});
  assert.deepEqual(state.history, []);
  assert.ok(dailyPlan(state, day).eveningProblems.some((p) => p.id === first));
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
  const rated = recordAttempt(state, first, 3, day, 18, "");
  assert.ok(!dailyPlan(rated, day).eveningProblems.some((p) => p.id === first));
  assert.ok(
    dailyPlan(undoAttempt(rated), day).eveningProblems.some(
      (p) => p.id === first,
    ),
  );
});

test("forecast includes Python reviews and final study without changing saved progress", () => {
  const state = setDayMinutes(initialState(day), "2026-10-29", 240);
  for (const p of activeProblems(state))
    if (p.id !== first) state.progress[p.id] = { ...saved };
  const reviewId = python().find(
    (p) => p.id !== first && p.difficulty === "Easy",
  )!.id;
  state.progress[reviewId] = { ...saved, due: "2026-10-29" };
  const before = JSON.stringify(state);
  const result = simulatePace(state, "2026-10-29", 10, 30);
  assert.equal(result.finish, "2026-10-29");
  assert.equal(result.minutes, 27);
  assert.equal(JSON.stringify(state), before);
});
