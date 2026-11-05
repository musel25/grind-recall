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
import { addDays, dailyPlan } from "../src/scheduler";
import { estimatePlan, simulatePace } from "../src/planning";
import { validateState } from "../src/storage";

const day = "2026-11-04";
const ai = problems.filter((p) => p.course === "applied-ai-nine");

test("all nine AI exercises stay archived with attempts, morning work, and stale daily extras", () => {
  let state = setDayMinutes(initialState(day), day, 240);
  for (const p of ai)
    state = recordAttempt(state, p.id, 1, addDays(day, -1), 20, "Keep AI note");
  state = markMorningStudy(state, ai[0].id, day, true);
  state.planning!.days[day].extras = ai.map((p) => p.id);
  const before = structuredClone(state);
  const restored = validateState(JSON.parse(JSON.stringify(state)));
  assert.equal(ai.length, 9);
  assert.equal(
    archivedProblems(restored).filter((p) => p.course === "applied-ai-nine")
      .length,
    9,
  );
  assert.deepEqual(progressSummary(restored), {
    total: 75,
    practiced: 0,
    independent: 0,
  });
  const plan = dailyPlan(restored, day);
  assert.ok(
    [...plan.reviews, ...plan.newProblems, ...plan.eveningProblems].every(
      (p) => !p.course,
    ),
  );
  assert.deepEqual(restored, before);
});

test("AI archive preserves LeetCode extras and does not extend forecasts or completion", () => {
  let state = recordAttempt(
    initialState(day),
    "roman-to-integer",
    3,
    day,
    15,
    "Keep extra",
  );
  assert.equal(activeProblems(state).length, 76);
  const forecast = simulatePace(state, "2026-11-09", 10);
  state = recordAttempt(state, ai[0].id, 1, day, 20, "Keep AI");
  assert.deepEqual(simulatePace(state, "2026-11-09", 10), forecast);
  for (const p of activeProblems(state).filter((p) => !state.progress[p.id]))
    state = recordAttempt(state, p.id, 3, day, 1, "");
  assert.equal(estimatePlan(state, day).completed, true);
  assert.equal(state.progress[ai[0].id].note, "Keep AI");
  assert.equal(state.progress["roman-to-integer"].card!.reps, 1);
});
