import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Clock3, X, RotateCcw } from "lucide-react";
import { nextReview, dayDiff, reviewDay } from "./scheduler";
import type { Problem, StudyState } from "./types";
export function dateLabel(day: string) {
  return new Date(day + "T12:00:00Z").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
export function duration(n: number) {
  return n >= 60
    ? `${Math.floor(n / 60)}h${n % 60 ? ` ${Math.round(n % 60)}m` : ""}`
    : `${Math.round(n)}m`;
}
export function Session({
  problem: p,
  state,
  day,
  onClose,
  onSave,
}: {
  problem: Problem;
  state: StudyState;
  day: string;
  onClose: () => void;
  onSave: (rating: 1 | 2 | 3 | 4, minutes: number, note: string) => boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const progress = state.progress[p.id];
  const [finished, setFinished] = useState(false);
  const [minutes, setMinutes] = useState(
    progress
      ? Math.round(p.minutes * state.settings.reviewMultiplier)
      : p.minutes * 2,
  );
  const [note, setNote] = useState(progress?.note ?? "");
  const [error, setError] = useState("");
  const history = state.history
    .filter((a) => a.problemId === p.id)
    .slice(-5)
    .reverse();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const rated = history.some((a) => a.day === day);
  const labels = ["Again", "Hard", "Good", "Easy"] as const;
  const descriptions = [
    "Needed help or forgot",
    "Solved, with difficulty",
    "Solved independently",
    "Solved with confidence",
  ];
  return (
    <dialog ref={ref} onCancel={onClose} className="session-dialog">
      <div className="dialog-top">
        <span className="eyebrow">
          {progress ? "Review practice" : "New practice"}
        </span>
        <button
          className="icon-button"
          aria-label="Close practice"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <h2>{p.title}</h2>
      <div className="meta">
        <span className={"difficulty " + p.difficulty.toLowerCase()}>
          {p.difficulty}
        </span>
        <span>Grind week {p.week}</span>
        <span>
          <Clock3 size={14} /> {duration(p.minutes)} solving estimate
        </span>
      </div>
      <p className="session-prompt">
        Try it without hints. Explain your approach and its time and space
        complexity, then rate it Again, Hard, Good, or Easy. Practicing a
        problem does not retire it from reviews.
      </p>
      <a
        className="button primary"
        href={p.url}
        target="_blank"
        rel="noreferrer"
      >
        Open on LeetCode <ArrowUpRight size={17} />
      </a>
      {rated ? (
        <div className="notice success">
          <Check size={18} />
          <div>
            Recorded for today. Next review{" "}
            {dateLabel(reviewDay(progress.due, state))}.<br />
            <small>
              Close this window and use Undo last attempt to change your rating.
            </small>
          </div>
        </div>
      ) : (
        <>
          {!finished ? (
            <button
              className="button secondary finish-button"
              onClick={() => setFinished(true)}
            >
              Rate my attempt <Check size={17} />
            </button>
          ) : (
            <div className="rating-area">
              <div className="form-row">
                <label>
                  Time spent (minutes)
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  />
                </label>
              </div>
              <label>
                What should you remember?
                <textarea
                  value={note}
                  maxLength={5000}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="A key insight, edge case, or mistake to revisit…"
                  rows={3}
                />
              </label>
              <h3>How did it go?</h3>
              <div className="rating-grid">
                {labels.map((label, i) => {
                  const grade = (i + 1) as 1 | 2 | 3 | 4;
                  const next = nextReview(
                    progress?.card ?? null,
                    grade,
                    day,
                    state,
                  );
                  const days = dayDiff(day, next.due);
                  return (
                    <button
                      key={label}
                      className={"rating rating-" + i}
                      title={descriptions[i]}
                      onClick={() => {
                        if (
                          minutes < 1 ||
                          minutes > 600 ||
                          !Number.isFinite(minutes)
                        ) {
                          setError("Enter between 1 and 600 minutes.");
                          return;
                        }
                        if (onSave(grade, minutes, note)) onClose();
                        else
                          setError(
                            "Your attempt could not be saved. Close this dialog to see the error. Your current progress is unchanged.",
                          );
                      }}
                    >
                      <strong>{label}</strong>
                      <span>{descriptions[i]}</span>
                      <small>
                        {days === 1 ? "Tomorrow" : `In ${days} days`} ·{" "}
                        {dateLabel(next.due)}
                      </small>
                    </button>
                  );
                })}
              </div>
              {error && (
                <p role="alert" className="error-text">
                  {error}
                </p>
              )}
            </div>
          )}
        </>
      )}
      {progress?.note && !finished && (
        <details className="past-notes">
          <summary>Show previous note (after attempting)</summary>
          <p>{progress.note}</p>
        </details>
      )}
      {history.length > 0 && (
        <details className="past-notes">
          <summary>
            <RotateCcw size={14} /> Recent attempts
          </summary>
          {history.map((a) => (
            <div className="history-line" key={a.id}>
              <span>{dateLabel(a.day)}</span>
              <strong>{labels[a.rating - 1]}</strong>
              <span>{duration(a.minutes)}</span>
            </div>
          ))}
        </details>
      )}
    </dialog>
  );
}
