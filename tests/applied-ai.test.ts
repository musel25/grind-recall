import { test } from "node:test";
import assert from "node:assert/strict";
import {
  activeProblems,
  archivedProblems,
  cojudgeCourses,
  problems,
} from "../src/catalog";
import {
  initialState,
  markMorningStudy,
  recordAttempt,
  setDayMinutes,
  setProblemSkipped,
  undoAttempt,
} from "../src/model";
import { addDays, dailyPlan } from "../src/scheduler";
import { estimatePlan, simulatePace } from "../src/planning";
import { validateState } from "../src/storage";

const day = "2026-11-04";
const ids = [
  "ai-01-clean-documents",
  "ai-02-split-documents",
  "ai-03-find-similar-documents",
  "ai-04-build-context",
  "ai-05-validate-extracted-tasks",
  "ai-06-check-citations",
  "ai-07-evaluate-search",
  "ai-08-cache-embeddings",
  "ai-09-retry-failed-requests",
];
const ai = () => activeProblems().filter((p) => p.course === "applied-ai-nine");

test("nine ordered AI exercises join Grind 75 without reactivating the Python archive", () => {
  assert.deepEqual(
    ai().map((p) => p.id),
    ids,
  );
  assert.equal(
    cojudgeCourses.find((c) => c.id === "applied-ai-nine")?.title,
    "Applied AI — 9 Exercises",
  );
  assert.equal(activeProblems().length, 84);
  const practicedExtras = initialState(day);
  for (const id of [
    "meeting-rooms",
    "roman-to-integer",
    "house-robber",
    "subarray-sum-equals-k",
  ])
    practicedExtras.progress[id] = {
      due: day,
      card: null,
      imported: true,
      independent: true,
      note: "Keep extra",
    };
  assert.equal(activeProblems(practicedExtras).length, 88);
  for (const p of ai()) {
    assert.equal(p.url, `https://cojudge.musel.dev/problems/${p.id}`);
    assert.equal(p.review, true);
    assert.equal(p.deferred, false);
    assert.ok(!p.retired);
    assert.ok(p.minutes > 0);
  }
  assert.equal(
    archivedProblems().filter((p) => p.course?.startsWith("pybites-")).length,
    72,
  );
});

test("AI and algorithm assignments alternate in order within one stable daily budget", () => {
  let state = setDayMinutes(initialState(day), day, 180);
  const queue = dailyPlan(state, day).newProblems;
  assert.equal(queue[0].core, true);
  assert.equal(queue[1].id, ids[0]);
  assert.equal(queue[2].core, true);
  assert.equal(queue[3].id, ids[1]);
  assert.ok(dailyPlan(state, day).totalMinutes <= 180);
  const skipped = setProblemSkipped(state, day, ids[0], true);
  assert.deepEqual(
    dailyPlan(skipped, day).newProblems.map((p) => p.id),
    queue.filter((p) => p.id !== ids[0]).map((p) => p.id),
  );
  for (const p of queue)
    state = recordAttempt(state, p.id, 3, day, 1, "Fast completion");
  assert.equal(dailyPlan(state, day).newProblems.length, 0);
  const next = dailyPlan(state, addDays(day, 1)).newProblems;
  assert.ok(next.length > 0);
  assert.equal(!!next[0].course, !queue.at(-1)!.course);
});

test("archived first attempts cannot change the next active learning track", () => {
  const nextDay = addDays(day, 1);
  const archived = problems.find((p) => p.retired)!;
  let state = setDayMinutes(initialState(day), nextDay, 180);
  state = recordAttempt(state, "contains-duplicate", 3, day, 15, "Keep");
  const queue = dailyPlan(state, nextDay).newProblems.map((p) => p.id);
  assert.equal(queue[0], ids[0]);
  state = recordAttempt(state, archived.id, 3, day, 15, "Archived");
  assert.deepEqual(
    dailyPlan(state, nextDay).newProblems.map((p) => p.id),
    queue,
  );
});

test("all AI ratings preserve FSRS memory, notes, morning work, backups, and Undo", () => {
  const archived = problems.find((p) => p.retired)!;
  for (const rating of [1, 2, 3, 4] as const) {
    let before = recordAttempt(
      initialState(day),
      archived.id,
      3,
      day,
      15,
      "Keep archived note",
    );
    before = recordAttempt(
      before,
      "house-robber",
      3,
      day,
      15,
      "Keep LeetCode note",
    );
    before = markMorningStudy(before, ids[0], day, true);
    assert.deepEqual(
      dailyPlan(before, day).eveningProblems.map((p) => p.id),
      [ids[0]],
    );
    const state = recordAttempt(
      before,
      ids[0],
      rating,
      day,
      20,
      "Keep AI note",
    );
    const progress = state.progress[ids[0]];
    assert.equal(state.history.at(-1)!.rating, rating);
    assert.equal(progress.card!.reps, 1);
    assert.equal(progress.note, "Keep AI note");
    assert.equal(dailyPlan(state, day).eveningProblems.length, 0);
    assert.ok(
      dailyPlan(
        setDayMinutes(state, progress.due, 0),
        progress.due,
      ).reviews.some((p) => p.id === ids[0]),
    );
    assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
    assert.deepEqual(state.progress[archived.id], before.progress[archived.id]);
    assert.deepEqual(
      state.progress["house-robber"],
      before.progress["house-robber"],
    );
    const undone = undoAttempt(state);
    assert.deepEqual(undone.progress, before.progress);
    assert.deepEqual(undone.history, before.history);
    assert.deepEqual(undone.morningStudy, before.morningStudy);
    assert.deepEqual(
      dailyPlan(undone, day).eveningProblems.map((p) => p.id),
      [ids[0]],
    );
    const reviewed = recordAttempt(state, ids[0], 1, progress.due, 10, "Retry");
    assert.equal(reviewed.progress[ids[0]].card!.reps, 2);
    assert.equal(reviewed.progress[ids[0]].due, addDays(progress.due, 1));
  }
});

test("forecasts require every AI first attempt and keep saved data unchanged", () => {
  let state = initialState(day);
  for (const p of activeProblems(state).filter((p) => !p.course))
    state.progress[p.id] = {
      due: "2099-01-01",
      card: null,
      imported: true,
      independent: true,
      note: "Keep",
    };
  const before = structuredClone(state);
  assert.ok(!estimatePlan(state, day).completed);
  assert.ok(simulatePace(state, day, 10).finish);
  assert.deepEqual(state, before);
  for (const id of ids) state = recordAttempt(state, id, 3, day, 20, "AI");
  assert.equal(estimatePlan(state, day).completed, true);
  assert.equal(dailyPlan(state, day).newProblems.length, 0);
});
