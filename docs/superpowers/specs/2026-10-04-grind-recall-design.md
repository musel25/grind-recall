# Grind Recall

User intent: finish the supplied 169 problems in 15 weeks and retain them through daily spaced practice. User explicitly requested implementation and VPS deployment after reviewing the initial in-chat design. Proceed within that authorization.

## Experience
Quiet blue/white application with a narrow persistent sidebar, spacious task rows, and one prominent daily session. Today, Problems, Settings. Desktop sidebar becomes compact mobile navigation. Palette: canvas #f6f8fc, white #ffffff, ink #19273b, blue #375dcc, muted #68778b, green #26745a. System sans typography. Progress uses a 15-week strip and meaningful counts, without decorative charts. Preserve original weekly grouping and ordering; daily assignments use estimated minutes so the difficult final weeks do not become overloaded.

## Scheduling
169 curated titles, exact links/difficulties/minutes from the supplied Grind view. Preserve its difficulty classifications even if LeetCode changes them. First 10 are imported as previously practiced, without invented historical ratings or dates. Their first baseline reviews are spread over the next five days, two per day.

Default start today, 15 weeks = 105 calendar days, inclusive deadline start+104. Daily new-work quota = remaining first-pass minutes / remaining calendar days, rounded by whole problems while preserving order. The quota is fixed within a day by including today's new completions in its calculation; after reaching it, do not endlessly refill. Missed days automatically increase remaining pace. Before start show no work; after deadline continue with explicit overdue target. Reviews remain due until done, only one pending per problem, and continue after deadline.

Use ts-fsrs with retention .9, no fuzz, no short-term steps. All attempts use actual date in the chosen timezone. Adaptation: new problems and Again are due tomorrow; FSRS determines subsequent Hard/Good/Easy dates. Preserve difficulty/stability on lapses rather than resetting memory to zero. Show all four ratings with exact next dates. Never claim the default model guarantees coding-problem retention. A review means attempting a solution and explaining complexity without looking at notes. Again includes needing hints/solution; Hard is independent but difficult.

First-pass estimate = listed minutes * 2 (solve and study). Review estimate defaults to listed solve minutes, configurable multiplier. Workload projection simulates all future reviews with Good, explicitly an optimistic scenario. Capacity is hours/week; do not hide due work to claim the deadline fits. Show today's estimate and an overload notice. Budget and deadline remain distinct.

## Data
Browser-local versioned state: settings, problem FSRS cards, imported flags, notes, dated attempt history. Atomic localStorage write before UI success; report failures. Export/import JSON with bounded validation, explicit replacement confirmation and undo last attempt. No backend account or cross-device synchronization in v1; disclose in settings. New visitors start fresh; import user's 10 via setup option.

## Deployment and verification
New public GitHub repo before feature code. React/TypeScript/Vite, pinned lockfile. Build to /grind/ and serve in isolated nginx location on existing timer.musel.dev VPS HTTPS vhost. Keep existing timer routes untouched, backup configuration, nginx -t before reload, release directory symlink for rollback. Test scheduling boundaries, outcomes, duplicates, undo, imports, dates/DST, deadline recovery. Browser-check desktop/mobile, persistence, controls, backup round-trip. Check production HTTPS and existing timer health.
