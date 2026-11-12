import { test } from "node:test";
import assert from "node:assert/strict";
import * as model from "../src/model";
import { activeProblems } from "../src/catalog";
import { addDays, dailyPlan, nextReview } from "../src/scheduler";
import { validateState } from "../src/storage";

const day = "2026-11-10";

test("a seven-day review limit moves excess work, counts today's reviews, and preserves saved work", () => {
  let s = model.initialState(addDays(day, -7));
  const active = activeProblems(s);
  for (const p of active.slice(0, 35)) {
    s = model.recordAttempt(s, p.id, 3, addDays(day, -7), 15, "keep note");
    s.progress[p.id].due = day;
    s.progress[p.id].card!.due = day + "T12:00:00.000Z";
  }
  s = model.recordAttempt(s, active[0].id, 3, day, 13, "keep today");
  const before = structuredClone(s);
  assert.equal(typeof model.setReviewWindow, "function");
  const result = model.setReviewWindow(s, day, addDays(day, 6), 4);
  assert.deepEqual(s, before);
  assert.deepEqual(result.history, before.history);
  assert.deepEqual(result.settings, before.settings);
  for (let i = 0; i < 7; i++) {
    const date = addDays(day, i);
    const completed = result.history.filter(
      (a) => a.day === date && !a.wasNew,
    ).length;
    assert.ok(dailyPlan(result, date).reviews.length <= 4 - completed);
    // Advance through the scheduled work so due dates do not accumulate.
    for (const p of dailyPlan(result, date).reviews)
      result.progress[p.id].due = "2027-01-01";
  }
  const saved = model.setReviewWindow(s, day, addDays(day, 6), 4);
  assert.ok(Object.values(saved.progress).some((p) => p.due > addDays(day, 6)));
  for (const [id, p] of Object.entries(saved.progress)) {
    assert.equal(p.note, before.progress[id].note);
    const { due, scheduled_days, ...memory } = p.card!;
    const {
      due: oldDue,
      scheduled_days: oldDays,
      ...oldMemory
    } = before.progress[id].card!;
    assert.deepEqual(memory, oldMemory);
    assert.equal(due.slice(0, 10), p.due);
  }
  assert.deepEqual(validateState(saved), saved);
  assert.deepEqual(
    model.setReviewWindow(saved, day, addDays(day, 6), 4).progress,
    saved.progress,
  );
});

test("new ratings and failed retries use available slots within the limited week", () => {
  let s = model.initialState(day);
  assert.equal(typeof model.setReviewWindow, "function");
  const active = activeProblems(s);
  for (const p of active.slice(0, 12))
    s.progress[p.id] = {
      due: addDays(day, 1),
      card: null,
      imported: true,
      note: "",
      independent: false,
    };
  s = model.setReviewWindow(s, day, addDays(day, 6), 4);
  for (const grade of [1, 3] as const) {
    const preview = nextReview(null, grade, day, s, active[12].id);
    const saved = model.recordAttempt(s, active[12].id, grade, day, 15, "");
    assert.equal(saved.progress[active[12].id].due, preview.due);
    const occupied = Object.values(s.progress).filter(
      (p) => p.due === preview.due,
    ).length;
    assert.ok(occupied < 4);
  }
});

test("missed days and breaks keep the four-review limit when the window is rebalanced", () => {
  let s = model.initialState(day, true);
  assert.equal(typeof model.setReviewWindow, "function");
  s = model.setReviewWindow(s, day, addDays(day, 6), 4);
  s = model.setStudyBreak(s, addDays(day, 1), addDays(day, 2));
  s = model.rebalanceReviewWindow(s, addDays(day, 4));
  assert.ok(dailyPlan(s, addDays(day, 4)).reviews.length <= 4);
  assert.ok(
    Object.values(s.progress).every(
      (p) => !s.planning!.breaks!.includes(p.due),
    ),
  );
  assert.deepEqual(model.rebalanceReviewWindow(s, addDays(day, 4)), s);
});

