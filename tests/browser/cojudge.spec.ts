import { test, expect, navigate } from "./fixtures";
import { problems } from "../../src/catalog";
import { initialState, markMorningStudy, recordAttempt } from "../../src/model";
import { addDays } from "../../src/scheduler";

for (const width of [1440, 390]) {
  test(`Python courses stay archived after importing practiced and pending work (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.request.post("/api/grind/register", {
      data: {
        email: `archived-python-${crypto.randomUUID()}@example.com`,
        password: "test-password-123",
      },
    });
    expect(response.status()).toBe(201);
    const day = new Date().toISOString().slice(0, 10);
    const python = problems.filter((p) => p.course?.startsWith("pybites-"));
    const extra = problems.find((p) => !p.core && !p.course)!;
    let state = initialState(addDays(day, -1), true);
    state.settings.timezone = "UTC";
    state = recordAttempt(
      state,
      python[0].id,
      3,
      addDays(day, -1),
      15,
      "Keep Python note",
    );
    state = recordAttempt(
      state,
      extra.id,
      3,
      addDays(day, -1),
      30,
      "Keep LeetCode note",
    );
    state = markMorningStudy(state, python[1].id, day, true);
    state.progress[python[2].id] = {
      due: day,
      card: null,
      imported: false,
      independent: false,
      note: "Legacy note",
    };
    state.history.push({
      id: "legacy-completion",
      problemId: python[2].id,
      day: addDays(day, -1),
      rating: null,
      minutes: 25,
      wasNew: true,
      previous: null,
    });

    await page.goto("./");
    await page.getByRole("button", { name: "Start from problem one" }).click();
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await navigate(page, "Settings");
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByLabel("Import backup file").setInputFiles({
      name: "practiced-python.json",
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
    await expect(page.locator(".sidebar-plan")).toContainText(
      "11 of 76 practiced",
    );
    for (const p of python.slice(0, 3))
      await expect(
        page.locator(".problem-row").filter({ hasText: p.title }),
      ).toHaveCount(0);

    await navigate(page, "All problems");
    await expect(page.locator(".week-group .problem-row")).toHaveCount(76);
    await page.getByLabel("Search problems").fill(extra.title);
    await expect(
      page.getByRole("button", { name: new RegExp(extra.title) }),
    ).toHaveCount(1);
    await page.getByLabel("Search problems").fill("");
    await page.getByLabel("Problem collection").selectOption("Archive");
    for (const p of python)
      await expect(page.locator(`a[href="${p.url}"]`)).toHaveCount(1);
    await expect(page.locator(`a[href="${python[0].url}"]`)).toContainText(
      "Archived · Open on Cojudge",
    );
    const remote = (await (await page.request.get("/api/grind/state")).json())
      .state;
    expect(remote.progress).toEqual(state.progress);
    expect(remote.history).toEqual(state.history);
    expect(remote.morningStudy).toEqual(state.morningStudy);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}
