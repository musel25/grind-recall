import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, setStudyBreak, problems } from "../src/model";
import { nextReview, addDays, dailyPlan } from "../src/scheduler";
import { estimatePlan, simulatePace, applyEstimate } from "../src/planning";
import { validateState } from "../src/storage";
const day = "2026-10-04";
const base = () =>
  setStudyBreak(initialState(day, true), "2026-10-08", "2026-10-12");
test("first rating changes interval immediately; failure returns next study day", () => {
  const s = base();
  const dates = [2, 3, 4].map(
    (r) => nextReview(null, r as 2 | 3 | 4, day, s).due,
  );
  assert.ok(dates[0] < dates[1]);
  assert.ok(dates[1] < dates[2]);
  assert.equal(nextReview(null, 1, "2026-10-07", s).due, "2026-10-13");
});
test("time mode extends duration, preserves budget, history and pause; more time finishes sooner", () => {
  const s = base();
  s.settings.weeks = 1;
  const before = JSON.stringify(s);
  const a = estimatePlan(s, day);
  assert.ok(a.finish! > addDays(day, 6));
  assert.equal(a.hours, 10);
  assert.ok(a.weeks > 1);
  const fast = base();
  fast.settings.hours = 20;
  const b = estimatePlan(fast, day);
  assert.ok(b.finish! < a.finish!);
  assert.equal(JSON.stringify(s), before);
  assert.equal(a.finish, simulatePace(s, day, 10).finish);
});
test("deadline mode solves budget against the same actual daily queue", () => {
  const s = base();
  s.settings.planMode = "deadline";
  s.settings.weeks = 20;
  s.settings.hours = 1; // Deliberately insufficient starting budget.
  const a = estimatePlan(s, day);
  assert.ok(a.hours > s.settings.hours);
  assert.equal(a.weeks, 20);
  assert.ok(a.finish! <= addDays(day, 139));
  assert.equal(simulatePace(s, day, a.hours).finish, a.finish);
});
test("impossible target and tiny budgets report no feasible result, not fake dates", () => {
  // Two study days before a one-week deadline exceed the 80-hour weekly cap.
  const s = setStudyBreak(initialState(day, true), "2026-10-06", "2026-10-12");
  s.settings.planMode = "deadline";
  s.settings.weeks = 1;
  assert.equal(estimatePlan(s, day).feasible, false);
  const tiny = base();
  tiny.settings.hours = 1;
  assert.equal(estimatePlan(tiny, day).finish, null);
});
test("legacy backups work; valid mode persists and invalid mode rejected", () => {
  const s = base();
  assert.deepEqual(validateState(s), s);
  s.settings.planMode = "time";
  assert.equal(validateState(s).settings.planMode, "time");
  (s.settings as any).planMode = "wrong";
  assert.throws(() => validateState(s));
});

test("long elapsed time produces a state that can still save practice", () => {
  const s = initialState("2020-01-01", true);
  const e = estimatePlan(s, day);
  assert.ok(e.weeks > 200);
  assert.doesNotThrow(() => validateState(applyEstimate(s, e)));
});
test("completed deadline plans preserve review budget and cannot claim a missed deadline was met", () => {
  const s = base();
  s.settings.planMode = "deadline";
  s.settings.weeks = 1;
  for (const p of problems)
    s.progress[p.id] = {
      due: "2026-10-15",
      card: null,
      imported: true,
      note: "",
      independent: false,
    };
  const e = estimatePlan(s, "2026-10-15");
  assert.equal(e.completed, true);
  assert.equal(e.hours, 10);
  assert.equal(e.feasible, false);
});

test("an exact finish date overrides whole weeks and survives backup and forecast updates", () => {
  const s = base();
  Object.assign(s.settings, {
    planMode: "deadline",
    weeks: 1,
    finishDate: "2027-02-16",
  });
  const before = structuredClone(s);
  const estimate = estimatePlan(s, day);
  assert.equal(estimate.target, "2027-02-16");
  assert.equal(estimate.weeks, 20);
  assert.ok(estimate.feasible);
  assert.ok(estimate.finish! <= "2027-02-16");
  const saved = validateState(
    JSON.parse(JSON.stringify(applyEstimate(s, estimate))),
  );
  assert.equal(estimatePlan(saved, day).target, "2027-02-16");
  assert.equal(dailyPlan(saved, day).end, "2027-02-16");
  assert.deepEqual(saved.progress, before.progress);
  assert.deepEqual(saved.history, before.history);
  assert.deepEqual(saved.planning, before.planning);
  assert.deepEqual(s, before);
});

test("a finish date cannot borrow study days from the rounded final week", () => {
  const s = initialState(day);
  Object.assign(s.settings, {
    planMode: "deadline",
    weeks: 20,
    finishDate: day,
  });
  assert.equal(estimatePlan(s, day).target, day);
  assert.equal(estimatePlan(s, day).feasible, false);
});

test("invalid finish dates are rejected and old week-based deadlines keep their exact date", () => {
  const s = base();
  s.settings.planMode = "deadline";
  s.settings.weeks = 20;
  const legacy = estimatePlan(s, day);
  assert.equal(legacy.target, "2027-02-20");
  for (const finishDate of [
    "",
    "2027-02-29",
    "2026-10-03",
    "bad",
    null,
    123,
    "2030-08-04",
  ]) {
    const invalid = structuredClone(s);
    Object.assign(invalid.settings, { finishDate });
    assert.throws(() => validateState(invalid));
  }
});
