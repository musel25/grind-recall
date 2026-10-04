import { initialState, setStudyBreak } from "../src/model";
import { estimatePlan } from "../src/planning";
const s = setStudyBreak(
  initialState("2026-10-04", true),
  "2026-10-08",
  "2026-10-12",
);
for (const hours of [10, 14, 20]) {
  s.settings.hours = hours;
  console.log(JSON.stringify(estimatePlan(s, "2026-10-04"), null, 2));
}
s.settings.planMode = "deadline";
for (const weeks of [15, 20]) {
  s.settings.weeks = weeks;
  console.log(JSON.stringify(estimatePlan(s, "2026-10-04"), null, 2));
}
