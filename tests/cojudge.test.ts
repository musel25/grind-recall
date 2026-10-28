import { test } from "node:test";
import assert from "node:assert/strict";
import {
  problems,
  initialState,
  recordAttempt,
  undoAttempt,
  setDayMinutes,
  setProblemSkipped,
  setStudyBreak,
} from "../src/model";
import { activeProblems } from "../src/catalog";
import { dailyPlan, nextReview, studyWeek } from "../src/scheduler";
import { simulatePace } from "../src/planning";
import { validateState } from "../src/storage";

const day = "2026-10-28";
const first = "pb-01-write-a-property";
const python = () =>
  problems.filter((p) => p.url.startsWith("https://cojudge.musel.dev/"));

test("the four local courses retain their order and all 60 Cojudge exercise links", () => {
  assert.equal(python().length, 60);
  assert.deepEqual(
    [...new Set(python().map((p) => p.course))],
    [
      "pybites-oop",
      "pybites-pytest",
      "pybites-data-formats",
      "pybites-collections",
    ],
  );
  assert.deepEqual(
    [
      "pybites-oop",
      "pybites-pytest",
      "pybites-data-formats",
      "pybites-collections",
    ].map((course) => python().filter((p) => p.course === course).length),
    [22, 10, 17, 11],
  );
  for (const p of python()) {
    assert.equal(p.url, `https://cojudge.musel.dev/problems/${p.id}`);
    assert.equal(p.review, false);
    assert.ok(activeProblems().some((active) => active.id === p.id));
  }
  assert.ok(!problems.some((p) => p.id.startsWith("pbdc-")));
});

test("one completion stores time and a note without creating a rating or a review", () => {
  const original = initialState(day, true);
  const state = recordAttempt(
    original,
    first,
    null,
    day,
    25,
    "Read-only property",
  );
  assert.equal(state.history.at(-1)!.rating, null);
  assert.equal(state.progress[first].card, null);
  assert.equal(state.progress[first].note, "Read-only property");
  assert.equal(studyWeek(state, day).doneMinutes, 25);
  assert.deepEqual(original.progress, initialState(day, true).progress);
  for (const future of [day, "2026-10-29", "2026-11-28", "2027-10-28"]) {
    const plan = dailyPlan(state, future);
    assert.ok(
      ![...plan.reviews, ...plan.newProblems].some((p) => p.id === first),
    );
  }
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
  assert.deepEqual(undoAttempt(state).progress, original.progress);
  assert.throws(
    () => recordAttempt(state, first, null, "2026-10-29", 25, ""),
    /already/,
  );
  assert.throws(
    () => recordAttempt(original, "two-sum", null, day, 25, ""),
    /rating/i,
  );
});

test("old backups preserve algorithm work and one-time completions do not affect review slots", () => {
  const original = recordAttempt(
    initialState(day),
    "two-sum",
    3,
    day,
    20,
    "Keep this note",
  );
  assert.deepEqual(
    validateState(JSON.parse(JSON.stringify(original))),
    original,
  );
  const completed = recordAttempt(original, first, null, day, 25, "");
  assert.deepEqual(completed.progress["two-sum"], original.progress["two-sum"]);
  assert.deepEqual(
    nextReview(null, 3, day, completed),
    nextReview(null, 3, day, original),
  );
  const onBreak = setStudyBreak(completed, day, "2026-10-30");
  assert.deepEqual(onBreak.progress[first], completed.progress[first]);
});

test("backups cannot turn a course completion into a rated card or morning recall", () => {
  const completed = recordAttempt(initialState(day), first, null, day, 25, "");
  const rated = structuredClone(completed);
  rated.history[0].rating = 3;
  assert.throws(() => validateState(rated));
  const withCard = structuredClone(completed);
  withCard.progress[first].card = nextReview(null, 3, day).card;
  assert.throws(() => validateState(withCard));
  const morning = structuredClone(completed);
  morning.morningStudy = { [first]: "2026-10-29" };
  assert.throws(() => validateState(morning));
});

test("new algorithm problems and Python exercises share time without refilling completed work", () => {
  let state = setDayMinutes(initialState(day, true), day, 240);
  const queue = dailyPlan(state, day).newProblems;
  assert.ok(queue.some((p) => p.review === false));
  assert.ok(queue.some((p) => p.review !== false));
  assert.ok(dailyPlan(state, day).totalMinutes <= 240);
  assert.equal(queue.filter((p) => p.review === false)[0].id, first);
  for (const p of [...queue].reverse())
    state = recordAttempt(
      state,
      p.id,
      p.review === false ? null : 3,
      day,
      15,
      "",
    );
  assert.equal(dailyPlan(state, day).newProblems.length, 0);
  const next = dailyPlan(state, "2026-10-29");
  assert.ok(!next.reviews.some((p) => p.review === false));
});

test("skipping a Python exercise keeps today's other assignments and course order", () => {
  const original = setDayMinutes(initialState(day, true), day, 240);
  const queue = dailyPlan(original, day).newProblems;
  assert.ok(queue.some((p) => p.id === first));
  const skipped = setProblemSkipped(original, day, first, true);
  assert.deepEqual(
    dailyPlan(skipped, day).newProblems.map((p) => p.id),
    queue.filter((p) => p.id !== first).map((p) => p.id),
  );
  assert.equal(
    dailyPlan(skipped, "2026-10-29").newProblems.find((p) => p.review === false)
      ?.id,
    first,
  );
});

test("the forecast includes the final one-time exercise without changing saved progress", () => {
  const state = setDayMinutes(initialState(day), day, 240);
  for (const p of activeProblems(state))
    if (p.id !== first)
      state.progress[p.id] = {
        due: "2027-01-01",
        card: null,
        imported: true,
        independent: false,
        note: "",
      };
  const before = JSON.stringify(state);
  const result = simulatePace(state, day, 10, 30);
  assert.equal(result.finish, day);
  assert.equal(
    result.minutes,
    python().find((p) => p.id === first)!.minutes * 2,
  );
  assert.equal(JSON.stringify(state), before);
});
