import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeProblems,
  archivedProblems,
  problems,
  progressSummary,
} from "../src/catalog";
import {
  initialState,
  markMorningStudy,
  recordAttempt,
  setDayMinutes,
} from "../src/model";
import { dailyPlan, reviewSlot, addDays } from "../src/scheduler";
import { simulatePace, estimatePlan } from "../src/planning";
import { validateState } from "../src/storage";

const day = "2026-11-04";
const python = problems.filter((p) => p.course);

test("all Python courses stay archived even with saved progress and morning marks", () => {
  let state = initialState(day);
  for (const p of python) {
    state = markMorningStudy(state, p.id, day, true);
    state = recordAttempt(state, p.id, 3, day, 15, "Keep this note");
  }
  const restored = validateState(JSON.parse(JSON.stringify(state)));
  const before = structuredClone(restored);
  assert.equal(python.length, 72);
  assert.ok(python.every((p) => p.retired && p.deferred));
  assert.equal(activeProblems(restored).length, 75);
  assert.equal(archivedProblems(restored).filter((p) => p.course).length, 72);
  assert.deepEqual(progressSummary(restored), {
    total: 75,
    practiced: 0,
    independent: 0,
  });
  const plan = dailyPlan(restored, addDays(day, 1));
  assert.ok(
    [...plan.reviews, ...plan.newProblems, ...plan.eveningProblems].every(
      (p) => !p.course,
    ),
  );
  assert.deepEqual(restored, before);
});

test("archived pending morning work and explicit extras cannot enter the daily queue", () => {
  let state = markMorningStudy(
    setDayMinutes(initialState(day), day, 240),
    python[0].id,
    day,
    true,
  );
  state.planning!.days[day] = { extras: [python[1].id] };
  const before = structuredClone(state);
  const plan = dailyPlan(state, day);
  assert.ok(
    [...plan.newProblems, ...plan.eveningProblems].every((p) => !p.course),
  );
  assert.deepEqual(state, before);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
});

test("Grind 75 and practiced LeetCode extras stay active while Python does not affect forecasts", () => {
  let state = initialState(day);
  const extra = problems.find((p) => !p.core && !p.course)!;
  state = recordAttempt(state, extra.id, 3, day, 30, "Keep LeetCode");
  assert.equal(activeProblems(state).length, 76);
  assert.ok(activeProblems(state).some((p) => p.id === extra.id));
  const forecast = simulatePace(state, addDays(day, 1), 10, 730);
  state = recordAttempt(state, python[0].id, 1, day, 15, "Keep Python");
  assert.deepEqual(simulatePace(state, addDays(day, 1), 10, 730), forecast);
  assert.equal(state.progress[extra.id].note, "Keep LeetCode");
});

test("retired review dates do not occupy active review slots", () => {
  const state = initialState(day);
  const due = addDays(day, 7);
  for (const p of [...python, ...activeProblems().slice(0, 3)])
    state.progress[p.id] = {
      due,
      card: null,
      imported: true,
      independent: false,
      note: "Keep",
    };
  assert.equal(reviewSlot(due, state), due);
});

test("a later archived Python completion cannot change the active plan finish date", () => {
  let state = initialState("2026-11-01");
  for (const p of activeProblems(state))
    state = recordAttempt(state, p.id, 3, "2026-11-01", 15, "");
  const before = structuredClone(state);
  const finish = estimatePlan(state, day);
  assert.equal(finish.finish, "2026-11-01");
  state = recordAttempt(state, python[0].id, 3, "2026-11-03", 15, "Keep");
  assert.deepEqual(estimatePlan(state, day), finish);
  assert.deepEqual(state.history.slice(0, -1), before.history);
});
