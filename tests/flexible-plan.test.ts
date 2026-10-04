import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  recordAttempt,
  undoAttempt,
  addExtraProblem,
  setDayMinutes,
  setWeekHours,
} from "../src/model";
import { dailyPlan, studyWeek } from "../src/scheduler";
import { validateState } from "../src/storage";
const day = "2026-10-04";
test("add one extra preserves the original queue and never duplicates a problem", () => {
  const original = initialState(day, true);
  const base = dailyPlan(original, day).newProblems.map((p) => p.id);
  const once = addExtraProblem(original, day);
  const twice = addExtraProblem(once, day);
  const queue = dailyPlan(twice, day).newProblems.map((p) => p.id);
  assert.deepEqual(queue.slice(0, base.length), base);
  assert.equal(queue.length, base.length + 2);
  assert.equal(new Set(queue).size, queue.length);
  assert.equal(original.history.length, 0);
  assert.equal(Object.keys(twice.progress).length, 10);
  assert.equal(twice.settings.hours, 10);
});
test("finishing an extra first does not remove other assignments, undo restores it", () => {
  let s = initialState(day, true);
  const base = dailyPlan(s, day).newProblems.map((p) => p.id);
  s = addExtraProblem(s, day);
  const id = dailyPlan(s, day).newProblems.at(-1)!.id;
  s = recordAttempt(s, id, 3, day, 40, "");
  assert.deepEqual(
    dailyPlan(s, day).newProblems.map((p) => p.id),
    base,
  );
  const week = studyWeek(s, day);
  assert.equal(week.doneMinutes, 40);
  s = undoAttempt(s);
  assert.ok(dailyPlan(s, day).newProblems.some((p) => p.id === id));
});
test("daily time and weekly overrides affect assignments without changing review dates", () => {
  const base = initialState(day, true);
  const more = setDayMinutes(base, day, 180);
  assert.ok(
    dailyPlan(more, day).newProblems.length >
      dailyPlan(base, day).newProblems.length,
  );
  assert.deepEqual(more.progress, base.progress);
  assert.equal(dailyPlan(more, "2026-10-05").budgetMinutes, 100);
  const busier = setWeekHours(base, day, 20);
  assert.equal(studyWeek(busier, day).goalMinutes, 1200);
  assert.ok(
    dailyPlan(busier, day).newProblems.length >
      dailyPlan(base, day).newProblems.length,
  );
  assert.equal(studyWeek(busier, "2026-10-11").goalMinutes, 600);
  assert.equal(busier.settings.hours, 10);
});
test("review-heavy or zero-time days keep reviews visible and permit explicit extras", () => {
  let s = setDayMinutes(initialState(day, true), "2026-10-05", 0);
  const p = dailyPlan(s, "2026-10-05");
  assert.equal(p.newProblems.length, 0);
  assert.equal(p.reviews.length, 2);
  s = addExtraProblem(s, "2026-10-05");
  assert.equal(dailyPlan(s, "2026-10-05").newProblems.length, 1);
  assert.equal(dailyPlan(s, "2026-10-05").reviews.length, 2);
});
test("extra practice reduces the automatic remaining-week budget and new week resets it", () => {
  const base = initialState(day);
  let s = setDayMinutes(base, day, 180);
  for (const p of dailyPlan(s, day).newProblems)
    s = recordAttempt(s, p.id, 3, day, p.minutes * 2, "");
  assert.ok(
    studyWeek(s, "2026-10-05").autoMinutes <
      studyWeek(base, "2026-10-05").autoMinutes,
  );
  assert.equal(studyWeek(s, "2026-10-11").autoMinutes, 86);
  assert.equal(studyWeek(s, "2026-10-11").doneMinutes, 0);
});
test("finished queue stays finished including extras, and another click adds exactly one", () => {
  let s = addExtraProblem(initialState(day, true), day);
  for (const p of dailyPlan(s, day).newProblems)
    s = recordAttempt(s, p.id, 3, day, 5, "");
  assert.equal(dailyPlan(s, day).newProblems.length, 0);
  s = addExtraProblem(s, day);
  assert.equal(dailyPlan(s, day).newProblems.length, 1);
});
test("legacy backup and flexible plan round-trip; invalid overrides rejected", () => {
  const legacy = initialState(day, true);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(legacy))), legacy);
  const s = setWeekHours(
    addExtraProblem(setDayMinutes(legacy, day, 180), day),
    day,
    20,
  );
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))), s);
  for (const bad of [-1, 1441, NaN])
    assert.throws(() => setDayMinutes(legacy, day, bad));
  for (const bad of [-1, 81, NaN])
    assert.throws(() => setWeekHours(legacy, day, bad));
  const invalid = structuredClone(s);
  invalid.planning!.days[day].extras = ["fake"];
  assert.throws(() => validateState(invalid));
  const duplicate = structuredClone(s);
  const extras = duplicate.planning!.days[day].extras;
  extras.push(extras[0]);
  assert.throws(() => validateState(duplicate));
});
