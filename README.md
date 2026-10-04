# Grind Recall

A daily Grind 169 planner with spaced repetition. Choose a completion deadline or a daily time budget; the other is estimated including spaced reviews.

Built with React, TypeScript, Vite, and FSRS. Hosted on a personal VPS. Progress stays in your browser; JSON backups let you move it between devices.

## Run locally

```sh
npm ci
npm run dev
# http://localhost:5173/grind/
```

```sh
npm test            # scheduling, dates, state validation, backups
npm run simulate    # time-budget and deadline scenarios
npm run build       # type-check and production build
npx playwright test # browser flows; requires local dev server and Google Chrome
```

## Scheduling and the math

The supplied list has 41 Easy, 102 Medium, and 26 Hard problems. Listed solving time sums to 4,575 minutes (76.25 hours). Solve + study is estimated at twice that: 152.5 hours. The first 10 completed remove 350 minutes, leaving **146.7 hours of first-pass work**.

FSRS via `ts-fsrs` uses default parameters and 90% desired retention, deterministic intervals, and no intraday steps. Again returns the next study day, retaining FSRS memory state. Hard, Good, and Easy use FSRS intervals from the first attempt onward. The rate button leads to all four choices, each showing its next due date. This is a coding-practice adaptation, not a guarantee of 90% interview performance. Dates are calendar days in the selected timezone. The four ratings distinguish needing help from independently solving with difficulty.

Daily practice prioritizes due reviews, then adds whole new problems in original order that fit today’s available time. Automatic daily time divides the remaining weekly time goal over available study days. Today’s time and this week’s goal can be overridden independently without changing future defaults. Completed time counts toward the weekly goal. “Add one more problem” adds exactly one next unstarted problem, even after the queue is complete. Today’s original candidates are reconstructed so fast or out-of-order completion does not silently refill the queue. Failed first attempts count as covered and remain scheduled for review; independent solutions are counted separately.

The forecast runs the same daily queue and FSRS scheduler as the app, preserving existing cards, history, breaks, and one-day/week overrides. It assumes Good ratings on future attempts and the configured solve/review durations. In **time mode**, daily hours are converted to a usual weekly goal and simulated until all problems have a first attempt (up to a two-year horizon). The displayed date and total weeks follow this result; old backups default to this mode without changing their time budget. In **deadline mode**, a bounded search finds a sufficient weekly budget to the nearest half-hour and verifies completion by the chosen deadline using the same simulation. The UI labels daily time as an average because breaks and weekly progress redistribute it. Due reviews remain visible even above that day's budget.

Predictions are recomputed after recorded practice or settings changes. They use actual saved cards and elapsed time but assume future Good ratings, so they are estimates rather than guarantees. No feasible simulation means an explicit adjustment message, not an invented finish date. Finishing means all 169 practiced once, not mastered or retired; reviews continue. Ratings already stored and upcoming dates are not rewritten by this update.

First-ten import records no fictional solve date or rating: baseline reviews are distributed two per day over the next five days. Progress is local to the browser. Export/import provides device transfer, not automatic sync. Backups are validated before replacing state; revisions detect stale tab writes. Undo reverts the latest attempt.

## Deployment

Production: https://timer.musel.dev/grind/

`./scripts/deploy.sh` builds committed code, checks tests, uploads a versioned static release to the `my-vps` SSH host, installs an isolated nginx location on the existing HTTPS vhost, validates nginx, and checks the page plus existing timer API health. Each commit must be pushed before deployment. No app backend or additional open port is required.

Releases: `/var/www/grind-recall/releases/<git-sha>`, active symlink: `/var/www/grind-recall/current`. To roll back, point `current` to a previous release with an atomic symlink replacement; nginx need not restart. Nginx config backups are beside the existing vhost, named `timer.musel.dev.grind-backup-<sha>`.

## Attribution

Problem list, order, supplied difficulty classifications and time estimates: [Grind 75 by Tech Interview Handbook](https://www.techinterviewhandbook.org/grind75/?weeks=15&hours=10). Individual problem statements remain on LeetCode. Scheduling library: [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs).

### Shared-origin compatibility

The Planner service worker must exclude `/grind/` from its navigation fallback. This is configured in the timer repository (`client/vite.config.ts`, commit `871da52`) and deployed. `npm run test:live` checks the live app after first installing Planner’s service worker, then verifies practice, persistence and mobile layout in an isolated browser.

## Flexible days and study breaks

Use Today → Adjust time for a one-day time budget or current study-week hours override. Weeks are seven-day blocks anchored to the plan start. Settings → Planned study break blocks an inclusive date range. Existing review due dates are preserved internally and displayed/queued on the next available day; new ratings store the adjusted due date. This preserves FSRS memory history; time mode updates the completion estimate and deadline mode recalculates the required study time. No assignments appear on break days. For the requested October 8–12, 2026 break, the initial imported reviews on October 8 and 9 appear on October 13. Break dates live in the browser’s saved state and export with backups.

Timer’s sidebar (Tools → Grind Recall), or More → Grind Recall on mobile, links directly to this app. Navigation uses a full-page link so the separate app loads correctly.
