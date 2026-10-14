import { test } from "node:test";
import assert from "node:assert/strict";
import * as model from "../src/model";
import { dailyPlan } from "../src/scheduler";
import { simulatePace, estimatePlan, applyEstimate } from "../src/planning";
import { validateState } from "../src/storage";
const day = "2026-10-13";
const tomorrow = "2026-10-14";
// Optional lookup lets the missing feature fail as an assertion, not an import error.
const skip = (s: modelState, id: string, skipped = true) => {
  assert.equal(typeof model.setProblemSkipped, "function");
  return model.setProblemSkipped(s, day, id, skipped);
};
type modelState = ReturnType<typeof model.initialState>;
const ids = (ps: { id: string }[]) => ps.map((p) => p.id);

test("skipping the last two assignments never refills today; tomorrow keeps learning order", () => {
  const base = model.setDayMinutes(model.initialState(day), day, 120);
  const original = dailyPlan(base, day).newProblems;
  assert.ok(original.length >= 3);
  const skipped = original.slice(-2);
  let s = skip(skip(base, skipped[0].id), skipped[1].id);
  assert.deepEqual(
    ids(dailyPlan(s, day).newProblems),
    ids(original.slice(0, -2)),
  );
  assert.equal(
    dailyPlan(s, day).nextExtra?.id,
    dailyPlan(base, day).nextExtra?.id,
  );
  for (const p of dailyPlan(s, day).newProblems)
    s = model.recordAttempt(s, p.id, 3, day, 5, "");
  assert.equal(dailyPlan(s, day).newProblems.length, 0);
  assert.deepEqual(
    ids(dailyPlan(s, tomorrow).newProblems).slice(0, 2),
    ids(skipped),
  );
  assert.deepEqual(base.history, []);
});

test("skipped reviews keep memory and dates, reserve today's room, and return after a break", () => {
  let base = model.recordAttempt(
    model.initialState(day),
    "two-sum",
    1,
    "2026-10-12",
    20,
    "note",
  );
  base = model.setDayMinutes(base, day, 120);
  const before = dailyPlan(base, day);
  let s = skip(base, "two-sum");
  assert.equal(dailyPlan(s, day).reviews.length, 0);
  assert.deepEqual(ids(dailyPlan(s, day).newProblems), ids(before.newProblems));
  assert.equal(
    dailyPlan(s, day).totalMinutes,
    before.totalMinutes - before.reviewMinutes,
  );
  assert.deepEqual(s.progress, base.progress);
  assert.deepEqual(s.history, base.history);
  assert.ok(dailyPlan(s, tomorrow).reviews.some((p) => p.id === "two-sum"));
  s = model.setStudyBreak(s, tomorrow, tomorrow);
  assert.equal(dailyPlan(s, tomorrow).reviews.length, 0);
  assert.ok(dailyPlan(s, "2026-10-15").reviews.some((p) => p.id === "two-sum"));
});

test("morning work and extras can be skipped, persisted, and restored individually", () => {
  let base = model.setDayMinutes(model.initialState(day), day, 0);
  base = model.addExtraProblem(base, day);
  const id = dailyPlan(base, day).newProblems[0].id;
  base = model.markMorningStudy(base, id, day, true);
  const s = validateState(JSON.parse(JSON.stringify(skip(base, id))));
  assert.equal(dailyPlan(s, day).newProblems.length, 0);
  assert.equal(dailyPlan(s, day).eveningProblems.length, 0);
  assert.equal(dailyPlan(s, day).skippedProblems[0].id, id);
  assert.equal(dailyPlan(s, tomorrow).eveningProblems[0].id, id);
  const restored = skip(s, id, false);
  assert.deepEqual(ids(dailyPlan(restored, day).newProblems), [id]);
  assert.deepEqual(ids(dailyPlan(restored, day).eveningProblems), [id]);
  assert.deepEqual(restored.morningStudy, base.morningStudy);
});

test("skipping is idempotent and rejects unknown, unassigned, or completed work", () => {
  const base = model.initialState(day);
  const id = dailyPlan(base, day).newProblems[0].id;
  const s = skip(base, id);
  assert.deepEqual(skip(s, id), s);
  assert.throws(() => skip(base, "fake"));
  assert.throws(() => skip(base, model.problems.at(-1)!.id));
  assert.throws(() => skip(model.recordAttempt(base, id, 3, day, 20, ""), id));
});

test("backup validation rejects malformed skip lists and accepts old backups", () => {
  const base = model.initialState(day);
  assert.deepEqual(validateState(base), base);
  for (const skipped of [["fake"], ["two-sum", "two-sum"], "two-sum", null]) {
    const s = {
      ...base,
      planning: { days: { [day]: { extras: [], skipped } }, weeks: {} },
    };
    assert.throws(() => validateState(s));
  }
});

test("forecasts respect skipping today and deadline recalculation cannot refill today's queue", () => {
  let s = model.initialState(day);
  for (const p of model.problems.slice(1))
    s.progress[p.id] = {
      due: "2027-01-01",
      card: null,
      imported: true,
      note: "",
      independent: true,
    };
  s = skip(s, "two-sum");
  assert.equal(simulatePace(s, day, 10).finish, tomorrow);
  s.settings.planMode = "deadline";
  assert.equal(
    dailyPlan(applyEstimate(s, estimatePlan(s, day)), day).newProblems.length,
    0,
  );
});

test("undoing all skips restores automatic budgeting but preserves explicit time overrides", () => {
  const base = model.initialState(day);
  const [first, second] = dailyPlan(base, day).newProblems;
  let s = skip(skip(base, first.id), second.id);
  s = skip(s, first.id, false);
  assert.equal(
    dailyPlan(model.setWeekHours(s, day, 20), day).budgetMinutes,
    86,
  );
  s = skip(s, second.id, false);
  assert.equal(
    dailyPlan(model.setWeekHours(s, day, 20), day).budgetMinutes,
    200,
  );
  let explicit = model.setDayMinutes(base, day, 120);
  explicit = skip(skip(explicit, first.id), first.id, false);
  assert.equal(
    dailyPlan(model.setWeekHours(explicit, day, 20), day).budgetMinutes,
    120,
  );
});
