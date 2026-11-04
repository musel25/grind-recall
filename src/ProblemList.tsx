import { useState } from "react";
import { Search, ArrowUpRight, ChevronRight } from "lucide-react";
import { activeProblems, archivedProblems } from "./catalog";
import { ProblemRow } from "./ProblemRow";
import { reviewDay } from "./scheduler";
import type { BankWeek } from "./bank";
import type { Problem, StudyState } from "./types";
export function ProblemList({
  state,
  day,
  onSelect,
  groups,
}: {
  state: StudyState;
  day: string;
  onSelect: (p: Problem) => void;
  groups: BankWeek[];
}) {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("All difficulties");
  const [status, setStatus] = useState("All problems");
  const [collection, setCollection] = useState("Active plan");
  const archived = archivedProblems(state);
  const bank = collection === "Archive" ? archived : activeProblems(state);
  const filtered = bank.filter(
    (p) =>
      (!search || p.title.toLowerCase().includes(search.toLowerCase())) &&
      (difficulty === "All difficulties" || p.difficulty === difficulty) &&
      (status === "All problems" ||
        (status === "Not started"
          ? !state.progress[p.id]
          : status === "Practiced"
            ? !!state.progress[p.id]
            : !!state.progress[p.id] &&
              p.review !== false &&
              reviewDay(state.progress[p.id].due, state) <= day &&
              !state.planning?.breaks?.includes(day))),
  );
  const filteredIds = new Set(filtered.map((p) => p.id));
  return (
    <>
      <div className="page-heading">
        <h1>A little progress, every week.</h1>
        <p>
          {activeProblems(state).length} active problems in prerequisite-based
          learning order, grouped across your {groups.length}-week plan by
          estimated effort. This is your roadmap; Today accounts for reviews and
          study breaks. Includes all 75 Grind problems and your practiced
          LeetCode extras.
        </p>
      </div>
      <div className="list-tools">
        <select
          aria-label="Problem collection"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
        >
          <option>Active plan</option>
          <option>Archive</option>
        </select>
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Search problems"
            placeholder="Find a problem…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {["All difficulties", "Easy", "Medium", "Hard"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Filter progress"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {["All problems", "Not started", "Practiced", "Due reviews"].map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </select>
      </div>
      <p className="results-count">{filtered.length} problems</p>
      {filtered.length === 0 && (
        <div className="empty-state">
          <Search />
          <h2>No matching problems.</h2>
          <p>Try a different search or filter.</p>
        </div>
      )}
      {collection === "Archive" && (
        <p className="results-count">
          Archived problems are excluded from daily assignments and forecasts.
          Your practiced LeetCode extras remain in the active plan. Python
          courses stay archived, including practiced exercises.
        </p>
      )}
      {collection === "Archive" &&
        filtered.map((p) => (
          <a
            className="problem-row"
            key={p.id}
            href={p.url}
            target="_blank"
            rel="noreferrer"
          >
            <span className="problem-info">
              <strong>{p.title}</strong>
              <span className="meta">
                {p.difficulty} ·{" "}
                {p.course
                  ? "Archived · Open on Cojudge"
                  : "Archived · Open on LeetCode"}
              </span>
            </span>
            <ArrowUpRight size={17} />
          </a>
        ))}
      {collection === "Active plan" &&
        groups.map(({ week: w, problems: all }) => {
          const list = all.filter((p) => filteredIds.has(p.id));
          const count = all.filter((p) => state.progress[p.id]).length;
          return list.length ||
            (!search &&
              difficulty === "All difficulties" &&
              status === "All problems") ? (
            <details
              className="week-group"
              key={`${groups.length}-${w}-${search}-${difficulty}-${status}`}
              open={
                search ||
                difficulty !== "All difficulties" ||
                status !== "All problems"
                  ? true
                  : w === 1
              }
            >
              <summary>
                <span>
                  <ChevronRight size={18} />
                  Week {w}
                </span>
                <span className="week-summary">
                  {count}/{all.length}
                  <span className="mini-progress">
                    <span
                      style={{
                        width: `${all.length ? (count / all.length) * 100 : 0}%`,
                      }}
                    />
                  </span>
                </span>
              </summary>
              {all.length === 0 && (
                <p className="results-count">Review and catch up.</p>
              )}
              {list.map((p, i) => (
                <div key={p.id}>
                  {(i === 0 || list[i - 1].stage !== p.stage) && (
                    <h3 className="curriculum-stage">{p.stage}</h3>
                  )}
                  <ProblemRow
                    key={p.id}
                    p={p}
                    state={state}
                    day={day}
                    onSelect={onSelect}
                    review={!!state.progress[p.id]}
                  />
                </div>
              ))}
            </details>
          ) : null;
        })}
    </>
  );
}
