import { test, expect, navigate } from "./fixtures";
import { addDays } from "../../src/scheduler";

for (const width of [1440, 390]) {
  test(`finish date and study time are separate saved planning modes (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.request.post("/api/grind/register", {
      data: {
        email: `finish-${crypto.randomUUID()}@example.com`,
        password: "test-password-123",
      },
    });
    expect(response.status()).toBe(201);
    await page.goto("./");
    await page
      .getByRole("button", { name: "Continue with my first 10 completed" })
      .click();
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    const before = (await (await page.request.get("/api/grind/state")).json())
      .state;
    const finishDate = addDays(before.settings.startDate, 137);
    await navigate(page, "Settings");
    await page.getByLabel("Plan by").selectOption("deadline");
    await expect(page.getByLabel("Study time (hours/day)")).toHaveCount(0);
    await expect(page.getByLabel("Plan length (weeks)")).toHaveCount(0);
    await page.getByLabel("Finish date", { exact: true }).fill("");
    await expect(page.getByLabel("Finish date", { exact: true })).toHaveValue(
      "",
    );
    await page
      .getByRole("button", { name: "Save settings", exact: true })
      .click();
    expect(
      (await (await page.request.get("/api/grind/state")).json()).state
        .settings,
    ).toEqual(before.settings);
    await page.getByLabel("Start date").fill("");
    await expect(
      page.getByRole("heading", { name: "Your study plan" }),
    ).toBeVisible();
    await page.getByLabel("Start date").fill(before.settings.startDate);
    await page
      .getByLabel("Finish date", { exact: true })
      .fill(addDays(before.settings.startDate, -1));
    await page
      .getByRole("button", { name: "Save settings", exact: true })
      .click();
    expect(
      (await (await page.request.get("/api/grind/state")).json()).state
        .settings,
    ).toEqual(before.settings);
    await page.getByLabel("Finish date", { exact: true }).fill(finishDate);
    await expect(page.getByLabel("Plan estimate")).toContainText(
      "hours/week to finish by",
    );
    await page
      .getByRole("button", { name: "Save settings", exact: true })
      .click();
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await page.reload();
    await navigate(page, "Settings");
    await expect(page.getByLabel("Finish date", { exact: true })).toHaveValue(
      finishDate,
    );
    let saved = (await (await page.request.get("/api/grind/state")).json())
      .state;
    expect(saved.settings.finishDate).toBe(finishDate);
    expect(saved.settings.weeks).toBe(20);
    expect(saved.progress).toEqual(before.progress);
    expect(saved.history).toEqual(before.history);
    await page
      .getByLabel("Start date")
      .fill(addDays(before.settings.startDate, -2));
    await page
      .getByRole("button", { name: "Save settings", exact: true })
      .click();
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await page.reload();
    await navigate(page, "Settings");
    await expect(page.getByLabel("Finish date", { exact: true })).toHaveValue(
      finishDate,
    );
    await page.getByLabel("Plan by").selectOption("time");
    await expect(page.getByLabel("Finish date", { exact: true })).toHaveCount(
      0,
    );
    await page.getByLabel("Study time (hours/day)").fill("2");
    await page
      .getByRole("button", { name: "Save settings", exact: true })
      .click();
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await page.reload();
    await navigate(page, "Settings");
    await expect(page.getByLabel("Study time (hours/day)")).toHaveValue("2");
    saved = (await (await page.request.get("/api/grind/state")).json()).state;
    expect(saved.settings.planMode).toBe("time");
    expect(saved.settings.hours).toBe(14);
    expect(saved.settings.finishDate).toBeUndefined();
    expect(saved.progress).toEqual(before.progress);
    expect(saved.history).toEqual(before.history);
    expect(errors).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
