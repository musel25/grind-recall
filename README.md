# Grind Recall

A daily planner for Grind 75, with spaced repetition. Choose a completion deadline or a daily time budget; the other is estimated including spaced reviews.

Built with React, TypeScript, Vite, and FSRS. Hosted on a personal VPS. Progress syncs to a separate account on the VPS through the Planner API. JSON backups remain available.

## Run locally

Use Node 22.21.0, as recorded in `.nvmrc`. Read [AGENTS.md](AGENTS.md) for project instructions and [docs/architecture.md](docs/architecture.md) for the current code map and behavior rules.

```sh
npm ci
npm run dev
# http://localhost:5173/grind/
```

```sh
npm run check         # formatting, app/tool types, unit tests, production build
npm run simulate      # time-budget and deadline scenarios
npm run setup:browser # first run: pinned Timer backend and managed Chromium
npm run test:browser  # starts isolated servers and a temporary database per test
```

On a supported Linux host that needs browser system packages, use `npm run setup:browser -- --with-deps`. Tests use the real Timer API routes and keep production rate limits enabled. They do not use a personal database. GitHub Actions runs local checks and browser tests for pull requests and `main`. `npm run test:live` is a separate production action and is excluded from CI.

## Scheduling and the math

The default active plan contains the 75 Grind problems. The nine Applied AI exercises are archived (2026-11-04), including practiced exercises and pending morning work. Previously practiced LeetCode extras stay active per account. Untouched algorithm extras are archived. All 72 Pybites course exercises are archived (2026-11-04), including practiced exercises and pending morning work. Archived Cojudge work does not enter assignments, reviews, forecasts, or completion counts. Saved attempts, notes, morning marks, and FSRS memory remain intact. Original catalog IDs and source membership remain recorded.

FSRS via `ts-fsrs` uses default parameters and 90% desired retention, deterministic intervals, and no intraday steps. Again returns the next study day, retaining FSRS memory state. Hard, Good, and Easy use FSRS intervals from the first attempt onward. The rate button leads to all four choices, each showing its next due date. This is a coding-practice adaptation, not a guarantee of 90% interview performance. Dates are calendar days in the selected timezone. The four ratings distinguish needing help from independently solving with difficulty.

Daily practice prioritizes due reviews, then adds new Grind problems in learning order to reach the closest whole-problem total to the time target. Weekly budgets run Monday–Sunday in the study timezone; the first partial week's usual goal is prorated by calendar days from the plan start. Existing weekly overrides apply to the calendar week containing their saved date. Journey week numbers still count from the plan start date. Automatic daily time divides the weekly goal minus practice before today over remaining study days, excluding breaks. Today's budget includes practice already done today and stays stable during the day; the daily time in Settings is a weekly average. Today’s time and this week’s goal can be overridden independently without changing future defaults. Completed time counts toward the weekly goal. “Add one more problem” adds exactly one next unstarted problem, even after the queue is complete. Today’s original candidates are reconstructed so fast or out-of-order completion does not silently refill the queue. Failed first attempts count as covered and remain scheduled for review; independent solutions are counted separately.

The forecast runs the same daily queue and FSRS scheduler as the app, preserving existing cards, history, breaks, and one-day/week overrides. It assumes Good ratings on future attempts and the configured solve/review durations. In **time mode**, daily hours are converted to a usual weekly goal and simulated until all problems have a first attempt (up to a two-year horizon). The displayed date and total weeks follow this result; old backups default to this mode without changing their time budget. In **deadline mode**, choose a specific **Finish date** in Settings. A bounded search finds a sufficient weekly budget to the nearest half-hour and verifies completion by that exact calendar date using the same simulation. The UI labels daily time as an average because breaks and weekly progress redistribute it. Due reviews remain visible even above that day's budget.

Predictions are recomputed after recorded practice or settings changes. They use actual saved cards and elapsed time but assume future Good ratings, so they are estimates rather than guarantees. No feasible simulation means an explicit adjustment message, not an invented finish date. Finishing means all active problems practiced once, not mastered or retired; reviews continue. Ratings already stored and upcoming dates are not rewritten by this update.

First-ten import records no fictional solve date or rating: baseline reviews are distributed two per day over the next five days. Sign in with a Planner account or create a separate account. Each account has private progress. Backups are validated before replacing state; revisions detect stale tab writes. Undo reverts the latest attempt.

The practice page starts with the left panel closed. Use the menu button for Today, All problems, Settings, and the link back to Planner. The progress summary stays at the top of the page. Use the account button for sync status, backups, Sync now, and Sign out.

## Deployment

Production: https://timer.musel.dev/grind/

When deployment is requested, `./scripts/deploy.sh` requires a clean checkout and fetches the upstream branch to verify that its commit matches `HEAD`. It runs `npm ci` and `npm run check`, uploads a versioned static release to the `my-vps` SSH host, installs an isolated nginx location on the existing HTTPS vhost, validates nginx, and checks the page plus existing timer API health. A missing upstream, unpushed commit, or newer remote commit stops deployment before building or uploading. The Timer backend must be deployed first with its own `./deploy.sh`; Grind uses `/api/grind/` on the same origin and needs no additional public port.

