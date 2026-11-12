import {
  ArrowUpRight,
  CalendarDays,
  ListChecks,
  Repeat2,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import type { RefObject } from "react";
import type { PlanEstimate } from "./planning";
import type { progressSummary } from "./catalog";
export function StudySidebar({
  view,
  setView,
  queueLength,
  curriculum,
  onClose,
  sidebarRef,
}: {
  view: string;
  setView: (view: string) => void;
  queueLength: number;
  curriculum?: "python-next-steps";
  onClose: () => void;
  sidebarRef: RefObject<HTMLElement | null>;
}) {
  return (
    <aside ref={sidebarRef} className="sidebar">
      <div className="sidebar-heading">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("today");
            onClose();
          }}
        >
          <span className="brand-icon">
            <Repeat2 size={23} />
          </span>
          <span>
            Grind Recall<small>A little, every day.</small>
          </span>
        </a>
        <button
          type="button"
          className="sidebar-close"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
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
                onClose();
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
      <div className="sidebar-bottom">
        <a href="/week">
          Back to Timer <ArrowUpRight size={13} />
        </a>
        <ShieldCheck size={17} />
        <span>Saved on this device</span>
        <a
          href={
            curriculum === "python-next-steps"
              ? "https://cojudge.musel.dev/?course=python-next-steps"
              : "https://www.techinterviewhandbook.org/grind75/"
          }
          target="_blank"
          rel="noreferrer"
        >
          {curriculum === "python-next-steps"
            ? "Python Next Steps on Cojudge"
            : "Inspired by Grind 75"}{" "}
          <ArrowUpRight size={13} />
        </a>
      </div>
    </aside>
  );
}

export function StudyProgress({
  projection,
  total,
  practiced,
}: Pick<ReturnType<typeof progressSummary>, "total" | "practiced"> & {
  projection: PlanEstimate;
}) {
  const displayWeeks = projection.weeks;
  return (
    <section className="sidebar-plan" aria-label="Study progress">
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
    </section>
  );
}
