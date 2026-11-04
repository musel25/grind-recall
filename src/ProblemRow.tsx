import { Check, Repeat2, ChevronRight } from "lucide-react";
import { problemSource } from "./catalog";
import { duration, dateLabel } from "./Session";
import { reviewDay, dayDiff } from "./scheduler";
import type { Problem, StudyState } from "./types";
export function ProblemRow({
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
  const done =
    (p.review === false && !!state.progress[p.id]) ||
    state.history.some((a) => a.day === day && a.problemId === p.id);
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
          <span>
            #{p.order} · {problemSource(p)}
          </span>
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
          {p.review === false && <span>No repeat reviews</span>}
          {review && (
            <span>Due {dateLabel(reviewDay(progress.due, state))}</span>
          )}
          {!review && state.planning?.days[day]?.extras.includes(p.id) && (
            <span className="extra-label">Extra today</span>
          )}
          {review && reviewDay(progress.due, state) < day && (
            <span className="overdue">
              {dayDiff(reviewDay(progress.due, state), day)}d overdue
            </span>
          )}
        </span>
      </span>
      <span className="row-action">
        {done
          ? p.review === false
            ? "Completed"
            : "Recorded"
          : review
            ? "Review"
            : "Practice"}
        <ChevronRight size={17} />
      </span>
    </button>
  );
}
