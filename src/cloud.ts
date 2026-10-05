import { validateState } from "./storage";
import type { StudyState } from "./types";
export type User = { id: string; email: string };
export type Snapshot = {
  accountId: string;
  state: StudyState | null;
  version: number;
  mutationId: string | null;
};
type Envelope = {
  state: StudyState | null;
  baseVersion: number;
  mutationId: string;
  pending: boolean;
};
type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;
type Request = (path: string, body?: unknown) => Promise<any>;
export async function request(path: string, body?: unknown) {
  // A unique URL also prevents old Planner service workers from returning an
  // authenticated snapshot cached by an earlier app version when offline.
  const res = await fetch(`/api/grind/${path}?request=${crypto.randomUUID()}`, {
    method: body === undefined ? "GET" : path === "state" ? "PUT" : "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok)
    throw Object.assign(
      new Error((await res.json().catch(() => ({}))).error ?? "request_failed"),
      { status: res.status },
    );
  return res.json();
}
export class CloudStore {
  readonly key: string;
  private raw: string | null;
  private data: Envelope;
  busy = false;
  conflict = false;
  locked = false;
  status = "Connecting to your account…";
  epoch = 0;
  changed = () => {};
  canRefresh = () => true;
  constructor(
    readonly accountId: string,
    private storage: Storage = localStorage,
    private fetcher: Request = request,
  ) {
    this.key = `grind-recall:account:${accountId}`;
    this.raw = storage.getItem(this.key);
    this.data = this.raw
      ? JSON.parse(this.raw)
      : { state: null, baseVersion: 0, mutationId: "", pending: false };
    if (
      !Number.isInteger(this.data.baseVersion) ||
      this.data.baseVersion < 0 ||
      typeof this.data.pending !== "boolean" ||
      typeof this.data.mutationId !== "string"
    )
      throw Error(
        "This device’s account backup could not be read. Export it before resetting.",
      );
    if (this.data.state !== null)
      this.data.state = validateState(this.data.state);
  }
  get pending() {
    return this.data.pending;
  }
  load = () => this.data.state;
  private current() {
    if (this.storage.getItem(this.key) !== this.raw)
      throw Error("Progress changed in another tab. Reload before saving.");
  }
  private persist(data: Envelope) {
    this.current();
    const raw = JSON.stringify(data);
    this.storage.setItem(this.key, raw);
    this.raw = raw;
    this.data = data;
  }
  save = (next: StudyState, expected: number | null) => {
    this.current();
    if (this.conflict || this.locked)
      throw Error(
        "Resolve the account notice above before saving. Your local progress is preserved.",
      );
    if (this.busy)
      throw Error("Sync in progress. Please try saving again in a moment.");
    if ((this.data.state?.revision ?? null) !== expected)
      throw Error("Progress changed in another tab. Reload before saving.");
    this.persist({
      ...this.data,
      state: validateState(next),
      mutationId: crypto.randomUUID(),
      pending: true,
    });
    this.status = "Saved on this device · Waiting to sync";
    this.changed();
  };
  private accept(remote: Snapshot) {
    if (remote.accountId !== this.accountId) {
      this.locked = true;
      throw Error("Your login changed. Reload to open the correct account.");
    }
    if (!Number.isInteger(remote.version) || remote.version < 0)
      throw Error("Invalid server response. Local progress is preserved.");
    const state = remote.state === null ? null : validateState(remote.state);
    return { ...remote, state };
  }
  async sync() {
    if (this.busy || this.conflict || this.locked) return;
    this.busy = true;
    try {
      this.current();
      const sent = this.data;
      const remote = this.accept(
        await this.fetcher(
          "state",
          sent.pending
            ? {
                accountId: this.accountId,
                baseVersion: sent.baseVersion,
                mutationId: sent.mutationId,
                state: sent.state,
              }
            : undefined,
        ),
      );
      this.current();
      // Own acknowledgements do not remount a practice dialog. A changed server
      // snapshot refreshes the app, so no stale form can write over it.
      const changed =
        !sent.pending &&
        JSON.stringify(remote.state) !== JSON.stringify(sent.state);
      if (changed && !this.canRefresh()) {
        this.status =
          "Updates available from another device · Close the editor to refresh";
        return;
      }
      this.persist({
        state: remote.state,
        baseVersion: remote.version,
        mutationId: remote.mutationId ?? "",
        pending: false,
      });
      if (changed) this.epoch++;
      this.status = "Saved to your account";
    } catch (error) {
      const e = error as Error & { status?: number };
      if (e.status === 409) {
        this.conflict = true;
        this.status =
          "Another device saved newer progress. Your changes are safe on this device; export them before loading the server version.";
      } else if (e.status === 401 || e.status === 403) {
        this.locked = true;
        this.status =
          "Please sign in again. Unsynced progress is safe on this device.";
      } else if (e.message.includes("another tab")) {
        this.locked = true;
        this.status = e.message;
      } else
        this.status = this.locked
          ? e.message
          : this.pending
            ? "Saved on this device · Sync unavailable; retrying automatically"
            : "Unable to check for updates · Reconnecting automatically";
    } finally {
      this.busy = false;
      this.changed();
    }
  }
  async useServer() {
    if (this.busy) return;
    this.busy = true;
    try {
      const remote = this.accept(await this.fetcher("state"));
      this.current();
      if (this.data.state)
        this.storage.setItem(
          `${this.key}:recovery:${crypto.randomUUID()}`,
          JSON.stringify(this.data.state),
        );
      this.persist({
        state: remote.state,
        baseVersion: remote.version,
        mutationId: remote.mutationId ?? "",
        pending: false,
      });
      this.conflict = false;
      this.locked = false;
      this.epoch++;
      this.status =
        "Server progress loaded · Previous device copy kept for recovery";
    } finally {
      this.busy = false;
      this.changed();
    }
  }
}
