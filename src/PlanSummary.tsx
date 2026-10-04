import type { PlanEstimate } from "./planning";
import { duration } from "./Session";
export function fullDate(day: string) {
  return new Date(day + "T12:00:00Z").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
export function PlanSummary({ plan }: { plan: PlanEstimate }) {
  if (plan.completed)
    return (
      <div className="plan-estimate" aria-label="Plan estimate">
        <strong>All 169 problems practiced</strong>
        <p>
          Your reviews continue at your usual {plan.hours.toFixed(1)}{" "}
          hours/week. Use daily time mode to adjust your review routine.
        </p>
      </div>
    );
  return (
    <div
      className="plan-estimate"
      aria-label="Plan estimate"
      aria-live="polite"
    >
      <strong>
        {!plan.feasible
          ? "This plan needs adjusting"
          : plan.mode === "deadline"
            ? `About ${duration(Math.ceil((plan.hours * 60) / 7))} a day`
            : `Estimated finish: ${fullDate(plan.finish!)}`}
      </strong>
      <p>
        {!plan.feasible
          ? plan.mode === "deadline"
            ? "This deadline is not feasible within 80 hours/week with your current breaks and overrides. Extend the plan or adjust your available days."
            : "No completion within the next two years at this pace. Increase your daily time to make room for new problems alongside reviews."
          : plan.mode === "deadline"
            ? `${plan.hours.toFixed(1)} hours/week to finish by ${fullDate(plan.target)} (${plan.weeks} weeks from your start date).`
            : `About ${plan.weeks} weeks total at ${duration(Math.round((plan.hours * 60) / 7))}/day (${plan.hours.toFixed(1)} hours/week).`}
      </p>
      <small>
        Includes new problems and spaced reviews, with future attempts rated
        Good. Actual ratings and time may change the estimate. Daily time is an
        average; breaks and weekly progress redistribute it. Completion means
        all 169 practiced at least once; reviews continue.
      </small>
    </div>
  );
}
