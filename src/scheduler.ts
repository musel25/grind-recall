import { createEmptyCard, fsrs, type Grade } from "ts-fsrs";
import data from "./problems.json";
import type { StoredCard, StudyState, Problem } from "./types";
const problems: Problem[] = data;
const engine = fsrs({
  request_retention: 0.9,
  enable_fuzz: false,
  enable_short_term: false,
  maximum_interval: 365,
});
const DAY = 86400000;
export function addDays(day: string, n: number) {
  return new Date(Date.parse(day + "T12:00:00Z") + n * DAY)
    .toISOString()
    .slice(0, 10);
}
export function dayDiff(a: string, b: string) {
  return Math.round(
    (Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / DAY,
  );
}
export function todayIn(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((k) => parts.find((p) => p.type === k)!.value)
    .join("-");
}
export function nextReview(
  stored: StoredCard | null,
  rating: 1 | 2 | 3 | 4,
  day: string,
) {
  const now = new Date(day + "T12:00:00Z");
  const card = stored
    ? {
        ...stored,
        due: new Date(stored.due),
        last_review: stored.last_review
          ? new Date(stored.last_review)
          : undefined,
      }
    : createEmptyCard(now);
  const result = engine.next(card, now, rating as Grade).card;
  // Coding practice is day-based. First exposure and lapses get a next-day retry;
  // stability/difficulty still come from FSRS, not a reset to an empty card.
  const interval =
    !stored || rating === 1 ? 1 : Math.max(1, result.scheduled_days);
  const due = addDays(day, interval);
  result.due = new Date(due + "T12:00:00Z");
  result.scheduled_days = interval;
  return {
    due,
    card: {
      ...result,
      due: result.due.toISOString(),
      last_review: result.last_review?.toISOString(),
    } as StoredCard,
  };
}
export function dailyPlan(s: StudyState, day: string) {
  const end = addDays(s.settings.startDate, s.settings.weeks * 7 - 1);
  const daysLeft = Math.max(0, dayDiff(day, end) + 1);
  const beforeStart = day < s.settings.startDate;
  const todays = s.history.filter((a) => a.day === day);
  const doneIds = new Set(todays.map((a) => a.problemId));
  const newDoneIds = new Set(
    todays.filter((a) => a.wasNew).map((a) => a.problemId),
  );
  const remaining = problems.filter((p) => !s.progress[p.id]);
  const remainingMinutes = remaining.reduce((sum, p) => sum + p.minutes * 2, 0);
  const doneNewMinutes = problems
    .filter((p) => newDoneIds.has(p.id))
    .reduce((sum, p) => sum + p.minutes * 2, 0);
  const targetMinutes =
    (remainingMinutes + doneNewMinutes) / Math.max(1, daysLeft);
  const newProblems: Problem[] = [];
  let assigned = doneNewMinutes;
  if (!beforeStart)
    for (const p of remaining) {
      if (assigned >= targetMinutes) break;
      newProblems.push(p);
      assigned += p.minutes * 2;
    }
  const reviews = beforeStart
    ? []
    : problems
        .filter(
          (p) =>
            s.progress[p.id] &&
            s.progress[p.id].due <= day &&
            !doneIds.has(p.id),
        )
        .sort(
          (a, b) =>
            s.progress[a.id].due.localeCompare(s.progress[b.id].due) ||
            a.order - b.order,
        );
  const reviewMinutes = reviews.reduce(
    (sum, p) => sum + Math.round(p.minutes * s.settings.reviewMultiplier),
    0,
  );
  const newMinutes = newProblems.reduce((sum, p) => sum + p.minutes * 2, 0);
  return {
    end,
    daysLeft,
    beforeStart,
    targetMinutes,
    newProblems,
    reviews,
    reviewMinutes,
    newMinutes,
    remainingMinutes,
    totalMinutes: reviewMinutes + newMinutes,
    doneMinutes: todays.reduce((sum, a) => sum + a.minutes, 0),
    todays,
    remainingCount: remaining.length,
  };
}
export function forecast(state: StudyState, day: string) {
  const s: StudyState = structuredClone(state);
  const plan = dailyPlan(s, day);
  const start = day < s.settings.startDate ? s.settings.startDate : day;
  const days = Math.max(1, dayDiff(start, plan.end) + 1);
  let newMinutes = 0,
    reviewMinutes = 0,
    reviews = 0,
    newCount = 0;
  // Optimistic scenario: every future attempt is Good, completed on its due date.
  for (let d = 0; d < days; d++) {
    const date = addDays(start, d);
    const daily = dailyPlan(s, date);
    for (const p of [...daily.reviews, ...daily.newProblems]) {
      const previous = s.progress[p.id];
      const isNew = !previous;
      const next = nextReview(previous?.card ?? null, 3, date);
      const minutes = isNew
        ? p.minutes * 2
        : Math.round(p.minutes * s.settings.reviewMultiplier);
      if (isNew) {
        newMinutes += minutes;
        newCount++;
      } else {
        reviewMinutes += minutes;
        reviews++;
      }
      s.progress[p.id] = {
        ...next,
        imported: false,
        note: "",
        independent: true,
      };
      s.history.push({
        id: `forecast-${date}-${p.id}`,
        problemId: p.id,
        day: date,
        rating: 3,
        minutes,
        wasNew: isNew,
        previous: null,
      });
    }
  }
  return {
    newMinutes,
    reviewMinutes,
    reviews,
    newCount,
    hoursPerWeek: (newMinutes + reviewMinutes) / 60 / (days / 7),
    days,
  };
}
