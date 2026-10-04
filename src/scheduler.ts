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
export function studyWeek(s: StudyState, day: string) {
  const index = Math.max(0, Math.floor(dayDiff(s.settings.startDate, day) / 7));
  const start = addDays(s.settings.startDate, index * 7);
  const end = addDays(start, 6);
  const goalMinutes = Math.round(
    (s.planning?.weeks[start] ?? s.settings.hours) * 60,
  );
  const attempts = s.history.filter((a) => a.day >= start && a.day <= end);
  const doneMinutes = attempts.reduce((n, a) => n + a.minutes, 0);
  const beforeToday = attempts
    .filter((a) => a.day < day)
    .reduce((n, a) => n + a.minutes, 0);
  const daysLeft = Math.min(7, Math.max(1, dayDiff(day, end) + 1));
  // Today's completed time must not shrink today's assignment while doing it.
  const autoMinutes = Math.min(
    1440,
    Math.ceil(Math.max(0, goalMinutes - beforeToday) / daysLeft),
  );
  return {
    start,
    end,
    index,
    goalMinutes,
    doneMinutes,
    daysLeft,
    autoMinutes,
    remainingMinutes: Math.max(0, goalMinutes - doneMinutes),
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
  const paceProblems: Problem[] = [];
  let assigned = doneNewMinutes;
  if (!beforeStart)
    for (const p of remaining) {
      if (assigned >= targetMinutes) break;
      paceProblems.push(p);
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
  const week = studyWeek(s, day);
  const budgetMinutes = s.planning?.days[day]?.minutes ?? week.autoMinutes;
  const extraIds = new Set(s.planning?.days[day]?.extras ?? []);
  // Extras sit outside the automatic assignment. Doing an extra first must
  // not remove a different problem from the original daily list.
  const completedEstimate = todays.reduce((total, a) => {
    if (a.wasNew && extraIds.has(a.problemId)) return total;
    const p = problems.find((p) => p.id === a.problemId)!;
    return (
      total +
      (a.wasNew
        ? p.minutes * 2
        : Math.round(p.minutes * s.settings.reviewMultiplier))
    );
  }, 0);
  let room = Math.max(0, budgetMinutes - reviewMinutes - completedEstimate);
  const newProblems: Problem[] = [];
  if (!beforeStart) {
    for (const p of remaining) {
      if (extraIds.has(p.id)) continue;
      if (p.minutes * 2 > room) break;
      newProblems.push(p);
      room -= p.minutes * 2;
    }
    for (const id of extraIds) {
      const p = remaining.find((p) => p.id === id);
      if (p) newProblems.push(p);
    }
  }
  const assignedIds = new Set(newProblems.map((p) => p.id));
  const nextExtra = beforeStart
    ? undefined
    : remaining.find((p) => !assignedIds.has(p.id));
  const newMinutes = newProblems.reduce((sum, p) => sum + p.minutes * 2, 0);
  return {
    end,
    week,
    budgetMinutes,
    nextExtra,
    extraIds,
    paceProblems,
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
  // Required-effort scenario: keep the deadline pace, regardless of available time.
  // Actual daily assignments respect the time budget; this is a separate
  // optimistic estimate of the hours needed to finish, with all-Good reviews.
  for (let d = 0; d < days; d++) {
    const date = addDays(start, d);
    const daily = dailyPlan(s, date);
    for (const p of [...daily.reviews, ...daily.paceProblems]) {
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