Releases: `/var/www/grind-recall/releases/<git-sha>`, active symlink: `/var/www/grind-recall/current`. To roll back, point `current` to a previous release with an atomic symlink replacement; nginx need not restart. Nginx config backups are beside the existing vhost, named `timer.musel.dev.grind-backup-<sha>`.

## Attribution

Problem list, supplied difficulty classifications and time estimates: [Grind 75 by Tech Interview Handbook](https://www.techinterviewhandbook.org/grind75/?weeks=15&hours=10). Bloomberg membership: the user-supplied snapshot of liquidslr/leetcode-company-wise-problems, Bloomberg/1. Thirty Days.csv; recorded frequencies are historical and do not determine learning order. Individual problem statements remain on LeetCode. Scheduling library: [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs).

### Shared-origin compatibility

The Planner service worker must exclude `/grind/` from its navigation fallback. This is configured in the timer repository (`client/vite.config.ts`, commit `871da52`) and deployed. `npm run test:live` checks the live app after first installing Planner’s service worker, then verifies account creation, VPS saving, phone sign-in, isolation and mobile layout. It creates two temporary accounts and deletes those exact test accounts over SSH afterward.

## Flexible days and study breaks

Use Today → Adjust time for a one-day time budget or current calendar-week hours override. Weekly budgets run Monday–Sunday in the study timezone. The first partial week is prorated from the plan start. Journey week numbers count seven-day periods from the plan start. Settings → Planned study break blocks an inclusive date range. Saving a break redistributes affected reviews (including the resume-day cohort) with a soft target of seven scheduled reviews per day. Imported/low-stability cards go first; failed retries keep the first available day. Other reviews use the earliest available slot within three study days of their adjusted due date, falling back to the least occupied of those days. Existing later appointments remain reserved. New ratings use the same bounded allocation, excluding the current card; Again bypasses balancing. Due dates and scheduled intervals change, but ratings, notes, history, and FSRS memory fields do not. Re-saving the same break is stable; removing it keeps assigned appointments. Seven is a count target, not a time budget or a hard queue cap: overdue work and retries remain visible. This preserves FSRS memory history; time mode updates the completion estimate and deadline mode recalculates the required study time. No assignments appear on break days. Break dates sync with the account state and export with backups.

Timer’s sidebar (Tools → Grind Recall), or More → Grind Recall on mobile, links directly to this app. Navigation uses a full-page link so the separate app loads correctly.

## Daily time and fewer reviews

Today shows the usual daily average and this week's remaining time in one plan summary. Today's share uses the time practiced before today and the study days left this week. The assigned list can exceed that share because due reviews stay visible and new problems are whole tasks. New problems use the closest whole-problem total in learning order after reviews. Completing or skipping work does not add replacement work. Shorter review estimates leave more time for new problems when the next whole problem fits that total.

Automatic deadline updates keep your saved weekly time so fewer reviews leave more time for new problems. They can increase the budget to meet the deadline. Changing the planning mode, start date, or finish date in Settings can recalculate a lower budget. Changing only the review duration keeps the saved weekly time.

To reduce review counts, use **Today → Adjust time → Spread reviews**. The default is at most four reviews per day for seven days starting today. Completed reviews count toward this limit. The saved dates move to available study days; excess reviews can move past the end date. New ratings, failed retries, missed days, and the forecast use the same limit during this period. Outside this period, the usual review rules apply. Notes, attempts, morning marks, and FSRS memory remain saved. The selected option also restores automatic daily time for these dates. This removes custom daily budgets that can otherwise leave less time for new problems.

## Skipping individual problems

Use **Not today** beside any unfinished problem in Today, including reviews and morning-study items. It hides just that problem for the current calendar day without filling its slot with another problem. **Skipped today → Undo** restores it. Skips save to your account and backups; they do not log time, mark completion, remove morning-study marks, or change review dates or FSRS memory.

Skipped reviews return on the next study day with their original due dates and may show as overdue. New problems remain in learning order and become eligible again next study day, subject to reviews and the available time budget; they are not all forced into tomorrow. Later new work can consequently move back. Explicit extra additions apply only to their original day. The weekly goal remains unchanged, so unfinished time is redistributed over the remaining study days. The completion estimate recalculates (or deadline mode adjusts the required future budget). While skips remain, today's automatic time budget is held steady so recalculation does not add replacements. Undoing every skip releases that hold, preserving any explicit time override. Adjust time → Use automatic time also releases it.

Coming up lists known reviews. You can open and rate a review early. Its next review date then follows the new rating. The time you record counts toward this week's goal. It can lower an automatic budget on a later day in the same week. A custom daily budget stays fixed.

## Morning study, evening recall

“Studied this morning” on a new problem row or inside its practice dialog records a date-only marker. It does not create a rating, change FSRS cards/due dates, increase completed counts, or log minutes. Pending work appears once in “Practice tonight”, persists across reloads/backups, and carries forward until rated or unmarked (hidden during study breaks). The evening attempt records the combined study/practice time once. Rating resolves the marker via history; Undo last attempt restores the pending item. Existing backups without morning markers remain valid.

## Account sync and migration

Open Grind first in the browser with your existing progress. Use your Planner login, then choose **Save existing progress to my account**. The old `grind-recall:v1` value is never overwritten or removed. On your phone, sign in to the same account. A partner should create their own account and start fresh; do not import your browser progress into their account.

Each device keeps an account-scoped snapshot and pending save. Writes use server versions and idempotent mutation IDs. Concurrent stale saves stop with a conflict notice; export the local version, then explicitly load the server version. That action also keeps a local recovery copy. Backups can be imported through Settings when an intentional replacement is needed. A legacy browser backup is available from the account menu even if an account already has progress.

An open page retains edits locally if its connection fails and retries on reconnect, focus, or every five seconds. Open the account menu and wait for **Saved to your account** before changing devices. Reopening the app requires a connection to verify login. Background updates wait while a practice dialog, Settings, or daily-time editor is open so unsaved drafts are not silently discarded. A save attempted during an in-flight request asks you to retry; it never reports success without storing the edit.

Older tabs opened before account sync was deployed can still write to the original browser save. On startup, sync, and storage changes, Grind checks that save for problems, attempts, or morning marks missing from the account, even when the account already has progress. A prominent recovery notice replaces the all-saved status. **Restore browser progress to my account** restores the original progress while keeping current account settings and planning, only when it preserves all account attempts, cards, notes and morning marks; it first backs up the account copy and then syncs normally. Conflicting copies stay intact with export actions for reconciliation. Account ownership is explicit: someone else’s original browser progress can be excluded. Once incorporated, the original snapshot is remembered so intentional Undo does not resurrect old attempts. Close pre-account tabs after recovery.

For local dev, run Timer on port 8080, or set `GRIND_API_URL=http://127.0.0.1:18080` before starting Vite. Automated browser tests start their own disposable backend for each test. They do not use the development API. Registration remains limited to 20 accounts per 15 minutes per process and login/registration to 30 attempts per IP per window. Fresh test processes prevent repeated runs from sharing those limits.

## Learning order

The combined Grind 75 + Bloomberg curriculum follows prerequisite-based learning stages. The full sequence and rationale are in [the curriculum review](docs/catalog/learning-order.md); exact supplied membership is in [focused-sources.json](docs/catalog/focused-sources.json). The original 169-problem snapshot remains in [original-problems.json](docs/catalog/original-problems.json). Stable IDs preserve account progress, reviews, notes, morning marks and backups. Active totals, roadmap weeks, new assignments and forecasts all use the account’s focused list plus practiced extras. Choose Archive in the problem bank to browse the excluded problems.

## Problem-bank weeks

Old week-based deadlines keep the same date when opened in Settings. The finish date stays fixed if you change the start date. Switching to study time mode removes the fixed deadline and estimates completion from your daily budget.

The bank uses the same plan length as the sidebar: the number of weeks covering the selected finish date in deadline mode, or the current estimated weeks in time mode. Whole problems are grouped in learning order by cumulative solving estimates (first-pass study is a uniform 2× multiplier), rather than the original catalog's fixed 15-week labels. Grouping happens before search and filters, so a problem keeps its week when filtered. Practice dialogs show that same plan week. These groups are a curriculum roadmap, not scheduled assignments: Today continues to account for actual progress, reviews, breaks, and time overrides. Changing the roadmap never rewrites progress or FSRS dates. Very long plans may have empty groups reserved for review/catch-up.

## Archived Cojudge courses

All nine Applied AI exercises and all five Pybites courses are archived. The default plan has 75 problems. An account with four practiced LeetCode extras has 79. Browse them through **All problems → Archive** to open them on Cojudge. There is no separate courses menu.

Archiving keeps all 81 Cojudge catalog IDs, attempts, notes, recorded time, morning marks, and FSRS memory. Existing backups remain valid. Archived Cojudge work no longer appears in assignments, reviews, forecasts, or progress totals, even if you practiced it. Historical attempts remain available in completed study history.

The Pybites archive policy is stored in [python-first-pass.json](docs/catalog/python-first-pass.json). The importer also keeps Applied AI retired. All course selections are empty and all 72 exercise IDs are retired. Refreshing the catalog preserves this policy:

```sh
node scripts/import-cojudge.mjs /path/to/archived-cojudge-content /path/to/applied-ai-content
```

The first content root supplies the unchanged 72-exercise Pybites archive. The optional second root supplies the native `applied-ai-nine` course and problem metadata. Pass both roots to refresh the full catalog. A one-root refresh preserves the existing nine AI records. Both refresh modes keep all nine AI exercises archived. If no complete AI course exists, it stops and asks for the second root. The importer divides native `studyMinutes` by two because the scheduler applies a 2× first-study multiplier. Source exercises remain in Cojudge. Importing does not publish content.

## Offline interview notebooks

[Flight study pack](flight-study/README.md): five problems from the earlier curriculum, with runnable Python notebooks, matching Markdown guides, explained solution alternatives, debugging traces, and test cases.
