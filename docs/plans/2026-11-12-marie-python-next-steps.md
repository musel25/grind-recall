# Python Next Steps in Grind Recall

## Outcome

Give Marie a new Grind Recall account whose active plan contains the 40 Python Next Steps problems on Cojudge. Keep each existing account's Grind 75 plan and saved data intact. The course links open the matching Cojudge problem. Practice, reviews, forecasts, and progress counts use the selected plan.

## Implementation

1. Add the 40 stable Cojudge IDs, titles, links, order, and time estimates as a separate catalog file. Keep the existing Cojudge importer from changing this course.
2. Store an optional plan identifier in the study settings. Missing identifiers mean Grind 75, so old backups and accounts retain their behavior. Validate the identifier in local and cloud saves.
3. Make the new plan use only the 40 course problems for assignments, reviews, forecasts, and progress. Keep other problems and attempts in the full catalog for history.
4. Let a new account choose Python Next Steps during first setup. Make the welcome and problem bank describe the selected plan accurately.
5. Add unit and browser tests for the chosen plan, save and reload, Cojudge links, and unchanged Grind 75 defaults. Update current documentation.
6. Run `npm run check` and the relevant browser tests. Review the diff, commit, push, create a pull request, and run the full browser suite before publishing.
7. Deploy the pushed branch with `./scripts/deploy.sh`. Create Marie's account with her supplied email and a new password. Save the Python Next Steps state to that account. Check the live account and its 40 problem plan without changing other accounts.

## Data rules

- Preserve old catalog IDs, attempts, notes, morning marks, and FSRS cards.
- Keep the daily queue stable after completion or skipping.
- Do not copy Cojudge progress into Grind Recall. The two apps keep separate progress.
- Do not put credentials in the repository or deployment notes.
