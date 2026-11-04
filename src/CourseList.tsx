import { ChevronRight, ArrowUpRight } from "lucide-react";
import { activeProblems, cojudgeCourses } from "./catalog";
import { ProblemRow } from "./ProblemRow";
import type { Problem, StudyState } from "./types";
export function CourseList({
  state,
  day,
  onSelect,
}: {
  state: StudyState;
  day: string;
  onSelect: (p: Problem) => void;
}) {
  const activeIds = new Set(activeProblems(state).map((p) => p.id));
  const courses = cojudgeCourses.map((course) => ({
    ...course,
    problems: course.problems.filter((p) => activeIds.has(p.id)),
  }));
  const firstIncomplete = courses.find((course) =>
    course.problems.some((p) => !state.progress[p.id]),
  )?.id;
  return (
    <>
      <div className="page-heading">
        <h1>Python courses</h1>
        <p>
          OOP → Pytest → Data Formats → Collections → Decorators and Context
          Managers. This first pass selects 25 exercises for practical Python
          skills. Practice on Cojudge, then rate your attempt here. Selected
          exercises share your daily study time and use spaced reviews.
          Previously practiced extras stay active, except four retired OOP
          bites. Other exercises are in All problems → Archive.
        </p>
      </div>
      {courses.map((course) => {
        const completed = course.problems.filter(
          (p) => state.progress[p.id],
        ).length;
        return (
          <details
            className="week-group course-group"
            key={course.id}
            open={course.id === (firstIncomplete ?? courses[0].id)}
          >
            <summary>
              <span>
                <ChevronRight size={18} />
                {course.title}
              </span>
              <span className="week-summary">
                {completed}/{course.problems.length}
              </span>
            </summary>
            <a
              className="text-button course-link"
              href={`https://cojudge.musel.dev/?course=${course.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Open course on Cojudge <ArrowUpRight size={15} />
            </a>
            {course.problems.map((p) => (
              <ProblemRow
                key={p.id}
                p={p}
                state={state}
                day={day}
                review={!!state.progress[p.id]}
                onSelect={onSelect}
              />
            ))}
          </details>
        );
      })}
    </>
  );
}
