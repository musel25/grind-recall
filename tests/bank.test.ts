import { test } from "node:test";
import assert from "node:assert/strict";
import { problems } from "../src/model.ts";
import { bankWeeks } from "../src/bank.ts";

test("16-week roadmap preserves every problem in curriculum order and balances effort", () => {
  const groups = bankWeeks(problems, 16);
  assert.equal(groups.length, 16);
  assert.deepEqual(
    groups.map((g) => g.week),
    Array.from({ length: 16 }, (_, i) => i + 1),
  );
  assert.deepEqual(
    groups.flatMap((g) => g.problems),
    problems,
  );
  const target = problems.reduce((sum, p) => sum + p.minutes, 0) / 16;
  const largest = Math.max(...problems.map((p) => p.minutes));
  for (const group of groups) {
    assert.ok(group.problems.length > 0);
    assert.ok(
      Math.abs(
        group.problems.reduce((sum, p) => sum + p.minutes, 0) - target,
      ) <= largest,
    );
  }
});

test("changing plan length regroups without changing catalog or dropping problems, including sparse plans", () => {
  const before = JSON.stringify(problems);
  for (const weeks of [1, 8, 15, 20, 200, 240]) {
    const groups = bankWeeks(problems, weeks);
    assert.equal(groups.length, weeks);
    assert.deepEqual(
      groups.flatMap((g) => g.problems),
      problems,
    );
    assert.equal(groups.at(-1)!.week, weeks);
    assert.ok(groups.at(-1)!.problems.length > 0);
  }
  assert.equal(JSON.stringify(problems), before);
});
