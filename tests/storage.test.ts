import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, recordAttempt, undoAttempt } from "../src/model";
import { validateState, saveState, STORAGE_KEY } from "../src/storage";
const day = "2026-10-04";
test("backup round trip preserves scheduling and undo", () => {
  const s = recordAttempt(
    initialState(day, true),
    "two-sum",
    3,
    day,
    15,
    "Remember complements",
  );
  const restored = validateState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored, s);
  assert.equal(undoAttempt(restored).progress["two-sum"].card, null);
});
test("reject corrupt settings, dates, cards, unknown IDs, and duplicate attempts", () => {
  for (const mutate of [
    (s: any) => (s.settings.hours = 0),
    (s: any) => (s.settings.startDate = "2026-02-31"),
    (s: any) => (s.settings.timezone = "Fake/Zone"),
    (s: any) => (s.progress["__proto__"] = null),
    (s: any) => (s.progress["not-a-problem"] = {}),
    (s: any) => (s.progress["two-sum"].card = { due: "bad" }),
    (s: any) => (s.progress["two-sum"].due = "2026-99-99"),
  ]) {
    const s = JSON.parse(JSON.stringify(initialState(day, true)));
    mutate(s);
    assert.throws(() => validateState(s));
  }
  const s = recordAttempt(initialState(day), "two-sum", 3, day, 15, "");
  s.history.push(s.history[0]);
  assert.throws(() => validateState(s));
});
test("saving does not swallow quota errors and rejects stale-tab writes", () => {
  let value = JSON.stringify(initialState(day));
  const store = {
    getItem: () => value,
    setItem: (_k: string, v: string) => {
      value = v;
    },
  };
  const first = recordAttempt(initialState(day), "two-sum", 3, day, 15, "");
  saveState(first, 0, store);
  assert.equal(JSON.parse(value).revision, 1);
  assert.throws(() => saveState(first, 0, store), /another tab/);
  assert.throws(
    () =>
      saveState({ ...first, revision: 2 }, 1, {
        getItem: () => value,
        setItem: () => {
          throw Error("quota");
        },
      }),
    /quota/,
  );
  assert.ok(STORAGE_KEY);
});
