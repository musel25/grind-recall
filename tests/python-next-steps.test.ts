import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeProblems,
  archivedProblems,
  progressSummary,
} from "../src/catalog";
import { initialState, recordAttempt } from "../src/model";
import { dailyPlan } from "../src/scheduler";
import { validateState } from "../src/storage";

const day = "2026-11-12";

test("a new Python plan uses the 40 Cojudge problems in course order", () => {
  const state = initialState(day, false, "python-next-steps");
  const saved = validateState(JSON.parse(JSON.stringify(state)));
  const active = activeProblems(saved);
  assert.equal(saved.settings.curriculum, "python-next-steps");
  assert.equal(active.length, 40);
  assert.equal(active[0].id, "pns-01-sum-even-numbers");
  assert.equal(active[39].id, "pns-40-counter-class");
  assert.ok(active.every((p) => p.course === "python-next-steps"));
  assert.ok(active.every((p) => p.url.endsWith(`/problems/${p.id}`)));
  assert.deepEqual(progressSummary(saved), {
    total: 40,
    practiced: 0,
    independent: 0,
  });
  const queue = dailyPlan(saved, day);
  assert.ok(queue.newProblems.length > 0);
  assert.ok(queue.newProblems.every((p) => p.course === "python-next-steps"));
});

test("a Python attempt stays in the saved plan and receives a review", () => {
  const state = initialState(day, false, "python-next-steps");
  const next = recordAttempt(
    state,
    "pns-01-sum-even-numbers",
    3,
    day,
    12,
    "loop",
  );
  const saved = validateState(JSON.parse(JSON.stringify(next)));
  assert.equal(saved.progress["pns-01-sum-even-numbers"].note, "loop");
  assert.equal(progressSummary(saved).practiced, 1);
  assert.ok(
    activeProblems(saved).some((p) => p.id === "pns-01-sum-even-numbers"),
  );
  assert.ok(
    !archivedProblems(saved).some((p) => p.id === "pns-01-sum-even-numbers"),
  );
});

test("old plans keep Grind 75 and unsupported plan identifiers fail validation", () => {
  const legacy = initialState(day);
  const saved = validateState(JSON.parse(JSON.stringify(legacy)));
  assert.equal(saved.settings.curriculum, undefined);
  assert.equal(activeProblems(saved).length, 75);
  assert.equal(archivedProblems(saved).length, 200);
  assert.ok(
    archivedProblems(saved).every((p) => p.course !== "python-next-steps"),
  );
  assert.throws(() =>
    validateState({
      ...saved,
      settings: { ...saved.settings, curriculum: "other" },
    }),
  );
});
