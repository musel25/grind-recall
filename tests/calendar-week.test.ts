import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  recordAttempt,
  setStudyBreak,
  setWeekHours,
} from "../src/model";
import { dailyPlan, studyWeek } from "../src/scheduler";

test("weekly progress resets on Monday, including across year boundaries", () => {
  let s = initialState("2026-10-04");
  s = recordAttempt(s, "two-sum", 3, "2026-10-11", 40, "");
  assert.equal(studyWeek(s, "2026-10-11").start, "2026-10-05");
  assert.equal(studyWeek(s, "2026-10-11").doneMinutes, 40);
  assert.equal(studyWeek(s, "2026-10-12").doneMinutes, 0);
  assert.equal(studyWeek(s, "2026-10-14").end, "2026-10-18");
  assert.equal(studyWeek(s, "2027-01-01").start, "2026-12-28");
});

test("first partial week prorates the usual goal and explicit overrides remain exact", () => {
  const s = initialState("2026-10-04");
  assert.equal(studyWeek(s, "2026-10-04").goalMinutes, 86);
  assert.equal(studyWeek(s, "2026-10-04").autoMinutes, 86);
  assert.equal(studyWeek(s, "2026-10-05").goalMinutes, 600);
  assert.equal(
    studyWeek(setWeekHours(s, "2026-10-04", 2), "2026-10-04").goalMinutes,
    120,
  );
});

test("Monday budget redistributes weekly time and stays stable during today's practice", () => {
  let s = initialState("2026-10-04");
  s.settings.hours = 10.5;
  s = setStudyBreak(s, "2026-10-08", "2026-10-12");
  s = recordAttempt(s, "two-sum", 3, "2026-10-13", 46, "");
  s = recordAttempt(s, "valid-parentheses", 3, "2026-10-14", 53, "");
  assert.equal(dailyPlan(s, "2026-10-14").budgetMinutes, 117);
  assert.equal(studyWeek(s, "2026-10-14").doneMinutes, 99);
});

test("legacy weekly overrides belong to the calendar week containing their date and can be cleared", () => {
  const s = initialState("2026-10-04");
  s.planning = { days: {}, weeks: { "2026-10-11": 12 } };
  assert.equal(studyWeek(s, "2026-10-07").goalMinutes, 720);
  assert.equal(
    studyWeek(setWeekHours(s, "2026-10-07", null), "2026-10-07").goalMinutes,
    600,
  );
  assert.equal(
    studyWeek(setWeekHours(s, "2026-10-07", 8), "2026-10-11").goalMinutes,
    480,
  );
});
