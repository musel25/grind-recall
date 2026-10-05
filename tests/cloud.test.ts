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
