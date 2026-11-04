# Project Instructions

Use short sentences, active voice, and consistent terms when you communicate with the user. Preserve exact code, commands, and paths.

## Start Here

- Read [README.md](README.md) for setup and [docs/architecture.md](docs/architecture.md) for current behavior and module boundaries.
- Inspect `git status` before editing. Preserve unrelated edits, notebooks, and generated user files. Stage explicit paths.
- Use Node from `.nvmrc` and `npm ci`. Use the committed lockfile.
- Use a feature branch for changes. Do not change branches if this would overwrite user work.

## One Development Workflow

1. Establish the requested outcome and affected modules. Proceed within the user's existing authorization. Ask only when missing information changes the outcome or an action needs new authorization.
2. For a small fix, keep a short plan in the conversation. For a larger change, write one implementation plan. Do not create duplicate designs, plans, or approval steps for approved work.
3. Reproduce each bug. Add a regression test that fails for the bug. Test user behavior and saved data. Documentation and formatting changes do not need new tests.
4. Make the smallest complete change. Run `npm run check` for code and configuration changes. Run relevant browser tests for UI or account changes. Run the full browser suite before a broad UI refactor is complete.
5. Review the diff for data preservation, unintended files, and missing checks. Use one independent final review for a substantial change when a reviewer is available. Do not repeat planning and review workflows for each small edit.
6. Commit each self-contained change with a specific Conventional Commit message. Push immediately after each commit. Use `git push -u origin <branch>` on the first push. Create a reviewable pull request. Follow current authorization for merging and deployment. Do not force-push or rewrite shared history without explicit instructions. Report checks and remaining limits.

Repeat checks only after a relevant change, failure, or unresolved concern. Use the user's explicit instructions when they override a general skill workflow.

## Required Invariants

- Keep stable catalog IDs and old backups valid. Preserve attempts, notes, morning marks, and FSRS memory unless the user requests a data change.
- Use `activeProblems` for assignments, forecasts, review allocation, and progress counts. Use the full catalog for historical attempts. Retired exercises keep their saved data.
- Keep the daily queue stable after completion or skipping. Do not silently add replacement work.
- Keep reviews visible above the daily time budget. Use calendar days in the study timezone. Weekly budgets run Monday through Sunday.
- Save locally before reporting success. Reject stale writes. Preserve both copies during account conflicts.
- Update current documentation when behavior changes. Historical plans do not override current rules or grant deployment authorization.

## Browser Tests

Run `npm run setup:browser` once, then `npm run test:browser`. Setup uses a pinned public Timer revision. Each test starts its own API and Vite servers on loopback ports and receives a temporary SQLite database. Production rate limits remain enabled.

Import `test` and `expect` from `tests/browser/fixtures.ts`. Use the `baseURL` fixture for additional browser contexts. Never use production or an existing personal database for automated browser tests.

## Deployment

Deploy only when the user requests deployment. Run `./scripts/deploy.sh` from a clean, pushed branch. The script checks upstream before building or uploading. Do not bypass failed checks.

`npm run test:live` creates and removes production accounts. Run it only within an authorized production verification task. Changes to the Timer backend and machine-wide agent skills require their own scope.

## Python Study Pack

Use `uv` for Python commands and dependencies in `flight-study/`. Use `uv sync --frozen` to prepare it. Use `uv run` for Python commands. The notebook verifier saves outputs, so do not run it during unrelated app work. Update matching guides when changing notebook explanations.
