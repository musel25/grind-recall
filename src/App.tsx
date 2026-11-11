import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Info,
  ListChecks,
  Menu,
  Repeat2,
  Settings2,
  X,
} from "lucide-react";
import {
  initialState,
  recordAttempt,
  markMorningStudy,
  setProblemSkipped,
  rebalanceReviewWindow,
} from "./model";
import { dailyPlan, todayIn, reviewDay } from "./scheduler";
import { loadState, saveState, STORAGE_KEY } from "./storage";
import { Session, dateLabel } from "./Session";
import { estimatePlan, applyEstimate } from "./planning";
import { Settings } from "./Settings";
import type { Problem, StudyState } from "./types";
import { bankWeeks } from "./bank";
import { activeProblems, progressSummary } from "./catalog";
import { StudyProgress, StudySidebar } from "./StudySidebar";
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
  const [navigationOpen, setNavigationOpen] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);
  const navigationButton = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<Problem | null>(null);
  const [toast, setToast] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!navigationOpen) return;
    navigationRef.current?.querySelector<HTMLElement>("nav button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNavigationOpen(false);
        navigationButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigationOpen]);
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
    () =>
      savedState
        ? estimatePlan(savedState, day, { preserveBudget: true })
        : null,
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
      next = rebalanceReviewWindow(next, day);
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
  useEffect(() => {
    if (!savedState || selected || view !== "today") return;
    const next = rebalanceReviewWindow(savedState, day);
    if (next !== savedState) commit(next);
  }, [savedState, day, selected, view]);
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
            Grind 75 and your practiced LeetCode extras. All use spaced reviews.
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
      {navigationOpen && (
        <StudySidebar
          view={view}
          setView={setView}
          queueLength={plan.reviews.length + plan.newProblems.length}
          onClose={() => {
            setNavigationOpen(false);
            navigationButton.current?.focus();
          }}
          sidebarRef={navigationRef}
        />
      )}
      <main className="main">
        <header className="topbar">
          <button
            ref={navigationButton}
            type="button"
            className="navigation-toggle"
            aria-label={navigationOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={navigationOpen}
            onClick={() => setNavigationOpen(!navigationOpen)}
          >
            <Menu size={19} />
          </button>
          <span>Grind Recall</span>
          <nav className="topbar-nav" aria-label="Practice navigation">
            {[
              ["today", "Today", CalendarDays],
              ["problems", "All problems", ListChecks],
              ["settings", "Settings", Settings2],
            ].map(([key, label, Icon]) => {
              const C = Icon as typeof CalendarDays;
              return (
                <button
                  key={key as string}
                  type="button"
                  aria-label={label as string}
                  className={view === key ? "active" : ""}
                  onClick={() => {
                    setView(key as string);
                    setNavigationOpen(false);
                    window.scrollTo(0, 0);
                  }}
                >
                  <C size={16} />
                  <span>{label as string}</span>
                </button>
              );
            })}
          </nav>
        </header>
        <StudyProgress
          projection={projection!}
          total={total}
          practiced={practiced}
          independent={independent}
        />
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
          <span>Grind 75 + practiced LeetCode extras</span>
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
