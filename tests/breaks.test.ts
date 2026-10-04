import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, recordAttempt, setStudyBreak } from "../src/model";
import { dailyPlan, nextReview, reviewDay, studyWeek } from "../src/scheduler";
import { validateState } from "../src/storage";
const day = "2026-10-04";
test("Thursday through Sunday is free; four imported reviews resume Monday", () => {
  const original = initialState(day, true);
  const s = setStudyBreak(original, "2026-10-08", "2026-10-11");
  for (const date of ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]) {
    const p = dailyPlan(s, date);
    assert.equal(p.onBreak, true);
    assert.equal(p.newProblems.length, 0);
    assert.equal(p.reviews.length, 0);
    assert.equal(p.nextExtra, undefined);
  }
  assert.equal(reviewDay("2026-10-08", s), "2026-10-12");
  assert.equal(reviewDay("2026-10-09", s), "2026-10-12");
  assert.equal(
    Object.values(s.progress).filter(
      (p) => reviewDay(p.due, s) === "2026-10-12",
    ).length,
    4,
  );
  assert.equal(studyWeek(s, day).autoMinutes, 150); // 600 / four available days
  assert.equal(s.settings.weeks, 15);
  assert.equal(dailyPlan(s, day).end, "2027-01-16");
  assert.deepEqual(original.progress, s.progress);
});
test("rating preview and saved first exposure use the same post-break date", () => {
  const s = setStudyBreak(initialState(day), "2026-10-08", "2026-10-11");
  const preview = nextReview(null, 3, "2026-10-07", s);
  const next = recordAttempt(s, "two-sum", 3, "2026-10-07", 15, "");
  assert.equal(preview.due, "2026-10-12");
  assert.equal(next.progress["two-sum"].due, preview.due);
  assert.equal(next.progress["two-sum"].card!.scheduled_days, 5);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(next))), next);
});
test("invalid break dates rejected; consecutive breaks and cleared breaks work", () => {
  const s = initialState(day);
  assert.throws(() => setStudyBreak(s, "2026-10-11", "2026-10-08"));
  assert.throws(() => setStudyBreak(s, "bad", "2026-10-08"));
  const paused = setStudyBreak(s, "2026-10-08", "2026-10-11");
  const cleared = setStudyBreak(paused, null, null);
  assert.equal(reviewDay("2026-10-08", cleared), "2026-10-08");
  const invalid = structuredClone(paused);
  invalid.planning!.breaks = ["2026-99-99"];
  assert.throws(() => validateState(invalid));
});
