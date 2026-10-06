import { test } from "node:test";
import assert from "node:assert/strict";
import { CloudStore } from "../src/cloud";
import { initialState, markMorningStudy } from "../src/model";
function setup() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
  };
  let remote: any = {
    accountId: "a",
    version: 0,
    state: null,
    mutationId: null,
  };
  let online = true;
  let dropReply = false;
  const request = async (_path: string, body?: any) => {
    if (!online) throw Error("offline");
    if (body) {
      if (body.mutationId === remote.mutationId) return remote;
      if (body.baseVersion !== remote.version)
        throw Object.assign(Error("conflict"), { status: 409 });
      remote = {
        accountId: "a",
        version: remote.version + 1,
        state: body.state,
        mutationId: body.mutationId,
      };
      if (dropReply) {
        dropReply = false;
        throw Error("lost reply");
      }
    }
    return remote;
  };
  const make = () => new CloudStore("a", storage, request);
  return {
    make,
    values,
    remote: () => remote,
    online: (v: boolean) => {
      online = v;
    },
    drop: () => {
      dropReply = true;
    },
    replace: (s: any) => {
      remote = {
        ...remote,
        state: s,
        version: remote.version + 1,
        mutationId: "other-device",
      };
    },
  };
}
test("progress survives reload offline, then reaches another device", async () => {
  const t = setup();
  const a = t.make();
  await a.sync();
  t.online(false);
  a.save(initialState("2026-10-05"), null);
  await a.sync();
  const b = t.make();
  assert.deepEqual(b.load(), a.load());
  t.online(true);
  await b.sync();
  assert.deepEqual(t.remote().state, a.load());
  const c = t.make();
  await c.sync();
  assert.deepEqual(c.load(), a.load());
  assert.equal(c.pending, false);
});
test("a stale device cannot overwrite a newer server version; recovery preserves local work", async () => {
  const t = setup();
  const a = t.make();
  await a.sync();
  a.save(initialState("2026-10-05"), null);
  await a.sync();
  t.online(false);
  a.save(markMorningStudy(a.load()!, "two-sum", "2026-10-05", true), 0);
  t.replace(initialState("2026-10-06"));
  t.online(true);
  await a.sync();
  assert.equal(a.conflict, true);
  assert.equal(t.remote().state.settings.startDate, "2026-10-06");
  assert.ok(a.load()!.morningStudy?.["two-sum"]);
  await a.useServer();
  assert.equal(a.load()!.settings.startDate, "2026-10-06");
  assert.ok([...t.values.keys()].some((k) => k.includes("recovery")));
});
test("lost save acknowledgements are retried without duplicate writes", async () => {
  const t = setup();
  const a = t.make();
  await a.sync();
  a.save(initialState("2026-10-05"), null);
  t.drop();
  await a.sync();
  assert.equal(a.pending, true);
  await a.sync();
  assert.equal(a.pending, false);
  assert.equal(t.remote().version, 1);
});
test("stale tabs and switched accounts cannot write another account state", async () => {
  const t = setup();
  const a = t.make();
  await a.sync();
  const b = t.make();
  a.save(initialState("2026-10-05"), null);
  assert.throws(() => b.save(initialState("2026-10-06"), null), /another tab/);
  const switched = new CloudStore(
    "b",
    { getItem: () => null, setItem: () => {} },
    async () => t.remote(),
  );
  await switched.sync();
  assert.equal(switched.locked, true);
});
test("remote updates wait while a practice or settings draft is open", async () => {
  const t = setup();
  const a = t.make();
  await a.sync();
  a.save(initialState("2026-10-05"), null);
  await a.sync();
  a.canRefresh = () => false;
  t.replace(initialState("2026-10-06"));
  await a.sync();
  assert.equal(a.load()!.settings.startDate, "2026-10-05");
  assert.equal(a.epoch, 0);
  a.canRefresh = () => true;
  await a.sync();
  assert.equal(a.load()!.settings.startDate, "2026-10-06");
  assert.equal(a.epoch, 1);
});

