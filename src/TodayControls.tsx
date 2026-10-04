import { useEffect, useState } from "react";
import { Clock3, SlidersHorizontal } from "lucide-react";
import { dailyPlan } from "./scheduler";
import { setDayMinutes, setWeekHours } from "./model";
import { duration, dateLabel } from "./Session";
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
  useEffect(() => {
    setMinutes(plan.budgetMinutes);
    setHours(plan.week.goalMinutes / 60);
  }, [day, plan.budgetMinutes, plan.week.goalMinutes]);
  return (
    <section className="today-controls" aria-label="Daily and weekly plan">
      <div className="time-overview">
        <span>
          <Clock3 size={16} />
          <strong>{duration(plan.budgetMinutes)}</strong> available today
        </span>
        <span>
          {duration(plan.week.doneMinutes)} / {duration(plan.week.goalMinutes)}{" "}
          this week
        </span>
      </div>
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
                setError("Plan updated. The overall target date is unchanged.");
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
                step="0.5"
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
                Use usual {state.settings.hours}h goal
              </button>
            </label>
          </div>
          <p>
            Week of {dateLabel(plan.week.start)}–{dateLabel(plan.week.end)}.
            Extra time counts toward this week; tomorrow uses the remaining
            goal. Due reviews stay visible even if they exceed your time.
          </p>
          <button className="button primary" type="submit">
            Update this plan
          </button>
          {error && <p role="status">{error}</p>}
        </form>
      </details>
    </section>
  );
}
