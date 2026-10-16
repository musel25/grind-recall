import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, recordAttempt } from "../src/model";
import { dailyPlan } from "../src/scheduler";
import { estimatePlan } from "../src/planning";
import { validateState } from "../src/storage";
import original from "../docs/catalog/original-problems.json";
const day = "2026-10-15";
const saved = {
  due: "2026-12-01",
  card: null,
  imported: true,
  note: "Keep this",
  independent: false,
};
test("old backups keep practiced extras but never schedule untouched archive entries", () => {
  const s = initialState(day);
  // Simulate all original questions practiced except one outside both requested lists.
  for (const p of original)
    if (p.id !== "sudoku-solver") s.progress[p.id] = { ...saved };
  s.settings.hours = 80;
  s.planning = { days: { [day]: { extras: ["sudoku-solver"] } }, weeks: {} };
  const before = JSON.stringify(s);
  const plan = dailyPlan(validateState(s), day);
  assert.ok(!plan.newProblems.some((p) => p.id === "sudoku-solver"));
  assert.ok(
    plan.newProblems.some(
      (p) =>
        p.id === "using-a-robot-to-print-the-lexicographically-smallest-string",
    ),
  );
  assert.equal(JSON.stringify(s), before);
});
test("a practiced archived extra stays reviewable and survives a backup round trip", () => {
  const s = recordAttempt(
    initialState(day),
    "sudoku-solver",
    3,
    day,
    45,
    "Keep my reasoning",
  );
  const restored = validateState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored, s);
  assert.ok(
    dailyPlan(restored, restored.progress["sudoku-solver"].due).reviews.some(
      (p) => p.id === "sudoku-solver",
    ),
  );
});

import { activeProblems, archivedProblems, initialTen } from "../src/catalog";
import sources from "../docs/catalog/focused-sources.json";
import { problems } from "../src/model";
test("selected lists are complete, deduplicated and account-specific extras fill ordered slots", () => {
  const s = initialState(day);
  const active = activeProblems(s);
  assert.equal(sources.core.length, 75);
  assert.equal(sources.bloomberg.length, 57);
  assert.equal(active.length, 97);
  assert.equal(active.filter((p) => p.core && p.bloomberg).length, 17);
  assert.deepEqual(
    new Set(active.map((p) => p.id)),
    new Set([
      ...sources.core,
      ...sources.bloomberg
        .filter((p) => !approvedCuts.includes(p.id))
        .map((p) => p.id),
    ]),
  );
  assert.equal(archivedProblems(s).length, 97);
  s.progress["meeting-rooms"] = { ...saved };
  s.progress["roman-to-integer"] = { ...saved };
  const retained = activeProblems(s);
  assert.equal(retained.length, 99);
  assert.ok(!archivedProblems(s).some((p) => p.id === "meeting-rooms"));
  assert.ok(
    retained.findIndex((p) => p.id === "meeting-rooms") <
      retained.findIndex((p) => p.id === "merge-intervals"),
  );
  assert.deepEqual(
    retained.map((p) => p.order),
    Array.from({ length: 99 }, (_, i) => i + 1),
  );
  assert.equal(activeProblems(initialState(day)).length, 97);
});
test("onboarding imports the historical first ten even after reordering", () => {
  assert.deepEqual(
    initialTen,
    original.slice(0, 10).map((p) => p.id),
  );
  assert.deepEqual(Object.keys(initialState(day, true).progress), initialTen);
});
test("forecast finishes the focused list without scheduling the archive or mutating progress", () => {
  const s = initialState(day);
  for (const p of activeProblems(s)) s.progress[p.id] = { ...saved };
  s.progress["roman-to-integer"] = { ...saved };
  const before = JSON.stringify(s);
  assert.equal(estimatePlan(s, day).completed, true);
  assert.equal(dailyPlan(s, day).nextExtra, undefined);
  assert.equal(dailyPlan(s, day).newProblems.length, 0);
  assert.equal(JSON.stringify(s), before);
  delete s.progress["contains-duplicate"];
  assert.equal(dailyPlan(s, day).newProblems[0].id, "contains-duplicate");
  assert.equal(estimatePlan(s, day).finish, day);
});
test("new and legacy backup entries including Bloomberg additions survive validation unchanged", () => {
  let s = recordAttempt(
    initialState(day),
    "using-a-robot-to-print-the-lexicographically-smallest-string",
    3,
    day,
    40,
    "suffix minimum",
  );
  s = recordAttempt(s, "roman-to-integer", 1, day, 15, "extra");
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(s))), s);
});
test("focused applications follow their prerequisites even when optional extras are absent", () => {
  const active = activeProblems();
  const pairs = [
    ["contains-duplicate", "contains-duplicate-ii"],
    ["maximum-average-subarray-i", "find-all-anagrams-in-a-string"],
    ["3sum", "3sum-closest"],
    ["reverse-linked-list", "reverse-linked-list-ii"],
    ["middle-of-the-linked-list", "reorder-list"],
    [
      "binary-tree-level-order-traversal",
      "binary-tree-vertical-order-traversal",
    ],
    ["number-of-provinces", "accounts-merge"],
    ["clone-graph", "evaluate-division"],
    ["course-schedule", "minimum-height-trees"],
    ["rotting-oranges", "word-ladder"],
    ["fibonacci-number", "climbing-stairs"],
    ["climbing-stairs", "house-robber"],
    ["house-robber", "coin-change"],
    ["coin-change", "partition-equal-subset-sum"],
    ["coin-change", "stone-game-iv"],
    ["subsets", "combination-sum"],
    ["valid-parentheses", "decode-string"],
    [
      "min-stack",
      "using-a-robot-to-print-the-lexicographically-smallest-string",
    ],
    ["evaluate-reverse-polish-notation", "basic-calculator"],
    ["decode-string", "basic-calculator"],
    ["merge-two-sorted-lists", "lru-cache"],
    ["k-closest-points-to-origin", "merge-k-sorted-lists"],
    ["merge-k-sorted-lists", "find-median-from-data-stream"],
    ["merge-intervals", "maximum-profit-in-job-scheduling"],
    ["binary-search", "split-array-largest-sum"],
    ["binary-search", "median-of-two-sorted-arrays"],
    ["recyclable-and-low-fat-products", "article-views-i"],
    ["article-views-i", "game-play-analysis-iv"],
  ];
  for (const [a, b] of pairs.filter((pair) =>
    pair.every((id) => !approvedCuts.includes(id)),
  )) {
    const ai = active.findIndex((p) => p.id === a),
      bi = active.findIndex((p) => p.id === b);
    assert.ok(ai >= 0 && bi > ai, `${a} before ${b}`);
  }
});

