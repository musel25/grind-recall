import { useState, useEffect } from "react";
import { CalendarOff } from "lucide-react";
import { setStudyBreak } from "./model";
import type { StudyState } from "./types";
export function StudyBreak({
  state,
  onSave,
}: {
  state: StudyState;
  onSave: (s: StudyState) => boolean;
}) {
  const days = [...(state.planning?.breaks ?? [])].sort();
  const [start, setStart] = useState(days[0] ?? "");
  const [end, setEnd] = useState(days.at(-1) ?? "");
  const [message, setMessage] = useState("");
  useEffect(() => {
    setStart(days[0] ?? "");
    setEnd(days.at(-1) ?? "");
  }, [days[0], days.at(-1)]);
  return (
    <form
      className="settings-panel"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          if (onSave(setStudyBreak(state, start, end)))
            setMessage(
              "Study break saved. Reviews spread across the following study days.",
            );
        } catch (e) {
          setMessage((e as Error).message);
        }
      }}
    >
      <h2>
        <CalendarOff size={18} /> Planned study break
      </h2>
      <p>
        No daily assignments on these dates. Reviews aim for seven per day
        across the first three study days afterward. Failed retries stay on the
        first day; overdue work can exceed this target. Removing a break keeps
        assigned review dates. A time-based plan updates its finish estimate; a
        deadline-based plan adjusts the required study time.
      </p>
      <div className="settings-grid break-inputs">
        <label>
          Break starts
          <input
            type="date"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          Break ends
          <input
            type="date"
            required
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
      </div>
      <div className="button-row">
        <button className="button primary" type="submit">
          Save study break
        </button>
        {days.length > 0 && (
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              if (onSave(setStudyBreak(state, null, null)))
                setMessage("Study break removed.");
            }}
          >
            Remove study break
          </button>
        )}
      </div>
      {message && (
        <p className="hint" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
