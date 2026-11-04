# Current Architecture and Development

This file describes the current app. The README describes setup and use. Older specs and implementation plans describe past decisions. They do not override current behavior or grant permission to deploy.

## Code Map

| Module                                         | Responsibility                                                                    |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| `src/catalog.ts`                               | Full catalog, account-specific active list, archive, and active progress counts.  |
| `src/model.ts`                                 | Attempts, Undo, breaks, morning study, and day/week adjustments.                  |
| `src/scheduler.ts`                             | Calendar arithmetic, FSRS ratings, review allocation, budgets, and today's queue. |
| `src/planning.ts`                              | Forecasts using the same scheduler and queue as actual study.                     |
| `src/storage.ts`                               | Backup validation, local persistence, stale-tab checks, and JSON export.          |
| `src/cloud.ts`                                 | Account snapshots, pending saves, mutation IDs, version conflicts, and recovery.  |
| `src/Account.tsx`                              | Login, migration, account notices, and the sync lifecycle.                        |
| `src/App.tsx`                                  | App state, navigation, persistence callbacks, settings, and the practice dialog.  |
| `src/TodayView.tsx`                            | Daily summary, queue, completed work, adjustments, and upcoming reviews.          |
| `src/StudySidebar.tsx`                         | Navigation and active progress display.                                           |
| `src/ProblemList.tsx`                          | Active problem bank and archive.                                                  |
| `src/ProblemRow.tsx`, `src/ProblemSection.tsx` | Shared study rows and section controls.                                           |
| `src/Session.tsx`, `src/Settings.tsx`          | Practice ratings and plan settings.                                               |

## Catalog and Historical Data

The default active list has 84 problems: 75 Grind algorithm problems and nine Applied AI exercises. An account with four practiced LeetCode extras has 88. Previously practiced LeetCode extras remain active per account. All 72 Pybites exercises are deferred and retired, including practiced exercises and pending morning work. The importer preserves this archive policy. Pybites remains in the full catalog for backups and historical attempts. The sidebar has no courses view. Applied AI exercises appear in All problems and Today. `scripts/import-cojudge.mjs` takes the archived content root and an optional second root for the native `applied-ai-nine` course. Pass both roots to refresh all 81 Cojudge records. A legacy one-root refresh preserves the existing nine AI records. Without a complete existing AI course, it stops before writing. It rejects missing or reordered native AI exercises. It preserves archived metadata and maps `studyMinutes / 2` to the catalog estimate, matching the scheduler’s 2× first-study multiplier.

Active reviewable exercises use FSRS. Old Python completions without ratings remain valid in the archive. No ratings or memory history are invented.

Use the active list for assignments, forecast completion, review-slot allocation, and progress percentages. Use the full catalog for historical attempts. Retired exercises can appear in valid backups or today's history. Their recorded time still counts toward actual practice time. Keep saved progress and notes intact.

## Dates, Budgets, and Forecasts

Store study days as `YYYY-MM-DD`. Use the selected study timezone to determine today. Calendar arithmetic uses UTC noon to avoid daylight-saving transitions.

Weekly budgets run Monday through Sunday. Prorate the first partial week from the plan start. Old weekly override keys apply to the calendar week containing the saved date. Journey week numbers count seven-day periods from the plan start. They are display labels, not budget boundaries.

Due reviews take priority and stay visible above budget. New problems fit the remaining daily time. New assignments alternate active algorithms and Applied AI exercises in their respective learning order. Both tracks share one time budget and the FSRS review scheduler. Reconstruct original daily candidates before removing completed or skipped work. Do not silently refill those slots.

Forecasts clone saved state. They reuse the daily queue and scheduler and assume future Good ratings. Time mode estimates a finish date. Deadline mode searches for a sufficient weekly budget and verifies it with the same simulation. Completion means every active problem has a first attempt. Reviews continue afterward.

## Account Data

Local saves validate the snapshot before persistence. Cloud saves use server versions and mutation IDs. A stale device must not overwrite a newer server version. Conflict recovery retains a local copy before accepting server state. Remote updates wait while an editor is open.

The API belongs to the separate [Timer repository](https://github.com/musel25/timer). Grind is served below `/grind/` and uses same-origin `/api/grind/` routes. The Planner service worker must exclude `/grind/` from its navigation fallback.

## Checks

| Command                                              | Purpose                                                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm ci`                                             | Install locked app dependencies.                                                                         |
| `npm run check`                                      | Check formatting, app/tool types, unit tests, and the production build.                                  |
| `npm run format`                                     | Format maintained app files. Generated catalogs, historical docs, notebooks, and `output/` are excluded. |
| `npm run setup:browser`                              | Prepare the pinned Timer test backend and install Chromium.                                              |
| `npm run setup:browser -- --with-deps`               | Also install browser system dependencies on a supported Linux host.                                      |
| `npm run test:browser`                               | Run browser tests with test-owned API/Vite servers and databases.                                        |
| `npm run test:browser -- tests/browser/sync.spec.ts` | Run one browser test file.                                                                               |
| `npm run simulate`                                   | Print representative plan forecasts.                                                                     |

The tools TypeScript configuration includes tests, JavaScript and TypeScript scripts, and Vite/Playwright configuration. GitHub Actions runs local checks and browser tests in separate jobs. Live production checks are excluded from CI.

Each browser test gets a fresh API process and database. This resets the real process-local registration limits between tests. No production limiter is disabled. Servers bind to loopback on assigned ports. Teardown closes servers and removes temporary database files. Additional browser contexts use the `baseURL` fixture.

The Timer revision is pinned in `scripts/browser-config.mjs`. To update it, change the revision, rerun setup, and run the full browser suite. For local backend development, set `TIMER_REPO` to a prepared checkout. Setup does not modify that checkout. Use `CHROME_PATH` only to select a system browser instead of managed Chromium.

Fixture design follows the [Playwright fixture documentation](https://playwright.dev/docs/test-fixtures). Script checking uses TypeScript's [checkJs option](https://www.typescriptlang.org/tsconfig/checkJs.html).

## Deployment Checks

The deploy script rejects local changes. It fetches the configured upstream and requires its commit to match `HEAD`. A local commit, missing upstream, detached checkout, or newer remote commit stops deployment before dependency installation or upload. It runs `npm run check` before creating a release archive.

Deployment needs an explicit user request. The live account check creates temporary production accounts and removes those exact accounts over SSH. It is a separate authorized verification action.
