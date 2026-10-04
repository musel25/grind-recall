import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  markMorningStudy,
  recordAttempt,
  undoAttempt,
  setStudyBreak,
} from "../src/model";
import { dailyPlan } from "../src/scheduler";
import { validateState } from "../src/storage";
const day = "2026-10-04";
test("morning marker preserves rating history and queue; rating resolves it and undo restores it", () => {
  const s = initialState(day, true);
  const before = dailyPlan(s, day);
  const id = before.newProblems[0].id;
  const marked = markMorningStudy(s, id, day, true);
  assert.deepEqual(marked.progress, s.progress);
  assert.deepEqual(marked.history, s.history);
  const plan = dailyPlan(marked, day);
  assert.deepEqual(plan.newProblems, before.newProblems);
  assert.equal(plan.eveningProblems.length, 1);
  assert.equal(plan.eveningProblems[0].id, id);
  const rated = recordAttempt(marked, id, 3, day, 30, "");
  assert.equal(dailyPlan(rated, day).eveningProblems.length, 0);
  assert.equal(dailyPlan(undoAttempt(rated), day).eveningProblems.length, 1);
  assert.throws(() => markMorningStudy(rated, id, day, true));
});
test("unrated morning work persists across days and breaks, without duplicates or losing future reviews", () => {
  let s = initialState(day, true);
  s = markMorningStudy(s, "n-queens", day, true);
  s = markMorningStudy(s, "two-sum", day, true);
  assert.equal(dailyPlan(s, day).eveningProblems.length, 2);
  const later = dailyPlan(s, "2026-10-07");
  assert.equal(later.eveningProblems.length, 2);
  assert.equal(later.newProblems.filter((p) => p.id === "n-queens").length, 1);
  assert.equal(later.reviews.filter((p) => p.id === "two-sum").length, 1);
  s = setStudyBreak(s, "2026-10-08", "2026-10-12");
  assert.equal(dailyPlan(s, "2026-10-09").eveningProblems.length, 0);
  assert.equal(dailyPlan(s, "2026-10-13").eveningProblems.length, 2);
  assert.equal(
    dailyPlan(
      markMorningStudy(s, "n-queens", "2026-10-13", false),
      "2026-10-13",
    ).eveningProblems.length,
    1,
  );
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))), s);
  assert.throws(() => markMorningStudy(s, "missing", day, true));
  assert.throws(() =>
    validateState({ ...s, morningStudy: { "two-sum": "invalid" } }),
  );
  assert.throws(() => validateState({ ...s, morningStudy: { missing: day } }));
});
