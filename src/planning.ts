import data from "./problems.json";
import { addDays, dailyPlan, dayDiff, nextReview } from "./scheduler";
import type { StudyState } from "./types";

// Use the same whole-problem queue and review scheduler as actual practice.
// Future ratings are Good; existing cards, pauses and overrides are preserved.
export function simulatePace(
  state: StudyState,
  day: string,
  hours: number,
  limit = 730,
) {
  const s = structuredClone(state);
  s.settings.hours = hours;
  const start = day < s.settings.startDate ? s.settings.startDate : day;
  let minutes = 0;
  if (Object.keys(s.progress).length === data.length)
    return { finish: day, minutes };
  for (let n = 0; n < limit; n++) {
    const date = addDays(start, n);
    const plan = dailyPlan(s, date);
    for (const p of [...plan.reviews, ...plan.newProblems]) {
      const previous = s.progress[p.id];
      const spent = previous
        ? Math.round(p.minutes * s.settings.reviewMultiplier)
        : p.minutes * 2;
      s.progress[p.id] = {
        ...nextReview(previous?.card ?? null, 3, date, s),
        imported: previous?.imported ?? false,
        note: "",
        independent: true,
      };
      s.history.push({
        id: `projection-${date}-${p.id}`,
        problemId: p.id,
        day: date,
        rating: 3,
        minutes: spent,
        wasNew: !previous,
        previous: null,
      });
      minutes += spent;
    }
    if (Object.keys(s.progress).length === data.length)
      return { finish: date, minutes };
  }
  return { finish: null, minutes };
}
export type PlanEstimate = {
  completed?: boolean;
  mode: "time" | "deadline";
  hours: number;
  weeks: number;
  finish: string | null;
  target: string;
  feasible: boolean;
  minutes: number;
};
export function estimatePlan(state: StudyState, day: string): PlanEstimate {
  const mode = state.settings.planMode ?? "time";
  const target = addDays(
    state.settings.startDate,
    state.settings.weeks * 7 - 1,
  );
  if (Object.keys(state.progress).length === data.length) {
    const finish =
      state.history
        .filter((a) => a.wasNew)
        .map((a) => a.day)
        .sort()
        .at(-1) ?? day;
    return {
      mode,
      completed: true,
      finish,
      target: mode === "time" ? finish : target,
      hours: state.settings.hours,
      weeks: state.settings.weeks,
      minutes: 0,
      feasible: mode === "time" || finish <= target,
    };
  }
  if (mode === "time") {
    const result = simulatePace(state, day, state.settings.hours);
    return {
      ...result,
      mode,
      hours: state.settings.hours,
      weeks: result.finish
        ? Math.max(
            1,
            Math.ceil(
              (dayDiff(state.settings.startDate, result.finish) + 1) / 7,
            ),
          )
        : state.settings.weeks,
      target: result.finish ?? target,
      feasible: !!result.finish,
    };
  }
  const start = day < state.settings.startDate ? state.settings.startDate : day;
  const limit = Math.max(0, dayDiff(start, target) + 1);
  // Search for a sufficient weekly goal to the nearest half-hour. Whole tasks
  // and review dates make the curve discrete; always verify the chosen result.
  let low = 2,
    high = 160;
  let result = simulatePace(state, day, 80, limit);
  if (!result.finish)
    return {
      ...result,
      mode,
      hours: 80,
      weeks: state.settings.weeks,
      target,
      feasible: false,
    };
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const trial = simulatePace(state, day, mid / 2, limit);
    if (trial.finish) {
      high = mid;
      result = trial;
    } else low = mid + 1;
  }
  result = simulatePace(state, day, high / 2, limit);
  return {
    ...result,
    mode,
    hours: high / 2,
    weeks: state.settings.weeks,
    target,
    feasible: !!result.finish,
  };
}
export function applyEstimate(
  state: StudyState,
  estimate: PlanEstimate,
): StudyState {
  return {
    ...state,
    settings: {
      ...state.settings,
      planMode: estimate.mode,
      hours: estimate.feasible ? estimate.hours : state.settings.hours,
      // Stored weeks is bounded for legacy backups; display uses the full estimate.
      weeks: estimate.feasible
        ? Math.min(200, estimate.weeks)
        : state.settings.weeks,
    },
  };
}
