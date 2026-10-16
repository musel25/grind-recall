import { test } from "node:test";
import assert from "node:assert/strict";
import original from "../docs/catalog/original-problems.json";
import { problems, initialState } from "../src/model.ts";
import { dailyPlan } from "../src/scheduler.ts";
import { validateState } from "../src/storage.ts";

test("all legacy IDs and scheduling metadata remain available for old backups", () => {
  assert.equal(new Set(problems.map((p) => p.id)).size, problems.length);
  for (const old of original) {
    const p = problems.find((p) => p.id === old.id)!;
    for (const key of [
      "id",
      "title",
      "url",
      "minutes",
      "difficulty",
      "week",
    ] as const)
      assert.equal(p[key], old[key]);
  }
});

test("foundations precede their combined or advanced applications", () => {
  const pairs = [
    ["house-robber", "coin-change"],
    ["subsets", "combination-sum"],
    ["subsets", "permutations"],
    ["subarray-sum-equals-k", "contiguous-array"],
    ["subarray-sum-equals-k", "path-sum-iii"],
    ["binary-tree-level-order-traversal", "binary-tree-right-side-view"],
    ["number-of-islands", "pacific-atlantic-water-flow"],
    ["course-schedule", "course-schedule-ii"],
    ["course-schedule-ii", "alien-dictionary"],
    ["graph-valid-tree", "accounts-merge"],
    ["maximum-subarray", "maximum-product-subarray"],
    ["unique-paths", "maximal-square"],
    ["daily-temperatures", "largest-rectangle-in-histogram"],
    ["daily-temperatures", "sliding-window-maximum"],
    ["kth-largest-element-in-an-array", "find-median-from-data-stream"],
    ["merge-two-sorted-lists", "merge-k-sorted-lists"],
    [
      "construct-binary-tree-from-preorder-and-inorder-traversal",
      "serialize-and-deserialize-binary-tree",
    ],
    ["diameter-of-binary-tree", "binary-tree-maximum-path-sum"],
    [
      "longest-substring-without-repeating-characters",
      "minimum-window-substring",
    ],
    ["word-search", "word-search-ii"],
    [
      "implement-trie-prefix-tree",
      "design-add-and-search-words-data-structure",
    ],
    ["design-add-and-search-words-data-structure", "word-search-ii"],
    ["non-overlapping-intervals", "maximum-profit-in-job-scheduling"],
    ["basic-calculator-ii", "basic-calculator"],
    ["valid-sudoku", "sudoku-solver"],
    ["reorder-list", "reverse-nodes-in-k-group"],
  ];
  for (const [before, after] of pairs) {
    const a = problems.find((p) => p.id === before)!;
    const b = problems.find((p) => p.id === after)!;
    assert.ok(a.order < b.order, `${before} must precede ${after}`);
  }
});

test("an existing first-26 backup starts at the earliest unpracticed focused problem without changing saved work", () => {
  const s = initialState("2026-10-04", true);
  for (const p of original.slice(0, 26)) {
    s.progress[p.id] = {
      due: "2026-11-01",
      card: null,
      imported: true,
      note: "Keep my note",
      independent: false,
    };
  }
  const backup = JSON.stringify(s);
  const restored = validateState(JSON.parse(backup));
  assert.equal(
    dailyPlan(restored, "2026-10-05").newProblems[0].id,
    "best-time-to-buy-and-sell-stock-ii",
  );
  assert.equal(JSON.stringify(restored), backup);
});
