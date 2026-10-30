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
  "pybites-oop": [1, 2, 3, 4, 7, 9, 10, 12, 15],
  "pybites-pytest": [1, 2, 3, 5, 6, 7, 9, 10],
  "pybites-data-formats": [2, 4, 5, 9, 11, 12, 14],
  "pybites-collections": [1, 2, 3, 5, 7, 8, 9, 11],
  "pybites-decorators-context-managers": [1, 2, 3, 4, 7, 9, 12],
};
const number = (id: string) => Number(id.match(/^[a-z]+-(\d+)-/)![1]);
const first = "pb-01-write-a-property";
const optional = "pb-06-subclass-the-dict-built-in";
const selected = problems.filter(
  (p) => p.course && selectedNumbers[p.course].includes(number(p.id)),
);

test("the default Python plan contains the 39 selected exercises across all five topics", () => {
  const active = activeProblems();
  assert.equal(active.filter((p) => p.course).length, 39);
  for (const course of cojudgeCourses) {
    assert.deepEqual(
      active.filter((p) => p.course === course.id).map((p) => number(p.id)),
      selectedNumbers[course.id],
    );
  }
  assert.equal(
    active.filter((p) => p.course && p.difficulty === "Hard").length,
    7,
  );
  assert.equal(archivedProblems().filter((p) => p.course).length, 33);
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
    minutes: 18,
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
