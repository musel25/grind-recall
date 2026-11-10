import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  recordAttempt,
  setDayMinutes,
  setProblemSkipped,
  undoAttempt,
} from "../src/model";
import { dailyPlan } from "../src/scheduler";

const day = "2026-11-10";
test("daily assignments use the closest whole-problem total including reviews", () => {
  let s = setDayMinutes(initialState(day), day, 78);
  s.settings.reviewMultiplier = 0.5;
  s.progress["two-sum"] = {
    due: day,
    card: null,
    imported: true,
    note: "",
    independent: false,
  };
  const plan = dailyPlan(s, day);
  assert.equal(plan.reviewMinutes, 8);
  assert.equal(plan.totalMinutes, 68);
  // 8 review + two 30m first-study problems + one 30m problem = 98;
  // the closest ordered total is 68, rather than 98.
  s = setDayMinutes(s, day, 90);
  assert.equal(dailyPlan(s, day).totalMinutes, 98);
});

test("closest-budget assignments remain stable after fast completions and skips", () => {
  let s = setDayMinutes(initialState(day), day, 78);
  const original = dailyPlan(s, day);
  assert.equal(original.totalMinutes, 90);
  // Completing out of order must not add another problem.
  const last = original.newProblems.at(-1)!;
  s = recordAttempt(s, last.id, 3, day, 5, "");
  assert.deepEqual(
    dailyPlan(s, day).newProblems.map((p) => p.id),
    original.newProblems.filter((p) => p.id !== last.id).map((p) => p.id),
  );
  const first = dailyPlan(s, day).newProblems[0];
  s = setProblemSkipped(s, day, first.id, true);
  assert.equal(
    dailyPlan(s, day).newProblems.length,
    original.newProblems.length - 2,
  );
  s = undoAttempt(s);
  assert.ok(dailyPlan(s, day).newProblems.some((p) => p.id === last.id));
});
