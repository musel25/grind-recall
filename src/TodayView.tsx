import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CalendarOff,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Info,
  Moon,
  Plus,
  Repeat2,
  RotateCcw,
} from "lucide-react";
import { activeProblems } from "./catalog";
import {
  problems,
  addExtraProblem,
  removeExtraProblem,
  undoAttempt,
} from "./model";
import { addDays, dailyPlan, reviewDay } from "./scheduler";
import { PlanSummary } from "./PlanSummary";
import type { PlanEstimate } from "./planning";
import { TodayControls } from "./TodayControls";
import { duration, dateLabel } from "./Session";
import { ProblemRow } from "./ProblemRow";
import { ProblemSection, SkipButton } from "./ProblemSection";
import type { Problem, StudyState } from "./types";
export function TodayView({
  state,
  day,
  projection,
  plan,
  commit,
  setSelected,
  setView,
  morningMark,
  skipProblem,
  setToast,
  setError,
}: {
  state: StudyState;
  day: string;
  projection: PlanEstimate;
  plan: ReturnType<typeof dailyPlan>;
  commit: (state: StudyState) => boolean;
  setSelected: (p: Problem) => void;
  setView: (view: string) => void;
  morningMark: (p: Problem, marked: boolean) => boolean;
  skipProblem: (p: Problem, skipped?: boolean) => void;
  setToast: (message: string) => void;
  setError: (message: string) => void;
}) {
  const active = activeProblems(state);
  const [upcomingDay, setUpcomingDay] = useState<string | null>(null);
  const lastExtraId = [...(state.planning?.days[day]?.extras ?? [])]
    .reverse()
    .find(
      (id) =>
        !state.progress[id] &&
        !state.morningStudy?.[id] &&
        !state.planning?.days[day]?.skipped?.includes(id),
    );
  const lastExtra = active.find((p) => p.id === lastExtraId);
  const eveningIds = new Set(plan.eveningProblems.map((p) => p.id));
  const readyReviews = plan.reviews.filter((p) => !eveningIds.has(p.id));
  const readyNew = plan.newProblems.filter((p) => !eveningIds.has(p.id));
  const queue = [...readyReviews, ...readyNew, ...plan.eveningProblems];
  const budget = plan.budgetMinutes;
  const estimate = plan.totalMinutes + plan.doneMinutes;
  const nextDue = active
    .filter((p) => p.review !== false && state.progress[p.id])
    .map((p) => reviewDay(state.progress[p.id].due, state))
    .filter((d) => d > day)
    .sort()[0];
  const breakDays = (state.planning?.breaks ?? [])
    .filter((date) => date >= day)
    .sort();
  const upcomingProblems = upcomingDay
    ? active.filter(
        (p) =>
          p.review !== false &&
          state.progress[p.id] &&
          reviewDay(state.progress[p.id].due, state) === upcomingDay,
      )
    : [];

  return (
    <>
      <div className="page-heading today-heading">
        <div>
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
            {plan.doneMinutes > 0 && (
              <p>{duration(plan.doneMinutes)} practiced today</p>
            )}
          </div>
        </div>
      </section>
      <TodayControls state={state} day={day} onSave={commit} />
      {breakDays.length > 0 && (
        <div className="break-banner">
          <CalendarOff size={17} />
          <span>
            Study break:{" "}
            <strong>
              {dateLabel(breakDays[0])}–{dateLabel(breakDays.at(-1)!)}
            </strong>
            . Reviews resume {dateLabel(reviewDay(breakDays.at(-1)!, state))}.
          </span>
        </div>
      )}
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
      {readyReviews.length > 0 && (
        <ProblemSection
          title="Review & remember"
          subtitle="Due today and overdue"
          icon={<Repeat2 size={16} />}
          items={readyReviews}
          onSkip={skipProblem}
          state={state}
          day={day}
          onSelect={setSelected}
          review
        />
      )}
      {readyNew.length > 0 && (
        <ProblemSection
          title="Learn something new"
          subtitle="Next in your plan"
          icon={<BookOpen size={16} />}
          items={readyNew}
          onSkip={skipProblem}
          onMorning={(p) => morningMark(p, true)}
          state={state}
          day={day}
          onSelect={setSelected}
        />
      )}
      {plan.eveningProblems.length > 0 && (
        <section
          className="problem-section evening-section"
          aria-label="Practice tonight"
        >
          <div className="problem-section-header">
            <span>
              <Moon size={16} /> Practice tonight
            </span>
            <small>Morning study saved · rating still needed</small>
          </div>
          {plan.eveningProblems.map((p) => (
            <div className="study-row" key={p.id}>
              <ProblemRow
                p={p}
                state={state}
                day={day}
                onSelect={setSelected}
                review={!!state.progress[p.id]}
              />
              <div className="study-row-footer">
                <span>Studied {dateLabel(state.morningStudy![p.id])}</span>
                <SkipButton p={p} onSkip={skipProblem} />
                <button
                  className="text-button"
                  aria-label={`Undo morning mark for ${p.title}`}
                  onClick={() => morningMark(p, false)}
                >
                  Undo mark
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
      {plan.skippedProblems.length > 0 && (
        <section
          className="problem-section skipped-section"
          aria-label="Skipped today"
        >
          <div className="problem-section-header">
            <span>
              <CalendarOff size={16} /> Skipped today
            </span>
            <small>{plan.skippedProblems.length} still unfinished</small>
          </div>
          <p className="skip-explanation">
            Unfinished. Available again{" "}
            {dateLabel(reviewDay(addDays(day, 1), state))}.
          </p>
          {plan.skippedProblems.map((p) => (
            <div className="skipped-row" key={p.id}>
              <span>{p.title}</span>
              <button
                className="text-button"
                aria-label={`Restore ${p.title} to today`}
                onClick={() => skipProblem(p, false)}
              >
                <RotateCcw size={14} /> Undo
              </button>
            </div>
          ))}
        </section>
      )}
      {queue.length === 0 && (
        <div className="empty-state">
          <CheckCheck size={36} />
          <h2>
            {plan.beforeStart
              ? "Your plan is ready."
              : plan.onBreak
                ? "Enjoy your study break."
                : plan.skippedProblems.length
                  ? "That's enough for today."
                  : "All set for today."}
          </h2>
          <p>
            {plan.beforeStart
              ? `Your daily assignments begin ${dateLabel(state.settings.startDate)}.`
              : plan.onBreak
                ? `Reviews resume ${dateLabel(reviewDay(day, state))}. Your finish estimate accounts for this break.`
                : plan.skippedProblems.length
                  ? "Your skipped problems are saved above. Come back next study day, or undo a skip if you have more time."
                  : nextDue
                    ? `Your next review is ${dateLabel(nextDue)}. Add one more problem whenever you feel like it.`
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
      {plan.nextExtra && (
        <div className="extra-action">
          <button
            className="button secondary"
            onClick={() => {
              try {
                const next = addExtraProblem(state, day);
                if (commit(next))
                  setToast(plan.nextExtra!.title + " added to today.");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Plus size={17} /> Add one more problem
          </button>
          <span>Next: {plan.nextExtra.title}</span>
        </div>
      )}
      {lastExtra && (
        <div className="extra-action">
          <button
            className="text-button"
            title={`Remove ${lastExtra.title} from today's extras`}
            onClick={() => {
              if (commit(removeExtraProblem(state, day, lastExtra.id)))
                setToast(lastExtra.title + " removed from today's extras.");
            }}
          >
            <RotateCcw size={14} /> Undo last added problem
          </button>
          <span>{lastExtra.title}</span>
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
              <span>{problems.find((p) => p.id === a.problemId)?.title}</span>
              <small>
                {a.rating === null
                  ? "Completed"
                  : ["", "Again", "Hard", "Good", "Easy"][a.rating]}
              </small>
            </button>
          ))}
        </details>
      )}
      {state.history.length > 0 && (
        <button
          className="text-button undo"
          onClick={() => {
            if (commit(undoAttempt(state))) setToast("Last attempt undone.");
          }}
        >
          <RotateCcw size={14} /> Undo last attempt
        </button>
      )}
      {projection && (
        <div className="workload-note">
          <Info size={18} />
          <div>
            <PlanSummary plan={projection} />
            {estimate > budget && (
              <p>
                Assigned work is about {duration(estimate)}, above today's{" "}
                {duration(budget)} budget.
              </p>
            )}
            <button className="text-button" onClick={() => setView("settings")}>
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
          {Array.from({ length: 14 }, (_, i) => {
            const date = addDays(day, i + 1);
            const n = active.filter(
              (p) =>
                p.review !== false &&
                state.progress[p.id] &&
                reviewDay(state.progress[p.id].due, state) === date,
            ).length;
            return (
              <button
                key={date}
                className={
                  (n ? "has-reviews " : "") +
                  (upcomingDay === date ? "selected-day" : "")
                }
                aria-label={`Reviews for ${dateLabel(date)}`}
                aria-pressed={upcomingDay === date}
                onClick={() =>
                  setUpcomingDay(upcomingDay === date ? null : date)
                }
              >
                <span>
                  {new Date(date + "T12:00:00Z").toLocaleDateString(undefined, {
                    weekday: "short",
                    timeZone: "UTC",
                  })}
                </span>
                <strong>{date.slice(-2)}</strong>
                <small>
                  {state.planning?.breaks?.includes(date)
                    ? "Break"
                    : n
                      ? `${n} review${n > 1 ? "s" : ""}`
                      : "—"}
                </small>
              </button>
            );
          })}
        </div>
        {upcomingDay && (
          <div className="upcoming-detail">
            <h3>{dateLabel(upcomingDay)}</h3>
            {upcomingProblems.length ? (
              upcomingProblems.map((p) => (
                <button key={p.id} onClick={() => setSelected(p)}>
                  {p.title}
                  <ChevronRight size={15} />
                </button>
              ))
            ) : (
              <p>
                {state.planning?.breaks?.includes(upcomingDay)
                  ? "Study break — no reviews scheduled."
                  : "No reviews scheduled yet."}
              </p>
            )}
          </div>
        )}
      </section>
    </>
  );
}
