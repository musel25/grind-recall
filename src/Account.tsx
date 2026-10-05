import { useEffect, useState } from "react";
import { Cloud, Repeat2 } from "lucide-react";
import App from "./App";
import { CloudStore, request, type User } from "./cloud";
import { downloadBackup, loadState, STORAGE_KEY } from "./storage";

export default function Account() {
  const [session, setSession] = useState<{
    user: User;
    store: CloudStore;
  } | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  async function open(user: User) {
    const store = new CloudStore(user.id);
    await store.sync();
    if (
      store.locked ||
      (!store.load() && store.status !== "Saved to your account")
    )
      throw Error(
        "Unable to load your saved progress. Reconnect and try again.",
      );
    setSession({ user, store });
    setError("");
  }
  useEffect(() => {
    let active = true;
    request("account")
      .then(async ({ user }) => {
        if (active) await open(user);
      })
      .catch((e) => {
        if (active && e.status !== 401)
          setError(
            "Could not connect to your account. Your browser progress is safe. Please try signing in.",
          );
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  if (session)
    return (
      <SignedIn
        key={session.user.id}
        {...session}
        onExit={() => setSession(null)}
      />
    );
  return (
    <main className="account-page">
      <section className="account-card">
        <a className="brand" href="/grind/">
          <Repeat2 />
          Grind Recall
        </a>
        <h1>
          Your practice.
          <br />
          Every device.
        </h1>
        <p>
          Sign in to keep your progress on your computer and phone. Each account
          has its own plan and reviews.
        </p>
        {checking ? (
          <p role="status">Checking your account…</p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              const data = new FormData(e.currentTarget);
              try {
                const { user } = await request(
                  register ? "register" : "login",
                  { email: data.get("email"), password: data.get("password") },
                );
                await open(user);
              } catch (e) {
                const code = (e as Error).message;
                setError(
                  (
                    {
                      invalid_credentials: "Email or password is incorrect.",
                      account_exists:
                        "That email already has an account. Sign in instead.",
                      try_later:
                        "Too many attempts. Please try again in 15 minutes.",
                      invalid_input:
                        "Check your email and password. New passwords need at least 10 characters.",
                    } as Record<string, string>
                  )[code] ??
                    "Could not connect. Your existing progress is safe; please try again.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                maxLength={254}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={register ? 10 : 1}
                maxLength={256}
              />
            </label>
            <button className="button primary" disabled={busy}>
              {busy ? "Connecting…" : register ? "Create account" : "Sign in"}
            </button>
            <button
              type="button"
              className="text-button"
              disabled={busy}
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
          </form>
        )}
        <p className="hint">
          Already use Planner? Use the same email and password. Your existing
          Grind progress stays in this browser until you choose to save it to
          your account.
        </p>
        {error && (
          <p role="alert" className="notice">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
function SignedIn({
  user,
  store,
  onExit,
}: {
  user: User;
  store: CloudStore;
  onExit: () => void;
}) {
  const [, redraw] = useState(0);
  const [error, setError] = useState("");
  const [skipLegacy, setSkipLegacy] = useState(
    () => localStorage.getItem(`${store.key}:skip-legacy`) === "yes",
  );
  const [legacy] = useState(() => {
    try {
      return { state: loadState(), error: "" };
    } catch {
      return {
        state: null,
        error:
          "The original browser progress needs recovery. Export the original data before continuing.",
      };
    }
  });
  useEffect(() => {
    store.changed = () => redraw((n) => n + 1);
    store.canRefresh = () =>
      !document.querySelector(
        ".session-dialog[open], .settings-view, .today-controls details[open]",
      );
    const sync = () => {
      void store.sync();
    };
    const timer = setInterval(sync, 5000);
    window.addEventListener("online", sync);
    window.addEventListener("focus", sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", sync);
      window.removeEventListener("focus", sync);
      store.changed = () => {};
    };
  }, [store]);
  const migration =
    !store.load() && !skipLegacy && (legacy.state || legacy.error);
  function exportOriginal() {
    const url = URL.createObjectURL(
      new Blob([localStorage.getItem(STORAGE_KEY) ?? ""], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "grind-original-browser-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="cloud-session">
      <div className="account-bar">
        <div>
          <strong>{user.email}</strong>
          <span role="status">
            <Cloud size={15} />{" "}
            {store.pending && store.busy
              ? "Saving to your account…"
              : store.status}
          </span>
        </div>
        <div className="button-row">
          {legacy.state && store.load() && (
            <button className="text-button" onClick={exportOriginal}>
              Original browser backup
            </button>
          )}
          <button
            className="text-button"
            onClick={() => void store.sync()}
            disabled={store.busy}
          >
            Sync now
          </button>
          <button
            className="text-button"
            disabled={store.busy}
            onClick={async () => {
              if (
                store.pending &&
                !confirm(
                  "Some progress has not reached the server yet. It will stay on this device for this account. Sign out anyway?",
                )
              )
                return;
              try {
                const res = await fetch("/api/auth/logout", {
                  method: "POST",
                  credentials: "same-origin",
                });
                if (!res.ok) throw Error("Sign out failed");
                onExit();
              } catch {
                setError("Could not sign out. Reconnect and try again.");
              }
            }}
          >
            Sign out
          </button>
        </div>
        {(store.conflict || store.locked) && (
          <div className="cloud-notice" role="alert">
            <p>{store.status}</p>
            {store.load() && (
              <button
                className="button secondary"
                onClick={() => downloadBackup(store.load()!)}
              >
                Export this device’s progress
              </button>
            )}
            {store.conflict && (
              <button
                className="button secondary"
                disabled={store.busy}
                onClick={() => {
                  if (
                    confirm(
                      "Load the progress saved on the server? This device’s version will be kept as a recovery copy. Export it first if you want a separate file.",
                    )
                  )
                    void store.useServer().catch((e) => setError(e.message));
                }}
              >
                Load server progress
              </button>
            )}
            {store.locked && (
              <button
                className="button secondary"
                onClick={() => location.reload()}
              >
                Reload account
              </button>
            )}
          </div>
        )}
        {error && <p role="alert">{error}</p>}
      </div>
      {migration ? (
        <main className="account-page">
          <section className="account-card">
            <h1>Keep your progress.</h1>
            <p>
              This browser already has Grind progress. Save it to{" "}
              <strong>{user.email}</strong> so you can continue on your phone.
              Your original browser copy will stay untouched.
            </p>
            {legacy.error && <p role="alert">{legacy.error}</p>}
            {legacy.state && (
              <>
                <p>
                  {Object.keys(legacy.state.progress).length} problems practiced
                  · {legacy.state.history.length} attempts
                </p>
                <button
                  className="button primary"
                  disabled={store.busy}
                  onClick={() => {
                    try {
                      store.save(legacy.state!, null);
                      void store.sync();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Save existing progress to my account
                </button>
              </>
            )}
            <button className="button secondary" onClick={exportOriginal}>
              Export original browser backup
            </button>
            <button
              className="text-button"
              onClick={() => {
                localStorage.setItem(`${store.key}:skip-legacy`, "yes");
                setSkipLegacy(true);
              }}
            >
              This is a different person — start fresh
            </button>
          </section>
        </main>
      ) : (
        <App
          key={`${user.id}:${store.epoch}`}
          store={store}
          onCommitted={() => {
            queueMicrotask(() => void store.sync());
          }}
        />
      )}
    </div>
  );
}
