import { test, expect } from "./fixtures";
import { activeProblems, problems } from "../../src/catalog";
import { initialState, recordAttempt } from "../../src/model";
import { addDays } from "../../src/scheduler";

for (const width of [1280, 390]) {
  test(`retired review backups preserve history and show active progress (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const registration = await page.request.post("/api/grind/register", {
      data: {
        email: `retired-${crypto.randomUUID()}@example.com`,
        password: "test-password-123",
      },
    });
    expect(registration.status()).toBe(201);
    const day = new Date().toISOString().slice(0, 10);
    let state = initialState(addDays(day, -1));
    state.settings.timezone = "UTC";
    for (const p of activeProblems(state))
      state.progress[p.id] = {
        due: "2099-01-01",
        card: null,
        imported: true,
        independent: true,
        note: "Keep",
      };
    const retired = problems.filter((p) => p.retired);
    state = recordAttempt(
      state,
      retired[0].id,
      3,
      addDays(day, -1),
      15,
      "Retired note",
    );
    state = recordAttempt(state, retired[0].id, 3, day, 20, "Retired note");
    for (const p of retired.slice(1))
      state.progress[p.id] = {
        due: "2099-01-01",
        card: null,
        imported: true,
        independent: true,
        note: "Keep",
      };

    await page.goto("./");
    await page.getByRole("button", { name: "Start from problem one" }).click();
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByLabel("Import backup file").setInputFiles({
      name: "retired.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(state)),
    });
    await expect(page.locator(".toast")).toContainText("Backup imported.");
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await page.reload();
    await expect(page.locator(".sidebar-plan")).toContainText(
      "100 of 100 practiced",
    );
    await expect(page.locator(".sidebar-plan")).toContainText("100%");
    await expect(page.locator(".sidebar-plan")).toContainText(
      "100 solved independently",
    );
    await expect(
      page.getByRole("region", { name: "Today's summary" }),
    ).toContainText("20m practiced today");
    const remote = await (await page.request.get("/api/grind/state")).json();
    expect(remote.state.history).toEqual(state.history);
    expect(remote.state.progress).toEqual(state.progress);
    await page.locator(".completed-list summary").click();
    await page.locator(".completed-list button").click();
    await expect(page.getByRole("dialog")).toContainText("Retired note");
    await page.getByRole("button", { name: "Close practice" }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}
