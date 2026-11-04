import { test, expect } from "./fixtures";
import { activeProblems, problems } from "../../src/catalog";
import {
  initialState,
  markMorningStudy,
  recordAttempt,
  setDayMinutes,
} from "../../src/model";
import { addDays } from "../../src/scheduler";

for (const width of [1440, 390]) {
  test(`AI exercises use the problem bank, reviews, morning study, and saved ratings (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    const response = await page.request.post("/api/grind/register", {
      data: {
        email: `ai-${crypto.randomUUID()}@example.com`,
        password: "test-password-123",
      },
    });
    expect(response.status()).toBe(201);
    const day = new Date().toISOString().slice(0, 10);
    const ai = activeProblems().filter((p) => p.course === "applied-ai-nine");
    expect(ai).toHaveLength(9);
    const archived = problems.find((p) => p.retired)!;
    let state = initialState(addDays(day, -1));
    state.settings.timezone = "UTC";
    state = recordAttempt(
      state,
      archived.id,
      3,
      addDays(day, -1),
      15,
      "Preserve archived work",
    );
    state = recordAttempt(
      state,
      ai[0].id,
      1,
      addDays(day, -1),
      20,
      "Review AI note",
    );
    state = markMorningStudy(state, ai[1].id, day, true);
    state = setDayMinutes(state, day, 0);
    await page.goto("./");
    await page.getByRole("button", { name: "Start from problem one" }).click();
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByLabel("Import backup file").setInputFiles({
      name: "ai-and-archive.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(state)),
    });
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Python courses", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.locator("button.problem-row").filter({ hasText: ai[0].title }),
    ).toBeVisible();
    await expect(
      page.locator("button.problem-row").filter({ hasText: ai[1].title }),
    ).toBeVisible();
    await expect(
      page.locator("button.problem-row").filter({ hasText: archived.title }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "All problems", exact: true })
      .click();
    await expect(page.locator(".week-group .problem-row")).toHaveCount(84);
    for (const p of ai) {
      await page.getByLabel("Search problems").fill(p.title);
      await page.getByRole("button", { name: new RegExp(p.title) }).click();
      await expect(
        page.getByRole("link", { name: "Open on Cojudge" }),
      ).toHaveAttribute("href", p.url);
      await page.getByRole("button", { name: "Close practice" }).click();
    }
    await page.getByLabel("Search problems").fill(ai[1].title);
    await page.getByRole("button", { name: new RegExp(ai[1].title) }).click();
    await page.getByRole("button", { name: "Rate my attempt" }).click();
    await expect(page.getByLabel("Time spent (minutes)")).toHaveValue(
      String(ai[1].minutes * 2),
    );
    for (const label of ["Again", "Hard", "Good", "Easy"])
      await expect(
        page.getByRole("button", { name: new RegExp(`^${label} `) }),
      ).toBeVisible();
    await page.getByLabel("What should you remember?").fill("Keep AI note");
    await page
      .getByRole("button", { name: /^Good Solved independently/ })
      .click();
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await page.reload();
    const saved = (await (await page.request.get("/api/grind/state")).json())
      .state;
    expect(saved.progress[ai[1].id].note).toBe("Keep AI note");
    expect(saved.progress[ai[1].id].card.reps).toBe(1);
    expect(saved.history.at(-1).rating).toBe(3);
    expect(saved.progress[archived.id]).toEqual(state.progress[archived.id]);
    expect(saved.progress[ai[0].id]).toEqual(state.progress[ai[0].id]);
    await page.getByRole("button", { name: "Undo last attempt" }).click();
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    const undone = (await (await page.request.get("/api/grind/state")).json())
      .state;
    expect(undone.progress).toEqual(state.progress);
    expect(undone.history).toEqual(state.history);
    expect(undone.morningStudy).toEqual(state.morningStudy);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
