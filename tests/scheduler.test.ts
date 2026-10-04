import { test } from "node:test";
import assert from "node:assert/strict";
import {
  problems,
  initialState,
  recordAttempt,
  undoAttempt,
} from "../src/model.ts";
import {
  addDays,
  dayDiff,
  todayIn,
  nextReview,
  dailyPlan,
} from "../src/scheduler.ts";
const day = "2026-10-04";
test("dataset matches supplied 169 problem list and time budget", () => {
  assert.equal(problems.length, 169);
  assert.equal(new Set(problems.map((p) => p.id)).size, 169);
  assert.equal(
    problems.reduce((s, p) => s + p.minutes, 0),
    4575,
  );
  assert.deepEqual(
    ["Easy", "Medium", "Hard"].map(
      (d) => problems.filter((p) => p.difficulty === d).length,
    ),
    [41, 102, 26],
  );
});
test("calendar arithmetic survives DST and timezone boundary", () => {
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addDays("2026-11-01", 1), "2026-11-02");
  assert.equal(dayDiff("2026-10-04", "2027-01-16"), 104);
  assert.equal(
    todayIn("America/Tijuana", new Date("2026-10-05T03:00:00Z")),
    day,
  );
});
test("new attempts use FSRS; failures return tomorrow; successes expand interval", () => {
  let s = initialState(day, false);
  const id = problems[0].id;
  s = recordAttempt(s, id, 3, day, 15, "");
  assert.equal(s.progress[id].due, "2026-10-07");
  let card = s.progress[id].card!;
  let first = nextReview(card, 3, s.progress[id].due);
  let second = nextReview(first.card, 3, first.due);
  assert.ok(
    dayDiff(first.due, second.due) > dayDiff(s.progress[id].due, first.due),
  );
  assert.equal(
    nextReview(second.card, 1, second.due).due,
    addDays(second.due, 1),
  );
});
test("imported 10 keep unknown history and baseline reviews spread over five days", () => {
  const s = initialState(day, true);
  assert.equal(Object.keys(s.progress).length, 10);
  assert.equal(s.history.length, 0);
  assert.equal(
    Object.values(s.progress).filter((p) => p.due === "2026-10-05").length,
    2,
  );
  assert.equal(
    Object.values(s.progress).filter((p) => p.due === "2026-10-09").length,
    2,
  );
});
test("finishing new quota does not endlessly refill, duplicate clicks rejected, undo restores", () => {
  let s = initialState(day, false);
  const queue = dailyPlan(s, day).newProblems;
  assert.ok(queue.length > 0);
  for (const p of queue) s = recordAttempt(s, p.id, 3, day, p.minutes, "");
  assert.equal(dailyPlan(s, day).newProblems.length, 0);
  assert.throws(() => recordAttempt(s, queue[0].id, 3, day, 15, ""), /already/);
  s = undoAttempt(s);
  assert.equal(dailyPlan(s, day).newProblems.length, 1);
});
test("missed days adjust pace; overdue reviews remain unique; deadline does not stop reviews", () => {
  const s = initialState(day, true);
  const later = dailyPlan(s, "2026-10-20");
  assert.equal(later.reviews.length, 10);
  assert.equal(new Set(later.reviews.map((p) => p.id)).size, 10);
  assert.ok(later.targetMinutes > dailyPlan(s, day).targetMinutes);
  assert.equal(dailyPlan(s, "2026-10-03").newProblems.length, 0);
  assert.equal(dailyPlan(s, "2027-02-01").daysLeft, 0);
  assert.equal(dailyPlan(s, "2027-02-01").reviews.length, 10);
});
