# Code and Agent Setup Implementation Plan

> For agentic workers: Execute this approved repair scope in this session. Use one final independent review.

**Goal:** Fix every issue in the code and agent setup review requested by the user.

**Architecture:** Keep the existing React app and scheduling model. Use the full catalog for historical work and the active catalog for current progress. Extract existing views without changing their behavior. Run browser tests against the real Timer routes with test-specific databases.

**Tech Stack:** React, TypeScript, Vite, Node test runner, Playwright, GitHub Actions.

**Spec:** The review in this conversation and the user's instruction, “fix all”.

## Global Constraints

- Preserve the existing notebook edit and untracked `output/` directory.
- Keep saved progress, history, notes, and backup compatibility.
- Use a feature branch. Commit each self-contained change and push it immediately.
- Do not deploy or change the Timer repository or machine-wide skills.
- Keep one project workflow. Use current project rules instead of historical plans.

## Review Focus

- A retired exercise reviewed today must not crash planning or erase recorded time.
- Active progress counts must exclude retired work and remain at or below 100%.
- Extracted views must preserve navigation, ratings, search, and account sync.
- Browser tests must use disposable databases and keep production rate limits intact.
- Deployment must reject an unpushed commit before any upload.

### Task 1: Retired review history

Files: `src/scheduler.ts`, `tests/python-selection.test.ts`.

- [x] Add a regression for a valid backup with a retired review today. Confirm failure.
- [x] Resolve historical estimates from the full catalog. Preserve actual recorded time.
- [x] Run the unit suite and build. Commit and push.

### Task 2: Active progress counts

Files: `src/catalog.ts`, `src/App.tsx`, `tests/progress.test.ts`.

- [x] Add a regression for a completed active plan plus retired progress. Confirm failure.
- [x] Add shared `progressSummary(state)` counts based on active problems and use them in the app.
- [x] Run the unit suite and build. Commit and push.

### Task 3: Extract app views

Files: `src/App.tsx`, `src/ProblemRow.tsx`, `src/ProblemSection.tsx`, `src/ProblemList.tsx`, `src/CourseList.tsx`, `src/StudySidebar.tsx`, `src/TodayView.tsx`.

- [x] Move existing view components into focused modules. Keep UI behavior intact.
- [x] Run the unit suite and build. Commit and push.

### Task 4: Reproducible checks

Files: `package.json`, lockfile, TypeScript config, Playwright config, `scripts/`, `tests/browser/`, `.github/workflows/`, formatting config.

- [x] Add formatting and complete type checks with a single `npm run check` command.
- [x] Add pinned Timer setup and test-specific API/Vite fixtures with temporary databases.
- [x] Add browser coverage for the retired-history and progress-count fixes.
- [x] Add CI for local checks and the full browser suite. Keep live production checks separate.
- [x] Test deployment refusal with a temporary Git remote before adding the push guard.
- [x] Run all checks and the browser suite. Commit and push.

### Task 5: Project instructions and current documentation

Files: `AGENTS.md`, `README.md`, `docs/architecture.md`, historical plans and spec.

- [x] Add a concise code map, one workflow, required checks, and push/deployment boundaries.
- [x] Correct Python counts and week rules. Mark old plans and specs as historical.
- [x] Document setup and verification commands without relying on past conversations.
- [x] Get one independent review. Resolve findings. Run final checks. Commit and push.

## Execution Notes

- Baseline: 85 unit tests and production build pass. Three test files need formatting.
- Ruling: Work on a feature branch in the existing checkout. Preserve unrelated files with explicit staging.
- Ruling: The user's “fix all” approves the repair scope already described in chat. No further design question is needed.
- Ruling: Leave machine-wide skills and unrelated audio settings unchanged. Define one scoped workflow in this repository.

- Task 1 complete: `a36136f`. Both regression cases failed before the fix. The full suite passed (87 tests), and the build passed. Pushed.
- Task 2 complete: `7ec25df`. Both rendered progress tests failed before the fix. The full suite passed (89 tests), and the build passed. Pushed.
- Task 3 complete: `c5b7327`. The full suite passed (89 tests), and the build passed. Pushed. `App.tsx` decreased from 1,308 to 365 lines.
- Task 4: Deployment tests failed in the three unpushed/unsynced cases before the guard. All four cases now pass. App dependency audit found a Vite advisory; Vite was updated to 8.3.5. The app audit now reports zero vulnerabilities.
- Task 4 ruling: Use one disposable API process per test, instead of per worker, so real registration rate limits never leak across tests.
- Task 5 review: The independent reviewer found a historical completed-row lookup still using the active catalog. A browser test confirmed the missing dialog. The lookup now uses the full catalog.
- Verification note: A first full browser run had a trace-file conflict because a targeted regression run used the same results directory concurrently. Run the final full suite alone.

- Task 4 complete: `npm run check` passes with 93 unit tests. The full managed-Chromium suite passes with 22 browser tests, including desktop/mobile retired history and account-sync cases. The isolated backend setup completed from the pinned public revision.
- Task 5 complete: Local documentation links pass. `npm run simulate` passes. Independent follow-up review has no remaining actionable findings. Mobile course layout was inspected. No deployment was performed.
