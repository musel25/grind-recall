import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Info, Repeat2, X } from "lucide-react";
import {
  initialState,
  recordAttempt,
  markMorningStudy,
  setProblemSkipped,
} from "./model";
import { dailyPlan, dayDiff, todayIn, reviewDay } from "./scheduler";
import { loadState, saveState, STORAGE_KEY } from "./storage";
import { Session, dateLabel } from "./Session";
import { estimatePlan, applyEstimate } from "./planning";
import { Settings } from "./Settings";
import type { Problem, StudyState } from "./types";
import { bankWeeks } from "./bank";
import { activeProblems, progressSummary } from "./catalog";
import { StudySidebar } from "./StudySidebar";
import { TodayView } from "./TodayView";
import { ProblemList } from "./ProblemList";
type AppStore = {
  load: () => StudyState | null;
  save: (next: StudyState, expected: number | null) => void;
};
function read(store?: AppStore) {
  try {
    return { state: store ? store.load() : loadState(), error: "" };
  } catch (e) {
    return {
      state: null,
      error:
        "Saved progress could not be read. Your original data is still in this browser. Export it before resetting.",
    };
  }
}
export default function App({
  store,
  onCommitted,
}: { store?: AppStore; onCommitted?: () => void } = {}) {
  const [loaded] = useState(() => read(store));
  const [savedState, setState] = useState<StudyState | null>(loaded.state);
  const [error, setError] = useState(loaded.error);
  const [view, setView] = useState("today");
  const [selected, setSelected] = useState<Problem | null>(null);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (store) return;
    const listener = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          setState(loadState());
          setSelected(null);
          setToast("Progress refreshed from another tab.");
        } catch {
          setError(
            "Progress changed in another tab and could not be read. Reload before saving.",
          );
        }
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);
  const day = todayIn(
    savedState?.settings.timezone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  void tick;
  const projection = useMemo(
    () => (savedState ? estimatePlan(savedState, day) : null),
    [savedState, day],
  );
  const active = useMemo(() => activeProblems(savedState), [savedState]);
  const { total, practiced, independent } = useMemo(
    () => progressSummary(savedState),
    [savedState],
  );
  const roadmap = useMemo(
    () => bankWeeks(active, projection?.weeks ?? 15),
    [active, projection?.weeks],
  );
  const state = useMemo(
    () =>
      savedState && projection
        ? applyEstimate(savedState, projection)
        : savedState,
    [savedState, projection],
  );
  function commit(next: StudyState) {
    try {
      if (store) store.save(next, state?.revision ?? null);
      else saveState(next, state?.revision ?? null);
      setState(next);
      setError("");
      onCommitted?.();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  if (!state)
    return (
      <div className="welcome">
        <div className="welcome-brand">
          <Repeat2 /> Grind Recall
        </div>
        <div className="welcome-body">
          <div className="welcome-graphic" aria-hidden="true">
            <div />
            <div />
            <div />
            <Repeat2 size={52} />
          </div>
          <h1>
            Practice today.
            <br />
            Remember tomorrow.
          </h1>
          <p>
            Grind 75, nine Applied AI exercises, and your practiced LeetCode
            extras. All use spaced reviews.
            <br />
            One clear list of what to work on each day.
          </p>
          {error ? (
            <div className="notice">
              <Info />
              <div>
                {error}
                <div className="button-row">
                  <button
                    className="button secondary"
                    onClick={() => {
                      const raw = localStorage.getItem(STORAGE_KEY) ?? "";
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(
                        new Blob([raw], { type: "application/json" }),
                      );
                      a.download = "grind-recall-recovery.json";
                      a.click();
                      URL.revokeObjectURL(a.href);
                    }}
                  >
                    Export original data
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => {
                      if (
                        confirm(
                          "Reset unreadable progress in this browser? Export it first.",
                        )
                      ) {
                        localStorage.removeItem(STORAGE_KEY);
                        setError("");
                      }
                    }}
                  >
                    Reset browser data
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <button
                className="button primary large"
                onClick={() => commit(initialState(day, true))}
              >
                Continue with my first 10 completed <ArrowRight size={18} />
              </button>
              <button
                className="text-button"
                onClick={() => commit(initialState(day, false))}
              >
                Start from problem one
              </button>
            </>
          )}
          <small>
            Your pace · {activeProblems().length} active problems · Synced to
            your account
          </small>
        </div>
        <a
          className="welcome-credit"
          href="https://www.techinterviewhandbook.org/grind75/"
        >
          Problem list by Grind 75 / Tech Interview Handbook
        </a>
      </div>
    );
  const plan = dailyPlan(state, day);
  const displayWeeks = projection!.weeks;
  const week = Math.min(
    displayWeeks,
    Math.max(1, Math.floor(dayDiff(state.settings.startDate, day) / 7) + 1),
  );
  function skipProblem(p: Problem, skipped = true) {
    try {
      if (commit(setProblemSkipped(state!, day, p.id, skipped)))
        setToast(
          skipped
            ? `${p.title} skipped today. It stays unfinished for a future study day.`
            : `${p.title} restored to today.`,
        );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function morningMark(p: Problem, marked: boolean) {
    try {
      if (commit(markMorningStudy(state!, p.id, day, marked))) {
        setToast(
          marked
            ? `${p.title} saved for evening practice.`
            : "Morning mark removed.",
        );
        return true;
      }
      return false;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  return (
    <div className="app-shell">
      <StudySidebar
        view={view}
        setView={setView}
        queueLength={plan.reviews.length + plan.newProblems.length}
        projection={projection!}
        total={total}
        practiced={practiced}
        independent={independent}
      />
      <main className="main">
        <header className="topbar">
          <span>
            <span className="status-dot" /> Your daily practice space
          </span>
          <span>
            Week {week}
            {projection?.feasible ? ` of ${displayWeeks}` : ""}
          </span>
        </header>
        {error && (
          <div role="alert" className="notice error">
            <Info size={20} />
            <span>{error}</span>
            <button
              className="icon-button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {toast && (
          <div role="status" className="toast">
            <Check size={17} />
            <span>{toast}</span>
            <button
              aria-label="Dismiss notification"
              className="icon-button"
              onClick={() => setToast("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {view === "today" && (
          <TodayView
            state={state}
            day={day}
            projection={projection!}
            plan={plan}
            total={total}
            practiced={practiced}
            commit={commit}
            setSelected={setSelected}
            setView={setView}
            morningMark={morningMark}
            skipProblem={skipProblem}
            setToast={setToast}
            setError={setError}
          />
        )}
        {view === "problems" && (
          <ProblemList
            state={state}
            day={day}
            onSelect={setSelected}
            groups={roadmap}
          />
        )}
        {view === "settings" && (
          <Settings
            state={state}
            onSave={commit}
            onImport={(s) => {
              const result = commit({ ...s, revision: state.revision + 1 });
              if (result) setToast("Backup imported.");
              return result;
            }}
          />
        )}
        <footer>
          <span>Consistency over cramming.</span>
          <span>Grind 75 + Applied AI 9 + practiced LeetCode extras</span>
        </footer>
      </main>
      {selected && (
        <Session
          key={selected.id}
          problem={selected}
          planWeek={
            roadmap.find((g) => g.problems.some((p) => p.id === selected.id))
              ?.week ?? 1
          }
          state={state}
          day={day}
          onClose={() => setSelected(null)}
          onMorning={(marked) => morningMark(selected, marked)}
          onSave={(rating, minutes, note) => {
            try {
              const next = recordAttempt(
                state,
                selected.id,
                rating,
                day,
                minutes,
                note,
              );
              if (commit(next)) {
                setToast(
                  selected.review === false
                    ? `${selected.title} completed. No repeat reviews.`
                    : `${selected.title} recorded. Next review ${dateLabel(reviewDay(next.progress[selected.id].due, next))}.`,
                );
                return true;
              }
              return false;
            } catch (e) {
              setError((e as Error).message);
              return false;
            }
          }}
        />
      )}
    </div>
  );
}
