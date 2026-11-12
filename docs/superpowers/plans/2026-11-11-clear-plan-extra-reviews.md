# Clear Plan and Extra Reviews Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement this plan task by task. Steps use checkboxes for tracking.

**Goal:** Show one clear explanation of study time and let the user add a practiced problem to a chosen upcoming review day.

**Architecture:** Keep automatic FSRS due dates in `progress`. Store optional manual review IDs in each day adjustment. Add manual reviews to the daily queue and upcoming calendar without changing memory or automatic due dates. Keep the usual weekly average and this week's catch-up target in one plan summary.

**Tech Stack:** React, TypeScript, Node test runner, Playwright.

**Spec:** The user's request on 2026-11-11. The user asked to remove the redundant daily summary and pause/skip copy, explain `1h 18m` versus `1h 33m`, add a review on a selected day, and remove duplicate top navigation.

## Global Constraints

- Preserve saved attempts, notes, morning marks, FSRS memory, and old backups.
- Keep automatic due reviews above the time budget. Manual reviews can exceed a temporary review count limit because the user adds them explicitly.
- Keep user notebook edits and untracked files out of commits.
- Run `npm run check` and browser tests. Push each commit. Open a reviewable pull request. Do not deploy.

## Review Focus

- An old backup without manual review IDs must still load and keep its queue.
- A manual review must survive a save and reload.
- A break day must not show a manual review in the queue.
- A manual review must not duplicate a due review or one already completed that day.
- A removed manual review must leave the automatic due date and FSRS card unchanged.

---

### Task 1: Manual review state and scheduling

**Files:** `src/types.ts`, `src/storage.ts`, `src/model.ts`, `src/scheduler.ts`, `tests/review-window.test.ts`.

**Interfaces:** Add `DayAdjustment.reviews?: string[]`. Add `addManualReview(state, day, id)` and `removeManualReview(state, day, id)`. Add `scheduledReviews(state, day)` for the calendar and queue.

- [ ] Add failing tests for add, remove, validation, due-review deduplication, completion, and break behavior.
- [ ] Run `npm test -- --test-name-pattern='manual review'` and confirm the expected failure.
- [ ] Implement the state mutation, validation, and queue integration.
- [ ] Run the focused tests and `npm run check`.
- [ ] Commit and push this unit.

### Task 2: Clear copy and navigation

**Files:** `src/TodayControls.tsx`, `src/TodayView.tsx`, `src/PlanSummary.tsx`, `src/App.tsx`, `src/styles.css`, `tests/browser/compact-layout.spec.ts`, `tests/browser/review-window.spec.ts`.

**Interfaces:** Keep `PlanSummary` as the single summary of usual weekly time, this week's remaining time, and today's catch-up target. Keep the `Adjust time` form and side bar navigation.

- [ ] Add browser assertions for one summary, the catch-up explanation, absent pause/skip copy, and absent duplicate top navigation.
- [ ] Run the focused browser tests and confirm the expected failure.
- [ ] Update the UI and documentation.
- [ ] Run focused browser tests and `npm run check`.
- [ ] Commit and push this unit.

### Task 3: Add reviews from the upcoming calendar

**Files:** `src/TodayView.tsx`, `src/styles.css`, `tests/browser/review-window.spec.ts`, `README.md`, `docs/architecture.md`.

**Interfaces:** Selecting an upcoming day opens its detail. A control selects one practiced active problem and adds it to that day. The detail offers Remove for manual reviews.

- [ ] Add a browser test for add, saved account state, reload, and remove.
- [ ] Run the focused browser test and confirm the expected failure.
- [ ] Implement the selected-day controls and calendar count.
- [ ] Run focused browser tests, `npm run check`, and the full browser suite.
- [ ] Review the diff for user data and unintended files. Commit and push.
- [ ] Open a pull request for the topic branch.
