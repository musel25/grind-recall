import { test, expect } from "@playwright/test";
test("complete daily work, preserve it on reload, undo and backup round trip", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your practice, today." }),
  ).toBeVisible();
  await expect(page.locator(".sidebar-plan")).toContainText("10 of 169");
  const count = await page.locator(".problem-row").count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await page
      .getByRole("button", { name: "Start practice", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("button", { name: "I've finished my attempt" })
      .click();
    await page
      .getByLabel("What should you remember?")
      .fill("Check empty inputs");
    await page
      .getByRole("button", { name: /^Good Solved independently/ })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "All set for today." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "All set for today." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo last attempt" }).click();
  await expect(
    page.getByRole("button", { name: "Start practice", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  const file = await download;
  const path = await file.path();
  expect(path).toBeTruthy();
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file").setInputFiles(path!);
  await expect(
    page.locator(".toast").filter({ hasText: "Backup imported." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("search and rate an existing problem on mobile without overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .click();
  await page.getByRole("button", { name: "All problems", exact: true }).click();
  await page.getByRole("textbox", { name: "Search problems" }).fill("Two Sum");
  await expect(page.locator(".problem-row")).toHaveCount(1);
  await page.locator(".problem-row").click();
  await page.getByRole("button", { name: "I've finished my attempt" }).click();
  await page.getByRole("button", { name: /^Again Needed help/ }).click();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("grind-recall:v1")!),
  );
  expect(state.history).toHaveLength(1);
  expect(state.history[0].rating).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/grind-mobile.png", fullPage: true });
});

test("imported settings appear immediately and saving cannot restore stale settings", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  const backup = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("grind-recall:v1")!);
    state.settings.weeks = 20;
    state.settings.hours = 25;
    state.settings.timezone = "UTC";
    return JSON.stringify(state);
  });
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });
  await expect(page.getByLabel("Plan length (weeks)")).toHaveValue("20");
  await expect(page.getByLabel("Time available (hours/week)")).toHaveValue(
    "25",
  );
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("grind-recall:v1")!).settings.weeks,
    ),
  ).toBe(20);
});

test("one-click extras, day/week controls and visible breaks persist", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .click();
  const baseline = await page.locator(".problem-row").count();
  await page
    .getByRole("button", { name: "Add one more problem", exact: true })
    .click();
  await expect(page.locator(".problem-row")).toHaveCount(baseline + 1);
  await page.reload();
  await expect(page.locator(".problem-row")).toHaveCount(baseline + 1);
  await page.getByText("Adjust time", { exact: true }).click();
  await page.getByLabel("Today's time (minutes)").fill("180");
  await page.getByLabel("This week's goal (hours)").fill("20");
  await page.getByRole("button", { name: "Update this plan" }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("grind-recall:v1")!),
  );
  expect(saved.settings.hours).toBe(10);
  expect(Object.values(saved.planning.weeks)).toContain(20);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Break starts").fill("2026-10-08");
  await page.getByLabel("Break ends").fill("2026-10-11");
  await page.getByRole("button", { name: "Save study break" }).click();
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await expect(page.locator(".break-banner")).toContainText("Oct 8");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