test("invalid review windows are rejected without changing the state", () => {
  const s = model.initialState(day);
  assert.equal(typeof model.setReviewWindow, "function");
  for (const max of [0, 4.5, 101, NaN])
    assert.throws(() => model.setReviewWindow(s, day, addDays(day, 6), max));
  assert.throws(() => model.setReviewWindow(s, "bad", day, 4));
  assert.throws(() => model.setReviewWindow(s, day, addDays(day, -1), 4));
  const invalid = {
    ...s,
    planning: {
      days: {},
      weeks: {},
      reviewWindow: { start: day, end: day, maxPerDay: 0 },
    },
  };
  assert.throws(() => validateState(invalid));
});

test("completed practiced extras reserve slots while the window is rebalanced", () => {
  let s = model.initialState(addDays(day, -7));
  const extras = model.problems
    .filter((p) => p.deferred && !p.retired && !p.course)
    .slice(0, 4);
  assert.equal(extras.length, 4);
  for (const p of [...extras, ...activeProblems(s).slice(0, 4)])
    s = model.recordAttempt(s, p.id, 3, addDays(day, -7), 15, "");
  for (const p of extras) s = model.recordAttempt(s, p.id, 1, day, 15, "");
  for (const p of activeProblems(s)
    .filter((p) => !extras.some((extra) => extra.id === p.id))
    .slice(0, 4)) {
    s.progress[p.id].due = day;
    s.progress[p.id].card!.due = day + "T12:00:00.000Z";
  }
  s = model.setReviewWindow(s, day, addDays(day, 6), 4);
  assert.equal(dailyPlan(s, day).reviews.length, 0);
});

test("Again preview respects a full window reached after a study break", () => {
  let s = model.initialState(day);
  s = model.setStudyBreak(s, addDays(day, 1), addDays(day, 1));
  s = model.setReviewWindow(s, addDays(day, 2), addDays(day, 6), 4);
  const candidates = activeProblems(s).filter((p) => !s.progress[p.id]);
  for (const p of candidates.slice(0, 4))
    s.progress[p.id] = {
      due: addDays(day, 2),
      card: null,
      imported: true,
      note: "",
      independent: false,
    };
  const id = candidates[4].id;
  const preview = nextReview(null, 1, day, s, id);
  const saved = model.rebalanceReviewWindow(
    model.recordAttempt(s, id, 1, day, 15, ""),
    day,
  );
  assert.equal(preview.due, addDays(day, 3));
  assert.equal(saved.progress[id].due, preview.due);
});

test("manual review appears on a chosen day without changing saved memory", () => {
  let state = model.initialState(day);
  const id = activeProblems(state)[0].id;
  state = model.recordAttempt(state, id, 3, day, 15, "saved note");
  const target = addDays(day, 2);
  state.progress[id].due = addDays(day, 20);
  state.progress[id].card!.due = addDays(day, 20) + "T12:00:00.000Z";
  const before = structuredClone(state.progress[id]);
  const added = model.addManualReview(state, target, id);
  assert.deepEqual(state.progress[id], before);
  assert.deepEqual(added.progress[id], before);
  assert.deepEqual(added.planning!.days[target].reviews, [id]);
  assert.equal(dailyPlan(added, addDays(day, 1)).reviews.length, 0);
  assert.ok(dailyPlan(added, target).reviews.some((p) => p.id === id));
  assert.deepEqual(validateState(added), added);
  const removed = model.removeManualReview(added, target, id);
  assert.deepEqual(removed.progress[id], before);
  assert.equal(dailyPlan(removed, target).reviews.length, 0);
});

