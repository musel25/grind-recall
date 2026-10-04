import { useState, useRef, useEffect } from "react";
import { Download, Upload, Info } from "lucide-react";
import { downloadBackup, validateState } from "./storage";
import { StudyBreak } from "./StudyBreak";
import type { StudyState } from "./types";
export function Settings({
  state,
  onSave,
  onImport,
}: {
  state: StudyState;
  onSave: (s: StudyState) => boolean;
  onImport: (s: StudyState) => boolean;
}) {
  const [draft, setDraft] = useState(state.settings);
  useEffect(() => setDraft(state.settings), [state.settings]);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const zones = [
    ...new Set([
      draft.timezone,
      "America/Tijuana",
      "America/Los_Angeles",
      "America/New_York",
      "Europe/Paris",
      "Europe/London",
      "Asia/Kolkata",
      "Asia/Tokyo",
      "UTC",
    ]),
  ];
  return (
    <div className="settings-view">
      <div className="page-heading">
        <h1>Make it your routine.</h1>
        <p>Set a target. Keep the workload honest.</p>
      </div>
      <form
        className="settings-panel"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const s = validateState({
              ...state,
              settings: draft,
              revision: state.revision + 1,
            });
            if (onSave(s))
              setMessage(
                "Settings saved. Your existing review dates are unchanged.",
              );
          } catch (err) {
            setMessage((err as Error).message);
          }
        }}
      >
        <h2>Your study plan</h2>
        <div className="settings-grid">
          <label>
            Start date
            <input
              type="date"
              required
              value={draft.startDate}
              onChange={(e) =>
                setDraft({ ...draft, startDate: e.target.value })
              }
            />
          </label>
          <label>
            Plan length (weeks)
            <input
              type="number"
              required
              min="1"
              max="52"
              value={draft.weeks}
              onChange={(e) =>
                setDraft({ ...draft, weeks: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Time available (hours/week)
            <input
              type="number"
              required
              min="1"
              max="80"
              step="0.5"
              value={draft.hours}
              onChange={(e) =>
                setDraft({ ...draft, hours: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Study timezone
            <select
              value={draft.timezone}
              onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
            >
              {zones.map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </label>
          <label>
            Estimated review duration
            <select
              value={draft.reviewMultiplier}
              onChange={(e) =>
                setDraft({ ...draft, reviewMultiplier: Number(e.target.value) })
              }
            >
              <option value="1">Full solve — 100% of listed time</option>
              <option value="0.5">Faster solve — 50% of listed time</option>
              <option value="0.25">Brief recall — 25% of listed time</option>
              {![1, 0.5, 0.25].includes(draft.reviewMultiplier) && (
                <option value={draft.reviewMultiplier}>
                  Custom ({draft.reviewMultiplier * 100}%)
                </option>
              )}
            </select>
          </label>
        </div>
        <p className="hint">
          Changing this estimate adjusts the time forecast, not your review
          dates. Brief recall is less practice than writing a complete solution.
        </p>
        <button className="button primary" type="submit">
          Save settings
        </button>
        {message && (
          <p role="status" className="hint">
            {message}
          </p>
        )}
      </form>
      <StudyBreak state={state} onSave={onSave} />
      <section className="settings-panel">
        <h2>Your progress belongs to you.</h2>
        <p>
          Progress is saved in this browser, on this device. Export a backup
          before clearing browser data, or import it on another device. There is
          no account or automatic cloud sync.
        </p>
        <div className="button-row">
          <button
            className="button secondary"
            onClick={() => downloadBackup(state)}
          >
            <Download size={17} /> Export backup
          </button>
          <button
            className="button secondary"
            onClick={() => input.current?.click()}
          >
            <Upload size={17} /> Import backup
          </button>
        </div>
        <input
          ref={input}
          type="file"
          hidden
          accept="application/json,.json"
          aria-label="Import backup file"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              if (file.size > 10_000_000)
                throw Error("Backup is too large (maximum 10 MB).");
              const s = validateState(JSON.parse(await file.text()));
              if (
                window.confirm(
                  `Replace this browser's progress with ${Object.keys(s.progress).length} practiced problems and ${s.history.length} attempts from this backup? Export your current backup first if needed.`,
                )
              ) {
                if (onImport(s)) setMessage("Backup imported.");
              }
            } catch (err) {
              setMessage((err as Error).message);
            }
          }}
        />
      </section>
      <section className="settings-panel explanation">
        <h2>
          <Info size={19} /> How reviews work
        </h2>
        <p>
          First attempts and <strong>Again</strong> return tomorrow, or the next
          study day during a planned break. After that, FSRS adjusts the
          interval using your previous results. <strong>Hard</strong> means you
          solved it independently with difficulty. If you needed hints or the
          solution, choose <strong>Again</strong>.
        </p>
        <p>
          The default FSRS model targets 90% recall, but this is not a promise
          about interview performance. We use daily intervals, keep memory
          history after failures, and show the next review date before you rate.
        </p>
        <p>
          New problems fit the time available today, after due reviews. Extra
          problems are always your choice. Estimates include solving and
          studying the answer. Reviews continue after your target date.
        </p>
        <a
          href="https://github.com/open-spaced-repetition/ts-fsrs"
          target="_blank"
          rel="noreferrer"
        >
          About the FSRS scheduler
        </a>
      </section>
    </div>
  );
}