// An old, still-open app writes the original key after account migration.
// Reload must reveal that work even though the account already has a snapshot.
import { recordAttempt, problems, undoAttempt } from "../src/model";
import { STORAGE_KEY } from "../src/storage";
function practiced(count: number) {
  let s = initialState("2026-10-05", true);
  for (const p of problems.slice(10, count))
    s = recordAttempt(s, p.id, 3, "2026-10-05", 30, "");
  return s;
}
test("18 account problems cannot hide 26 original browser problems after reload", async () => {
  const t = setup();
  const original = practiced(26);
  const older = {
    ...original,
    progress: Object.fromEntries(
      Object.entries(original.progress).slice(0, 18),
    ),
    history: original.history.slice(0, 8),
  };
  t.replace(older);
  t.values.set(STORAGE_KEY, JSON.stringify(original));
  const a = t.make();
  await a.sync();
  assert.equal(a.legacyRecovery?.missingProblems, 8);
  assert.equal(a.legacyRecovery?.canRestore, true);
  a.restoreLegacy();
  await a.sync();
  assert.equal(Object.keys(t.remote().state.progress).length, 26);
  assert.equal(a.legacyRecovery, null);
  assert.ok([...t.values.keys()].some((k) => k.includes(":recovery:")));
  assert.equal(t.values.get(STORAGE_KEY), JSON.stringify(original));
  const reloaded = t.make();
  await reloaded.sync();
  assert.equal(Object.keys(reloaded.load()!.progress).length, 26);
  // An intentional undo must not resurrect the imported original attempt.
  reloaded.save(undoAttempt(reloaded.load()!), reloaded.load()!.revision);
  await reloaded.sync();
  assert.equal(reloaded.legacyRecovery, null);
});
test("detects an old tab saving more work after migration without overwriting either branch", async () => {
  const t = setup();
  const a = t.make();
  const original = practiced(18);
  t.values.set(STORAGE_KEY, JSON.stringify(original));
  a.save(original, null);
  await a.sync();
  const extra = recordAttempt(
    original,
    problems[18].id,
    3,
    "2026-10-05",
    30,
    "",
  );
  t.values.set(STORAGE_KEY, JSON.stringify(extra));
  await a.sync();
  assert.equal(a.legacyRecovery?.missingProblems, 1);
  a.save(
    recordAttempt(a.load()!, problems[19].id, 3, "2026-10-05", 30, ""),
    a.load()!.revision,
  );
  await a.sync();
  assert.equal(a.legacyRecovery?.canRestore, false);
  assert.throws(() => a.restoreLegacy(), /conflict/i);
  assert.ok(t.remote().state.progress[problems[19].id]);
  assert.equal(t.values.get(STORAGE_KEY), JSON.stringify(extra));
});
test("different people can leave original browser progress out of their account", async () => {
  const t = setup();
  t.values.set(STORAGE_KEY, JSON.stringify(practiced(26)));
  t.replace(initialState("2026-10-05"));
  const a = t.make();
  await a.sync();
  assert.ok(a.legacyRecovery);
  a.dismissLegacy();
  await a.sync();
  assert.equal(a.legacyRecovery, null);
  assert.deepEqual(t.remote().state.progress, {});
});
test("recovery is durable offline and remains pending until the server confirms it", async () => {
  const t = setup();
  const original = practiced(18);
  t.replace(original);
  t.values.set(
    STORAGE_KEY,
    JSON.stringify(
      recordAttempt(original, problems[18].id, 3, "2026-10-05", 30, ""),
    ),
  );
  const a = t.make();
  await a.sync();
  t.online(false);
  a.restoreLegacy();
  await a.sync();
  const reloaded = t.make();
  assert.equal(Object.keys(reloaded.load()!.progress).length, 19);
  assert.equal(reloaded.pending, true);
  t.online(true);
  await reloaded.sync();
  assert.equal(Object.keys(t.remote().state.progress).length, 19);
});
test("unrated original morning work is detected and corrupt originals are surfaced without replacing account data", async () => {
  const t = setup();
  const original = practiced(18);
  t.replace(original);
  t.values.set(
    STORAGE_KEY,
    JSON.stringify(
      markMorningStudy(original, problems[18].id, "2026-10-05", true),
    ),
  );
  const a = t.make();
  await a.sync();
  assert.equal(a.legacyRecovery?.missingStudy, 1);
  t.values.set(STORAGE_KEY, "broken json");
  await a.sync();
  assert.equal(a.legacyRecovery?.canRestore, false);
  assert.match(a.legacyRecovery!.error, /could not be read/);
  assert.deepEqual(a.load(), original);
});
test("recovering old-tab attempts preserves newer account settings and planning", async () => {
  const t = setup();
  const original = practiced(18);
  t.values.set(
    STORAGE_KEY,
    JSON.stringify(
      recordAttempt(original, problems[18].id, 3, "2026-10-05", 30, ""),
    ),
  );
  const current = {
    ...original,
    settings: { ...original.settings, hours: 7 },
    planning: { days: {}, weeks: {}, breaks: ["2026-10-20"] },
  };
  t.replace(current);
  const a = t.make();
  await a.sync();
  a.restoreLegacy();
  await a.sync();
  assert.equal(t.remote().state.settings.hours, 7);
  assert.deepEqual(t.remote().state.planning.breaks, ["2026-10-20"]);
  assert.equal(Object.keys(t.remote().state.progress).length, 19);
});