test("manual review rejects duplicate, unpracticed, due, and break-day work", () => {
  let state = model.initialState(day);
  const active = activeProblems(state);
  const target = addDays(day, 2);
  assert.throws(() => model.addManualReview(state, target, active[0].id));
  state = model.recordAttempt(state, active[0].id, 3, day, 15, "");
  state.progress[active[0].id].due = addDays(day, 20);
  state.progress[active[0].id].card!.due = addDays(day, 20) + "T12:00:00.000Z";
  state = model.addManualReview(state, target, active[0].id);
  assert.throws(() => model.addManualReview(state, target, active[0].id));
  state = model.setStudyBreak(state, addDays(day, 3), addDays(day, 3));
  assert.throws(() =>
    model.addManualReview(state, addDays(day, 3), active[0].id),
  );
  assert.equal(dailyPlan(state, addDays(day, 3)).reviews.length, 0);
  const invalid = structuredClone(state);
  invalid.planning!.days[target].reviews = [active[0].id, active[0].id];
  assert.throws(() => validateState(invalid));
  const beforeStart = model.initialState(addDays(day, 5));
  beforeStart.progress[active[0].id] = {
    due: addDays(day, 20),
    card: null,
    imported: true,
    note: "",
    independent: false,
  };
  assert.throws(() =>
    model.addManualReview(beforeStart, addDays(day, 2), active[0].id),
  );
});

test("manual review adds work above the automatic review limit", () => {
  let state = model.initialState(day);
  const [manual, automatic] = activeProblems(state);
  for (const [id, due] of [
    [manual.id, addDays(day, 20)],
    [automatic.id, addDays(day, 1)],
  ])
    state.progress[id] = {
      due,
      card: null,
      imported: true,
      note: "",
      independent: false,
    };
  state = model.addManualReview(state, addDays(day, 1), manual.id);
  state = model.setReviewWindow(state, addDays(day, 1), addDays(day, 3), 1);
  assert.equal(state.progress[automatic.id].due, addDays(day, 1));
  assert.deepEqual(
    dailyPlan(state, addDays(day, 1)).reviews.map((p) => p.id),
    [automatic.id, manual.id],
  );
});

test("manual review stays due after a missed day and clears after practice", () => {
  let state = model.initialState(day);
  const id = activeProblems(state)[0].id;
  state.progress[id] = {
    due: addDays(day, 30),
    card: null,
    imported: true,
    note: "keep",
    independent: false,
  };
  const target = addDays(day, 2);
  state = model.addManualReview(state, target, id);
  assert.ok(
    dailyPlan(state, addDays(target, 1)).reviews.some((p) => p.id === id),
  );
  state = model.recordAttempt(state, id, 3, addDays(target, 1), 15, "rated");
  assert.equal(
    dailyPlan(state, addDays(target, 2)).reviews.some((p) => p.id === id),
    false,
  );
});

test("adding a review to today keeps the original new problem list", () => {
  let state = model.setDayMinutes(model.initialState(day), day, 80);
  state.progress["two-sum"] = {
    due: addDays(day, 30),
    card: null,
    imported: true,
    note: "",
    independent: false,
  };
  const before = dailyPlan(state, day);
  assert.deepEqual(
    before.newProblems.map((p) => p.id),
    ["contains-duplicate", "valid-anagram", "ransom-note"],
  );
  state = model.addManualReview(state, day, "two-sum");
  assert.deepEqual(
    dailyPlan(state, day).newProblems.map((p) => p.id),
    ["contains-duplicate", "valid-anagram", "ransom-note"],
  );
  assert.deepEqual(
    dailyPlan(state, day).reviews.map((p) => p.id),
    ["two-sum"],
  );
  state = model.recordAttempt(state, "two-sum", 3, day, 10, "extra recall");
  assert.deepEqual(
    dailyPlan(state, day).newProblems.map((p) => p.id),
    ["contains-duplicate", "valid-anagram", "ransom-note"],
  );
});

test("rating an extra review does not move an automatic review", () => {
  let state = model.initialState(day);
  const [manual, automatic] = activeProblems(state);
  state.progress[manual.id] = {
    due: addDays(day, 30),
    card: null,
    imported: true,
    note: "",
    independent: false,
  };
  state.progress[automatic.id] = {
    due: day,
    card: null,
    imported: true,
    note: "",
    independent: false,
  };
  state = model.setReviewWindow(state, day, addDays(day, 2), 1);
  state = model.addManualReview(state, day, manual.id);
  state = model.recordAttempt(state, manual.id, 3, day, 10, "extra");
  state = model.rebalanceReviewWindow(state, day);
  assert.equal(state.progress[automatic.id].due, day);
  assert.ok(dailyPlan(state, day).reviews.some((p) => p.id === automatic.id));
});
