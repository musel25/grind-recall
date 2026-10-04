import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Info,
  ListChecks,
  Repeat2,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { problems, initialState, recordAttempt, undoAttempt } from "./model";
import { addDays, dailyPlan, dayDiff, forecast, todayIn } from "./scheduler";
import { loadState, saveState, STORAGE_KEY } from "./storage";
import { Session, duration, dateLabel } from "./Session";
import { Settings } from "./Settings";
import type { Problem, StudyState } from "./types";
function read() {
  try {
    return { state: loadState(), error: "" };
  } catch (e) {
    return {
      state: null,
      error:
        "Saved progress could not be read. Your original data is still in this browser. Export it before resetting.",
    };
  }
}
export default function App() {
  const [loaded] = useState(read);
  const [state, setState] = useState<StudyState | null>(loaded.state);
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
    state?.settings.timezone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  void tick;
  const projection = useMemo(
    () => (state ? forecast(state, day) : null),
    [state, day],
  );
  function commit(next: StudyState) {
    try {
      saveState(next, state?.revision ?? null);
      setState(next);
      setError("");
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
            Your 169-problem plan, with spaced reviews.
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
          <small>15 weeks · All 169 problems · Saved in this browser</small>
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
  const practiced = Object.keys(state.progress).length;
  const independent = Object.values(state.progress).filter(
    (p) => p.independent,
  ).length;
  const week = Math.min(
    state.settings.weeks,
    Math.max(1, Math.floor(dayDiff(state.settings.startDate, day) / 7) + 1),
  );
  const queue = [...plan.reviews, ...plan.newProblems];
  const budget = Math.round((state.settings.hours * 60) / 7);
  const estimate = plan.totalMinutes + plan.doneMinutes;
  const nextDue = Object.values(state.progress)
    .map((p) => p.due)
    .filter((d) => d > day)
    .sort()[0];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("today");
          }}
        >
          <span className="brand-icon">
            <Repeat2 size={23} />
          </span>
          <span>
            Grind Recall<small>A little, every day.</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          {[
            ["today", "Today", CalendarDays],
            ["problems", "All problems", ListChecks],
            ["settings", "Settings", Settings2],
          ].map(([key, label, Icon]) => {
            const C = Icon as typeof CalendarDays;
            return (
              <button
                key={key as string}
                aria-label={label as string}
                className={view === key ? "nav-item active" : "nav-item"}
                onClick={() => {
                  setView(key as string);
                  window.scrollTo(0, 0);
                }}
              >
                <C size={19} />
                <span>{label as string}</span>
                {key === "today" && queue.length > 0 && (
                  <span className="nav-count">{queue.length}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-plan">
          <div className="small-heading">
            Your {state.settings.weeks}-week journey{" "}
            <span>{Math.round((practiced / 169) * 100)}%</span>
          </div>
          <div className="progress-track">
            <div style={{ width: `${(practiced / 169) * 100}%` }} />
          </div>
          <p>
            <strong>{practiced}</strong> of 169 practiced
          </p>
          <span className="sidebar-caption">
            {independent} solved independently
          </span>
        </div>
        <div className="sidebar-bottom">
          <ShieldCheck size={17} />
          <span>Saved on this device</span>
          <a
            href="https://www.techinterviewhandbook.org/grind75/"
            target="_blank"
            rel="noreferrer"
          >
            Inspired by Grind 75 <ArrowUpRight size={13} />
          </a>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>
            <span className="status-dot" /> Your daily practice space
          </span>
          <span>
            Week {week} of {state.settings.weeks}
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
          <>
            <div className="page-heading today-heading">
              <div>
                <p className="date-line">
                  {new Date(day + "T12:00:00Z").toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
                <h1>Your practice, today.</h1>
                <p>
                  {queue.length
                    ? "A few new challenges. A little recall. Keep it moving."
                    : "Your daily list is clear. A good place to pause."}
                </p>
              </div>
              <span className="day-mark" aria-hidden="true">
                <CalendarDays size={36} />
              </span>
            </div>
            <section className="daily-overview" aria-label="Today's summary">
              <div>
                <span className="overview-icon blue">
                  <BookOpen size={19} />
                </span>
                <div>
                  <strong>
                    {plan.newProblems.length}
                    <small>new problems</small>
                  </strong>
                  <p>Build your foundation</p>
                </div>
              </div>
              <div>
                <span className="overview-icon purple">
                  <Repeat2 size={20} />
                </span>
                <div>
                  <strong>
                    {plan.reviews.length}
                    <small>due reviews</small>
                  </strong>
                  <p>Make it stick</p>
                </div>
              </div>
              <div>
                <span className="overview-icon neutral">
                  <Clock3 size={19} />
                </span>
                <div>
                  <strong>
                    {duration(plan.totalMinutes)}
                    <small>remaining</small>
                  </strong>
                  <p>
                    {plan.doneMinutes
                      ? `${duration(plan.doneMinutes)} practiced today`
                      : `${duration(budget)} daily budget`}
                  </p>
                </div>
              </div>
            </section>
            <section className="journey">
              <div>
                <span className="small-heading">The bigger picture</span>
                <p>
                  <strong>{practiced} / 169</strong> problems practiced{" "}
                  <span>
                    Target {dateLabel(plan.end)}
                    {plan.daysLeft === 0 ? " · Target date passed" : ""}
                  </span>
                </p>
              </div>
              <div
                className="week-track"
                aria-label={`Week ${week} of ${state.settings.weeks}`}
              >
                {Array.from({ length: state.settings.weeks }, (_, i) => (
                  <span
                    key={i}
                    title={`Week ${i + 1}`}
                    className={
                      i + 1 < week ? "past" : i + 1 === week ? "current" : ""
                    }
                  />
                ))}
              </div>
              <div className="journey-bottom">
                <span>Week {week}</span>
                <span>{plan.daysLeft} days left</span>
              </div>
            </section>
            <div className="section-header">
              <h2>
                Today's list <span>{queue.length}</span>
              </h2>
              {queue.length > 0 && (
                <button
                  className="button primary"
                  onClick={() => setSelected(queue[0])}
                >
                  Start practice <ArrowRight size={16} />
                </button>
              )}
            </div>
            {plan.reviews.length > 0 && (
              <ProblemSection
                title="Review & remember"
                subtitle="Due today and overdue"
                icon={<Repeat2 size={16} />}
                items={plan.reviews}
                state={state}
                day={day}
                onSelect={setSelected}
                review
              />
            )}
            {plan.newProblems.length > 0 && (
              <ProblemSection
                title="Learn something new"
                subtitle="Next in your plan"
                icon={<BookOpen size={16} />}
                items={plan.newProblems}
                state={state}
                day={day}
                onSelect={setSelected}
              />
            )}
            {queue.length === 0 && (
              <div className="empty-state">
                <CheckCheck size={36} />
                <h2>
                  {plan.beforeStart
                    ? "Your plan is ready."
                    : "All set for today."}
                </h2>
                <p>
                  {plan.beforeStart
                    ? `Your daily assignments begin ${dateLabel(state.settings.startDate)}.`
                    : nextDue
                      ? `Your next review is ${dateLabel(nextDue)}. You can also choose extra practice from All problems.`
                      : "Come back tomorrow for your next assignment, or pick an extra problem."}
                </p>
                <button
                  className="button secondary"
                  onClick={() => setView("problems")}
                >
                  Browse problems
                </button>
              </div>
            )}
            {plan.todays.length > 0 && (
              <details className="completed-list">
                <summary>
                  <CheckCheck size={17} /> Practiced today{" "}
                  <span>{plan.todays.length}</span>
                </summary>
                {plan.todays.map((a) => (
                  <button
                    key={a.id}
                    onClick={() =>
                      setSelected(problems.find((p) => p.id === a.problemId)!)
                    }
                  >
                    <Check size={15} />
                    <span>
                      {problems.find((p) => p.id === a.problemId)?.title}
                    </span>
                    <small>
                      {["", "Again", "Hard", "Good", "Easy"][a.rating]}
                    </small>
                  </button>
                ))}
              </details>
            )}
            {state.history.length > 0 && (
              <button
                className="text-button undo"
                onClick={() => {
                  if (commit(undoAttempt(state)))
                    setToast("Last attempt undone.");
                }}
              >
                <RotateCcw size={14} /> Undo last attempt
              </button>
            )}
            {projection && (
              <div className="workload-note">
                <Info size={18} />
                <div>
                  <strong>
                    {projection.hoursPerWeek > state.settings.hours
                      ? "Your target needs more time."
                      : "Your workload forecast"}
                  </strong>
                  <p>
                    {projection.hoursPerWeek.toFixed(1)}h/week projected vs.{" "}
                    {state.settings.hours}h available. Assumes successful full
                    scheduled reviews
                    {state.settings.reviewMultiplier !== 1
                      ? ` at ${Math.round(state.settings.reviewMultiplier * 100)}% of listed time`
                      : ""}
                    ; retries can add more.
                    {estimate > budget
                      ? ` Today's plan is about ${duration(estimate)}, above your ${duration(budget)} budget.`
                      : ""}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => setView("settings")}
                  >
                    Adjust your plan <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
            <section className="upcoming">
              <div className="section-header">
                <h2>Coming up</h2>
                <span>Known reviews only</span>
              </div>
              <div className="upcoming-days">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = addDays(day, i + 1);
                  const n = Object.values(state.progress).filter(
                    (p) => p.due === date,
                  ).length;
                  return (
                    <div key={date} className={n ? "has-reviews" : ""}>
                      <span>
                        {new Date(date + "T12:00:00Z").toLocaleDateString(
                          undefined,
                          { weekday: "short", timeZone: "UTC" },
                        )}
                      </span>
                      <strong>{date.slice(-2)}</strong>
                      <small>
                        {n ? `${n} review${n > 1 ? "s" : ""}` : "—"}
                      </small>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
        {view === "problems" && (
          <ProblemList state={state} day={day} onSelect={setSelected} />
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
          <span>Grind 169 + spaced repetition</span>
        </footer>
      </main>
      {selected && (
        <Session
          key={selected.id}
          problem={selected}
          state={state}
          day={day}
          onClose={() => setSelected(null)}
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
                  `${selected.title} recorded. Next review ${dateLabel(next.progress[selected.id].due)}.`,
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
function ProblemRow({
  p,
  state,
  day,
  onSelect,
  review = false,
}: {
  p: Problem;
  state: StudyState;
  day: string;
  onSelect: (p: Problem) => void;
  review?: boolean;
}) {
  const done = state.history.some((a) => a.day === day && a.problemId === p.id);
  const progress = state.progress[p.id];
  return (
    <button
      className={"problem-row" + (done ? " done" : "")}
      onClick={() => onSelect(p)}
    >
      <span className={"problem-marker" + (review ? " review-marker" : "")}>
        {done ? (
          <Check size={17} />
        ) : review ? (
          <Repeat2 size={17} />
        ) : (
          String(p.order).padStart(2, "0")
        )}
      </span>
      <span className="problem-info">
        <strong>{p.title}</strong>
        <span className="meta">
          <span className={"difficulty " + p.difficulty.toLowerCase()}>
            {p.difficulty}
          </span>
          <span>
            {duration(
              review
                ? Math.round(p.minutes * state.settings.reviewMultiplier)
                : p.minutes * 2,
            )}
            {review ? " review" : " solve + study"}
          </span>
          {review && progress.due < day && (
            <span className="overdue">
              {dayDiff(progress.due, day)}d overdue
            </span>
          )}
        </span>
      </span>
      <span className="row-action">
        {done ? "Recorded" : review ? "Review" : "Practice"}
        <ChevronRight size={17} />
      </span>
    </button>
  );
}
function ProblemSection({
  title,
  subtitle,
  icon,
  items,
  state,
  day,
  onSelect,
  review = false,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: Problem[];
  state: StudyState;
  day: string;
  onSelect: (p: Problem) => void;
  review?: boolean;
}) {
  return (
    <section className="problem-section">
      <div className="problem-section-header">
        <span>
          {icon}
          {title}
        </span>
        <small>{subtitle}</small>
      </div>
      {items.map((p) => (
        <ProblemRow
          key={p.id}
          p={p}
          state={state}
          day={day}
          onSelect={onSelect}
          review={review}
        />
      ))}
    </section>
  );
}
function ProblemList({
  state,
  day,
  onSelect,
}: {
  state: StudyState;
  day: string;
  onSelect: (p: Problem) => void;
}) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All difficulties");
  const [status, setStatus] = useState("All problems");
  const filtered = problems.filter(
    (p) =>
      (!search || p.title.toLowerCase().includes(search.toLowerCase())) &&
      (difficulty === "All difficulties" || p.difficulty === difficulty) &&
      (status === "All problems" ||
        (status === "Not started"
          ? !state.progress[p.id]
          : status === "Practiced"
            ? !!state.progress[p.id]
            : state.progress[p.id]?.due <= day)),
  );
  return (
    <>
      <div className="page-heading">
        <h1>A little progress, every week.</h1>
        <p>
          All 169 problems, in the order you know. Your daily queue balances
          their effort.
        </p>
      </div>
      <div className="list-tools">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Search problems"
            placeholder="Find a problem…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {["All difficulties", "Easy", "Medium", "Hard"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Filter progress"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {["All problems", "Not started", "Practiced", "Due reviews"].map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </select>
      </div>
      <p className="results-count">{filtered.length} problems</p>
      {filtered.length === 0 && (
        <div className="empty-state">
          <Search />
          <h2>No matching problems.</h2>
          <p>Try a different search or filter.</p>
        </div>
      )}
      {Array.from({ length: 15 }, (_, i) => i + 1).map((w) => {
        const list = filtered.filter((p) => p.week === w);
        const all = problems.filter((p) => p.week === w);
        const count = all.filter((p) => state.progress[p.id]).length;
        return list.length ? (
          <details
            className="week-group"
            key={`${w}-${search}-${difficulty}-${status}`}
            open={
              search ||
              difficulty !== "All difficulties" ||
              status !== "All problems"
                ? true
                : w === 1
            }
          >
            <summary>
              <span>
                <ChevronRight size={18} />
                Week {w}
              </span>
              <span className="week-summary">
                {count}/{all.length}
                <span className="mini-progress">
                  <span style={{ width: `${(count / all.length) * 100}%` }} />
                </span>
              </span>
            </summary>
            {list.map((p) => (
              <ProblemRow
                key={p.id}
                p={p}
                state={state}
                day={day}
                onSelect={onSelect}
                review={!!state.progress[p.id]}
              />
            ))}
          </details>
        ) : null;
      })}
    </>
  );
}
