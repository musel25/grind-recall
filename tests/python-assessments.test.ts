import { test } from "node:test";
import assert from "node:assert/strict";
import { activeProblems, archivedProblems } from "../src/catalog";
import { initialState, recordAttempt } from "../src/model";
import { estimatePlan } from "../src/planning";
import { dailyPlan } from "../src/scheduler";
import { validateState } from "../src/storage";

const day = "2026-11-23";

test("the assessment plan budgets one 90-minute first attempt and forecasts both assessments", () => {
  const state = initialState(day, false, "python-assessments");
  const active = activeProblems(state);
  assert.deepEqual(
    active.map((problem) => problem.id),
    ["tool-lending-desk", "community-workshop"],
  );
  assert.deepEqual(
    active.map((problem) => problem.url),
    [
      "https://cojudge.musel.dev/assessments/tool-lending-desk",
      "https://cojudge.musel.dev/assessments/community-workshop",
    ],
  );
  const plan = dailyPlan(state, day);
  assert.deepEqual(
    plan.newProblems.map((problem) => problem.id),
    ["tool-lending-desk"],
  );
  assert.equal(plan.newMinutes, 90);
  const forecast = estimatePlan(state, day);
  assert.equal(forecast.feasible, true);
  assert.ok(forecast.finish);
});

test("changing plans preserves rated attempts, notes, cards, and pending recall", () => {
  let state = recordAttempt(
    initialState(day),
    "two-sum",
    3,
    day,
    20,
    "Grind note",
  );
  state.settings.curriculum = "python-assessments";
  state = recordAttempt(
    state,
    "tool-lending-desk",
    3,
    day,
    90,
    "Check the expiry boundary",
  );
  state.morningStudy = { "community-workshop": day };
  const saved = validateState(JSON.parse(JSON.stringify(state)));
  const switched = validateState({
    ...saved,
    settings: { ...saved.settings, curriculum: undefined },
  });
  assert.deepEqual(switched.progress, saved.progress);
  assert.deepEqual(switched.history, saved.history);
  assert.deepEqual(switched.morningStudy, saved.morningStudy);
  const unrelated = [
    ...activeProblems(switched),
    ...archivedProblems(switched),
  ];
  assert.ok(
    unrelated.every((problem) => problem.course !== "python-assessments"),
  );
  const nextSteps = {
    ...saved,
    settings: { ...saved.settings, curriculum: "python-next-steps" as const },
  };
  assert.equal(activeProblems(nextSteps).length, 40);
  assert.equal(archivedProblems(nextSteps).length, 0);

  const restored = validateState({
    ...switched,
    settings: { ...switched.settings, curriculum: "python-assessments" },
  });
  const progress = restored.progress["tool-lending-desk"];
  assert.ok(progress.card);
  assert.equal(progress.note, "Check the expiry boundary");
  assert.deepEqual(
    dailyPlan(restored, progress.due).reviews.map((problem) => problem.id),
    ["tool-lending-desk"],
  );
});
