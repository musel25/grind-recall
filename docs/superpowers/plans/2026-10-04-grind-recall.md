# Grind Recall Implementation Plan

Goal: ship a useful daily study planner with all 169 problems and honest review scheduling.
Architecture: static React UI; pure typed schedule/state functions; FSRS dependency; browser persistence; VPS nginx static hosting.
Spec: ../specs/2026-10-04-grind-recall-design.md
Execution: inline, authorized by user's build/deploy request.

## Tasks
- [x] Data and scheduling: add source dataset; node/tsx tests for 169 unique problems, totals, review outcomes, calendar dates, stable new quota, deadline, and optimistic forecast. Implement src/model.ts and src/scheduler.ts. Run npm test and npm run simulate. Commit and push.
- [x] State: add validation, versioned local persistence, attempt history and undo. Test malformed imports, prototype keys, duplicates, round-trip, and undo. Commit and push.
- [x] Interface: build src/App.tsx, reusable problem/session components and styles. Today queue, week list/search/filter, editable settings, notes, date previews, import/export, accessible dialogs. Exercise real browser flows and mobile layout. npm run build. Commit and push.
- [x] Deploy: release script and nginx location; build and stage immutable release, test nginx, switch static symlink, verify HTTPS and pre-existing service. Commit/push release instructions. Fresh reviewer checks scheduling/state/UI boundary; address important findings and reverify.

## Review focus
- DST and a session across midnight must use calendar dates, not elapsed 24-hour offsets.
- Finishing a daily assignment must not refill the list; early extra practice is explicit.
- Storage failures must not silently discard progress; malformed imports cannot replace it.
- Missed days and a passed deadline must never divide by zero or discard due reviews.
- Repeated clicks and multiple tabs must not duplicate ratings or overwrite newer work silently.

## Verification record

10 scheduler/state tests, 3 local browser flows, production desktop/mobile checks and returning-Planner-user live smoke test passed. Independent review found stale settings after backup import; regression reproduced and fixed. Deployment discovered Planner root service worker intercepted /grind/: added a precise exclusion in timer/client/vite.config.ts, ran 266 client tests, and deployed through timer/deploy.sh. Timer remains healthy. All changes committed and pushed.
