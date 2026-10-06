import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  recordAttempt,
  setStudyBreak,
  problems,
  undoAttempt,
} from "../src/model";
import {
  dailyPlan,
  nextReview,
  reviewDay,
  studyWeek,
  reviewSlot,
} from "../src/scheduler";
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
  assert.deepEqual(original.history, s.history);
  assert.equal(original.progress[problems[9].id].due, "2026-10-09");
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

test("a break spreads 19 reviews, preserves memory, and saves stable appointments", () => {
  let original = initialState(day);
  for (const p of problems.slice(0, 19))
    original = recordAttempt(original, p.id, 3, day, 15, "keep note");
  const snapshot = structuredClone(original);
  const s = setStudyBreak(original, "2026-10-05", "2026-10-12");
  const counts = [13, 14, 15].map(
    (n) =>
      Object.values(s.progress).filter((p) => p.due === `2026-10-${n}`).length,
  );
  assert.deepEqual(counts, [7, 7, 5]);
  assert.deepEqual(original, snapshot);
  assert.deepEqual(s.history, original.history);
  for (const [id, p] of Object.entries(s.progress)) {
    assert.equal(p.note, "keep note");
    const { due, scheduled_days, ...memory } = p.card!;
    const {
      due: oldDue,
      scheduled_days: oldDays,
      ...oldMemory
    } = original.progress[id].card!;
    assert.deepEqual(memory, oldMemory);
    assert.equal(due.slice(0, 10), p.due);
  }
  assert.deepEqual(
    setStudyBreak(s, "2026-10-05", "2026-10-12").progress,
    s.progress,
  );
  assert.deepEqual(setStudyBreak(s, null, null).progress, s.progress);
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))), s);
});

test("occupied spill days bound postponement and Again retries stay prompt", () => {
  let s = initialState(day);
  for (const p of problems.slice(0, 30))
    s = recordAttempt(s, p.id, 3, day, 15, "");
  for (const p of Object.values(s.progress)) {
    p.due = "2026-10-14";
    p.card!.due = p.due + "T12:00:00.000Z";
  }
  s = recordAttempt(s, problems[30].id, 1, day, 15, "retry");
  s = setStudyBreak(s, "2026-10-05", "2026-10-12");
  assert.equal(s.progress[problems[30].id].due, "2026-10-13");
  assert.equal(
    Object.values(s.progress).filter((p) => p.due === "2026-10-14").length,
    30,
  );
  const preview = nextReview(null, 3, "2026-10-10", s, problems[31].id);
  const saved = recordAttempt(s, problems[31].id, 3, "2026-10-10", 15, "");
  assert.equal(saved.progress[problems[31].id].due, preview.due);
  assert.ok(preview.due <= "2026-10-16");
});

test("allocator excludes the current card, reserves full days, and bounds spill", () => {
  const s = initialState(day);
  for (const [i, p] of problems.slice(0, 24).entries())
    s.progress[p.id] = {
      due: `2026-10-${13 + Math.floor(i / 8)}`,
      card: null,
      imported: true,
      independent: false,
      note: "",
    };
  assert.equal(reviewSlot("2026-10-13", s), "2026-10-13"); // all full: earliest tie
  delete s.progress[problems[23].id];
  assert.equal(reviewSlot("2026-10-13", s), "2026-10-15"); // least loaded, still full
  delete s.progress[problems[7].id];
  assert.equal(reviewSlot("2026-10-13", s, problems[0].id), "2026-10-13");
  assert.equal(reviewSlot("2026-10-13", s), "2026-10-13"); // seven ties with later days
  assert.equal(nextReview(null, 1, "2026-10-12", s).due, "2026-10-13");
});

test("break priority, replacement and undo preserve memory without restoring break dates", () => {
  let s = initialState(day);
  for (const p of problems.slice(0, 19))
    s = recordAttempt(s, p.id, 4, day, 15, "");
  s.progress[problems[18].id].card!.stability = 0.1;
  s = setStudyBreak(s, "2026-10-05", "2026-10-20");
  assert.equal(s.progress[problems[18].id].due, "2026-10-21");
  const replaced = setStudyBreak(s, "2026-10-21", "2026-10-24");
  assert.ok(
    Object.values(replaced.progress).every(
      (p) => p.due >= "2026-10-25" && p.due <= "2026-10-27",
    ),
  );
  const id = problems[0].id;
  const before = recordAttempt(initialState(day), id, 1, day, 15, "remember");
  const after = recordAttempt(before, id, 3, "2026-10-05", 15, "new note");
  const undone = undoAttempt(setStudyBreak(after, "2026-10-05", "2026-10-12"));
  assert.equal(undone.progress[id].due, "2026-10-13");
  assert.equal(
    undone.progress[id].card!.stability,
    before.progress[id].card!.stability,
  );
  assert.equal(undone.progress[id].note, "remember");
});

test("re-saving a legacy break upgrades stored dates once", () => {
  const s = initialState(day, true);
  s.planning = { days: {}, weeks: {}, breaks: ["2026-10-08", "2026-10-09"] };
  const saved = setStudyBreak(s, "2026-10-08", "2026-10-09");
  assert.ok(
    Object.values(saved.progress).every(
      (p) => !s.planning!.breaks!.includes(p.due),
    ),
  );
  assert.deepEqual(
    setStudyBreak(saved, "2026-10-08", "2026-10-09").progress,
    saved.progress,
  );
});
