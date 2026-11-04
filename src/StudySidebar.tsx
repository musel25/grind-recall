import {
  ArrowUpRight,
  CalendarDays,
  ListChecks,
  Repeat2,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import type { PlanEstimate } from "./planning";
import type { progressSummary } from "./catalog";
export function StudySidebar({
  view,
  setView,
  queueLength,
  projection,
  total,
  practiced,
  independent,
}: ReturnType<typeof progressSummary> & {
  view: string;
  setView: (view: string) => void;
  queueLength: number;
  projection: PlanEstimate;
}) {
  const displayWeeks = projection.weeks;
  return (
    <aside className="sidebar">
      <a
        className="brand"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setView("today");
        }}
      >
        <span className="brand-icon">
          <Repeat2 size={23} />
        </span>
        <span>
          Grind Recall<small>A little, every day.</small>
        </span>
      </a>
      <nav aria-label="Main navigation">
        {[
          ["today", "Today", CalendarDays],
          ["problems", "All problems", ListChecks],
          ["settings", "Settings", Settings2],
        ].map(([key, label, Icon]) => {
          const C = Icon as typeof CalendarDays;
          return (
            <button
              key={key as string}
              aria-label={label as string}
              className={view === key ? "nav-item active" : "nav-item"}
              onClick={() => {
                setView(key as string);
                window.scrollTo(0, 0);
              }}
            >
              <C size={19} />
              <span>{label as string}</span>
              {key === "today" && queueLength > 0 && (
                <span className="nav-count">{queueLength}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="sidebar-plan">
        <div className="small-heading">
          {projection?.feasible
            ? `Your ${displayWeeks}-week journey`
            : "Your study journey"}{" "}
          <span>{Math.round((practiced / total) * 100)}%</span>
        </div>
        <div className="progress-track">
          <div style={{ width: `${(practiced / total) * 100}%` }} />
        </div>
        <p>
          <strong>{practiced}</strong> of {total} practiced
        </p>
        <span className="sidebar-caption">
          {independent} solved independently
        </span>
      </div>
      <div className="sidebar-bottom">
        <a href="/week">
          Back to Timer <ArrowUpRight size={13} />
        </a>
        <ShieldCheck size={17} />
        <span>Saved on this device</span>
        <a
          href="https://www.techinterviewhandbook.org/grind75/"
          target="_blank"
          rel="noreferrer"
        >
          Inspired by Grind 75 <ArrowUpRight size={13} />
        </a>
      </div>
    </aside>
  );
}
