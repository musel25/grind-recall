import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeProblems,
  archivedProblems,
  cojudgeCourses,
  problems,
} from "../src/catalog";
import {
  initialState,
  markMorningStudy,
  recordAttempt,
  setDayMinutes,
  undoAttempt,
} from "../src/model";
import { dailyPlan } from "../src/scheduler";
import { simulatePace } from "../src/planning";
import { validateState } from "../src/storage";

const day = "2026-10-29";
const selectedNumbers: Record<string, number[]> = {
  "pybites-oop": [1, 2, 3, 4, 9, 12, 15],
  "pybites-pytest": [1, 3, 5, 6, 7, 10],
  "pybites-data-formats": [5, 9, 11, 14],
  "pybites-collections": [2, 3, 7, 8],
  "pybites-decorators-context-managers": [1, 3, 7, 12],
};
const number = (id: string) => Number(id.match(/^[a-z]+-(\d+)-/)![1]);
const first = "pb-01-write-a-property";
const optional = "pb-08-oop-fun-at-the-zoo";
const retired = "pb-06-subclass-the-dict-built-in";
const selected = problems.filter(
  (p) => p.course && selectedNumbers[p.course].includes(number(p.id)),
);

test("the default Python plan contains the 25 selected exercises across all five topics", () => {
  const active = activeProblems();
  assert.equal(active.filter((p) => p.course).length, 25);
  for (const course of cojudgeCourses) {
    assert.deepEqual(
      active.filter((p) => p.course === course.id).map((p) => number(p.id)),
      selectedNumbers[course.id],
    );
  }
  assert.equal(
    active.filter((p) => p.course && p.difficulty === "Hard").length,
    5,
  );
  assert.equal(archivedProblems().filter((p) => p.course).length, 47);
  assert.equal(problems.filter((p) => p.course).length, 72);
});

test("daily planning and the finish forecast exclude untouched optional exercises", () => {
  const state = setDayMinutes(initialState(day), day, 240);
  for (const p of problems
    .filter((p) => !p.course && (p.core || (p.bloomberg && !p.deferred)))
    .concat(selected)) {
    if (p.id !== first)
      state.progress[p.id] = {
        due: "2027-12-01",
        card: null,
        imported: true,
        independent: false,
        note: "",
      };
  }
  state.planning!.days[day].extras = [optional];
  const before = JSON.stringify(state);
  const plan = dailyPlan(state, day);
  assert.deepEqual(
    plan.newProblems.map((p) => p.id),
    [first],
  );
  assert.equal(plan.remainingCount, 1);
  assert.equal(plan.nextExtra, undefined);
  assert.deepEqual(simulatePace(state, day, 10, 30), {
    finish: day,
    minutes: 15,
  });
  assert.equal(JSON.stringify(state), before);
});

test("previously practiced optional exercises retain reviews, notes, backups, and Undo", () => {
  const original = initialState(day);
  const practiced = recordAttempt(
    original,
    optional,
    3,
    day,
    20,
    "Existing note",
  );
  const restored = validateState(JSON.parse(JSON.stringify(practiced)));
  assert.deepEqual(restored, practiced);
  assert.ok(activeProblems(restored).some((p) => p.id === optional));
  assert.ok(!archivedProblems(restored).some((p) => p.id === optional));
  assert.ok(
    dailyPlan(restored, restored.progress[optional].due).reviews.some(
      (p) => p.id === optional,
    ),
  );
  assert.equal(restored.progress[optional].note, "Existing note");
  const undone = undoAttempt(restored);
  assert.ok(!activeProblems(undone).some((p) => p.id === optional));
  assert.ok(archivedProblems(undone).some((p) => p.id === optional));
});

test("pending morning work on an optional exercise remains in the active plan", () => {
  const state = markMorningStudy(initialState(day), optional, day, true);
  assert.ok(activeProblems(state).some((p) => p.id === optional));
  assert.ok(
    dailyPlan(state, day).eveningProblems.some((p) => p.id === optional),
  );
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
  const removed = markMorningStudy(state, optional, day, false);
  assert.ok(!activeProblems(removed).some((p) => p.id === optional));
});

test("retired exercises leave reviews and forecasts but keep their saved progress", () => {
  const practiced = recordAttempt(
    initialState(day),
    retired,
    3,
    day,
    20,
    "Retired note",
  );
  assert.ok(!activeProblems(practiced).some((p) => p.id === retired));
  assert.ok(archivedProblems(practiced).some((p) => p.id === retired));
  assert.ok(
    !dailyPlan(practiced, practiced.progress[retired].due).reviews.some(
      (p) => p.id === retired,
    ),
  );
  assert.equal(practiced.progress[retired].note, "Retired note");
  assert.deepEqual(
    problems.filter((p) => p.retired).map((p) => number(p.id)),
    [5, 6, 7, 10],
  );
});
