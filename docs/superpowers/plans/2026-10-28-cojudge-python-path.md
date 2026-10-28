# Cojudge Python Path Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan in this session.

**Goal:** Include the local OOP, Pytest, Data Formats, Collections, and Decorators and Context Managers exercises in Grind with direct Cojudge links and one completion per exercise.

**Architecture:** Import a static course catalog from the local Cojudge content. Extend the existing progress and attempt model to support completion without a rating or FSRS card. Alternate new algorithm and Python exercises within the existing daily budget, after due algorithm reviews. Use the same rules in forecasts, backups, undo, skips, and account sync.

**Tech Stack:** Existing React, TypeScript, Vite, Node test runner, and Playwright.

**Spec:** The approved description in the conversation: the five courses follow the image order; each exercise opens on Cojudge; mark completion without repeat reviews. The user confirmed that Decorators and Context Managers is ready; include its 12 exercises after Collections. The user controls course deployment.

## Global Constraints

- Preserve all existing algorithm progress, review dates, notes, and archived extras.
- Read course content from `capital-one-prep/cojudge`; change only Grind.
- Use the Pybites OOP course, followed by Pytest, Data Formats, Collections, and Decorators and Context Managers.
- Estimate solve minutes as 15/30/45 for Easy/Medium/Hard; allow twice that for first study, as in Grind.
- Keep original course IDs and exercise IDs. Link to `https://cojudge.musel.dev/problems/<id>`.
- Preserve the user's modified notebook in the main checkout.

## Review Focus

- Old backups remain valid without changes to saved values.
- One-time completions never enter review lists, balancing, or study-break redistribution.
- Completing or skipping an item does not refill today's original queue.
- Forecasts use completion without FSRS and preserve their input state.
- Completion, undo, notes, backups, and cloud sync agree on nullable ratings.

### Task 1: Add the Python path as one complete feature

**Files:** `scripts/import-cojudge.mjs`, `src/cojudge-courses.json`, `src/catalog.ts`, `src/types.ts`, `src/model.ts`, `src/scheduler.ts`, `src/planning.ts`, `src/storage.ts`, `src/Session.tsx`, `src/App.tsx`, `tests/cojudge.test.ts`, `tests/browser/cojudge.spec.ts`, and the README.

**Interfaces:** Existing `recordAttempt` accepts a null rating for one-time exercises and stores no rating or FSRS card. `Problem` gains optional `course` and `review` metadata. `cojudgeCourses` exports the ordered course catalog. `activeProblems` includes those exercises.

- [x] Add tests for course order and links, completion without reviews, undo, duplicate completion, old backups, shared scheduling, skips, breaks, and forecasts.
- [x] Run the tests and confirm failures from missing support.
- [x] Implement catalog import and one-time progress throughout the model and planner.
- [x] Add the Cojudge completion dialog and a course view in the bank. Keep the algorithm rating dialog.
- [x] Add a browser check for Cojudge links, completion, reload, and undo.
- [x] Run `npm test`, `npm run build`, and relevant browser tests. Review the complete diff.
- [x] Commit the feature with a specific Conventional Commit message. Push the branch immediately.

Validation: 79 unit tests and 19 browser tests pass. The production build passes. Browser checks use a disposable local Timer API and SQLite database. Desktop and mobile screenshots show the course view without horizontal overflow. A separate code review found no issues. The generated catalog matches the local course order and metadata for all 72 exercises.
