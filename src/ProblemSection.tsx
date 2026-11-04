import { Sun, CalendarOff } from "lucide-react";
import { ProblemRow } from "./ProblemRow";
import type { Problem, StudyState } from "./types";
export function ProblemSection({
  title,
  subtitle,
  icon,
  items,
  state,
  day,
  onSelect,
  review = false,
  onMorning,
  onSkip,
}: {
  onMorning?: (p: Problem) => void;
  onSkip?: (p: Problem) => void;
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
        <div className="study-row" key={p.id}>
          <ProblemRow
            p={p}
            state={state}
            day={day}
            onSelect={onSelect}
            review={review}
          />
          {(onMorning || onSkip) && (
            <div className="study-row-footer">
              {onMorning && p.review !== false && (
                <button
                  className="text-button"
                  aria-label={`Studied ${p.title} this morning`}
                  onClick={() => onMorning(p)}
                >
                  <Sun size={14} /> Studied this morning
                </button>
              )}
              {onSkip && <SkipButton p={p} onSkip={onSkip} />}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
export function SkipButton({
  p,
  onSkip,
}: {
  p: Problem;
  onSkip: (p: Problem) => void;
}) {
  return (
    <button
      className="text-button"
      aria-label={`Skip ${p.title} today`}
      title="Skip today without marking complete or adding a replacement"
      onClick={() => onSkip(p)}
    >
      <CalendarOff size={14} /> Not today
    </button>
  );
}