test("follow-ups stay near foundations and representative hard problems precede late specialisms", () => {
  const ids = activeProblems().map((p) => p.id);
  for (const [a, b] of [
    ["best-time-to-buy-and-sell-stock-ii", "maximum-subarray"],
    ["add-two-numbers", "binary-tree-level-order-traversal"],
    ["decode-string", "binary-tree-level-order-traversal"],
    ["minimum-window-substring", "coin-change"],
    ["merge-k-sorted-lists", "word-break"],
    ["find-median-from-data-stream", "split-array-largest-sum"],
    ["word-ladder", "split-array-largest-sum"],
  ])
    assert.ok(ids.indexOf(a) < ids.indexOf(b), `${a} before ${b}`);
});

const approvedCuts =
  `recyclable-and-low-fat-products article-views-i game-play-analysis-iv concatenation-of-array fibonacci-number smallest-divisible-digit-product-i smallest-missing-integer-greater-than-sequential-prefix-sum stone-game-iv median-of-two-sorted-arrays divide-two-integers zigzag-conversion multiply-strings find-the-index-of-the-first-occurrence-in-a-string happy-number contains-duplicate-ii valid-triangle-number rotate-array next-permutation`.split(
    " ",
  );
test("approved cuts yield 100 with the three practiced extras, without deleting any work", () => {
  const s = initialState(day);
  for (const p of original.slice(0, 26)) s.progress[p.id] = { ...saved };
  for (const id of [
    "min-stack",
    "house-robber",
    "maximum-subarray",
    "subarray-sum-equals-k",
  ])
    s.progress[id] = { ...saved };
  const before = JSON.stringify(s);
  const active = activeProblems(s);
  assert.equal(active.length, 100);
  assert.equal(active.filter((p) => !s.progress[p.id]).length, 70);
  assert.equal(active.filter((p) => p.core).length, 75);
  for (const id of approvedCuts) {
    assert.ok(!active.some((p) => p.id === id), id);
    assert.ok(
      archivedProblems(s).some((p) => p.id === id),
      id,
    );
  }
  assert.equal(JSON.stringify(s), before);
});
test("cut Bloomberg problems remain valid and reviewable if another account already practiced them", () => {
  const s = recordAttempt(
    initialState(day),
    "stone-game-iv",
    3,
    day,
    45,
    "Preserve this",
  );
  assert.deepEqual(validateState(s), s);
  assert.ok(activeProblems(s).some((p) => p.id === "stone-game-iv"));
  assert.ok(!archivedProblems(s).some((p) => p.id === "stone-game-iv"));
  assert.ok(
    dailyPlan(s, s.progress["stone-game-iv"].due).reviews.some(
      (p) => p.id === "stone-game-iv",
    ),
  );
});
