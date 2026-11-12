import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { addDays, dailyPlan } from "./scheduler";
import { setDayMinutes, setWeekHours, setReviewWindow } from "./model";
import { dateLabel } from "./Session";
import type { StudyState } from "./types";
export function TodayControls({
  state,
  day,
  onSave,
}: {
  state: StudyState;
  day: string;
  onSave: (s: StudyState) => boolean;
}) {
  const plan = dailyPlan(state, day);
  const [minutes, setMinutes] = useState(plan.budgetMinutes);
  const [hours, setHours] = useState(plan.week.goalMinutes / 60);
  const [error, setError] = useState("");
  const [reviewStart, setReviewStart] = useState(day);
  const [reviewEnd, setReviewEnd] = useState(addDays(day, 6));
  const [reviewLimit, setReviewLimit] = useState(4);
  const [automaticTime, setAutomaticTime] = useState(true);
  useEffect(() => {
    setMinutes(plan.budgetMinutes);
    setHours(plan.week.goalMinutes / 60);
  }, [day, plan.budgetMinutes, plan.week.goalMinutes]);
  return (
    <section className="today-controls" aria-label="Daily and weekly plan">
      <details>
        <summary>
          <SlidersHorizontal size={14} /> Adjust time
        </summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              let next = state;
              if (minutes !== plan.budgetMinutes)
                next = setDayMinutes(next, day, minutes);
              if (hours !== plan.week.goalMinutes / 60)
                next = setWeekHours(next, day, hours);
              if (next === state || onSave(next))
                setError(
                  "Plan updated. Your completion estimate includes this adjustment.",
                );
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <div className="time-inputs">
            <label>
              Today's time (minutes)
              <input
                type="number"
                min="0"
                max="1440"
                required
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  if (onSave(setDayMinutes(state, day, null)))
                    setError("Using automatic daily time.");
                }}
              >
                Use automatic time
              </button>
            </label>
            <label>
              This week's goal (hours)
              <input
                type="number"
                min="0"
                max="80"
                step="any"
                required
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
              />
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  if (onSave(setWeekHours(state, day, null)))
                    setError("Using your usual weekly goal.");
                }}
              >
                Use usual {Number(state.settings.hours.toFixed(1))}h goal
              </button>
            </label>
          </div>
          <p>
            Monday–Sunday: {dateLabel(plan.week.start)}–
            {dateLabel(plan.week.end)}. Extra time counts toward this week;
            tomorrow uses the remaining goal. Due reviews stay visible even if
            they exceed your time.
          </p>
          <button className="button primary" type="submit">
            Update this plan
          </button>
          {error && <p role="status">{error}</p>}
        </form>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            try {
              let next = setReviewWindow(
                state,
                reviewStart,
                reviewEnd,
                reviewLimit,
              );
              if (automaticTime)
                for (
                  let date = reviewStart;
                  date <= reviewEnd;
                  date = addDays(date, 1)
                )
                  next = setDayMinutes(next, date, null);
              if (onSave(next))
                setError(
                  "Reviews spread across available days. New problems use the available time.",
                );
            } catch (error) {
              setError((error as Error).message);
            }
          }}
        >
          <h3>Spread reviews</h3>
          <div className="time-inputs">
            <label>
              Review limit start
              <input
                type="date"
                required
                min={day}
                value={reviewStart}
                onChange={(event) => setReviewStart(event.target.value)}
              />
            </label>
            <label>
              Review limit end
              <input
                type="date"
                required
                min={reviewStart}
                value={reviewEnd}
                onChange={(event) => setReviewEnd(event.target.value)}
              />
            </label>
            <label>
              Maximum reviews per day
              <input
                type="number"
                required
                min="1"
                max="100"
                value={reviewLimit}
                onChange={(event) => setReviewLimit(Number(event.target.value))}
              />
            </label>
          </div>
          <label className="automatic-time-choice">
            <input
              type="checkbox"
              checked={automaticTime}
              onChange={(event) => setAutomaticTime(event.target.checked)}
            />{" "}
            Use automatic daily time for these dates
          </label>
          <p>
            This moves saved review dates. Ratings, notes, and memory stay
            saved. New ratings and missed days use this limit. Overflow moves
            past the end date.
          </p>
          <button className="button secondary" type="submit">
            Spread these reviews
          </button>
        </form>
      </details>
    </section>
  );
}
