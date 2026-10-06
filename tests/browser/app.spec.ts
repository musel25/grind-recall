import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
    route.abort(),
  );
  const res = await page.request.post("/api/grind/register", {
    data: {
      email: "browser-" + crypto.randomUUID() + "@example.com",
      password: "test-password-123",
    },
  });
  expect(res.status()).toBe(201);
});
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
    await page.getByRole("button", { name: "Rate my attempt" }).click();
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
  await page.getByRole("button", { name: "Rate my attempt" }).click();
  await page.getByRole("button", { name: /^Again Needed help/ }).click();
  const state = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem(
          Object.keys(localStorage).find((k) =>
            /^grind-recall:account:[^:]+$/.test(k),
          )!,
        )!,
      ).state,
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
    const state = JSON.parse(
      localStorage.getItem(
        Object.keys(localStorage).find((k) =>
          /^grind-recall:account:[^:]+$/.test(k),
        )!,
      )!,
    ).state;
    state.settings.weeks = 20;
    state.settings.planMode = "deadline";
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
  await expect(page.getByLabel("Plan by")).toHaveValue("deadline");
  await expect(page.getByLabel("Plan estimate")).toContainText("20 weeks");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem(
            Object.keys(localStorage).find((k) =>
              /^grind-recall:account:[^:]+$/.test(k),
            )!,
          )!,
        ).state.settings.weeks,
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
  const saved = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem(
          Object.keys(localStorage).find((k) =>
            /^grind-recall:account:[^:]+$/.test(k),
          )!,
        )!,
      ).state,
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

test("plan by time or deadline; preserve pause and ratings survive reload", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Study time (hours/day)").fill("2");
  await expect(page.getByLabel("Plan estimate")).toContainText(
    "14.0 hours/week",
  );
  await page.getByLabel("Break starts").fill("2026-10-08");
  await page.getByLabel("Break ends").fill("2026-10-12");
  await page
    .getByRole("button", { name: "Save study break", exact: true })
    .click();
  // Restore the time draft after the independent break settings save.
  await page.getByLabel("Study time (hours/day)").fill("2");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Study time (hours/day)")).toHaveValue("2");
  await page.getByLabel("Plan by").selectOption("deadline");
  await page.getByLabel("Plan length (weeks)").fill("20");
  await expect(page.getByLabel("Plan estimate")).toContainText("20 weeks");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  const saved = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem(
          Object.keys(localStorage).find((k) =>
            /^grind-recall:account:[^:]+$/.test(k),
          )!,
        )!,
      ).state,
  );
  expect(saved.settings.planMode).toBe("deadline");
  expect(saved.settings.weeks).toBe(20);
  expect(saved.settings.hours).toBeGreaterThan(10);
  expect(saved.planning.breaks).toHaveLength(5);
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rate my attempt", exact: true })
    .click();
  const easy = page.getByRole("button", {
    name: /^Easy Solved with confidence/,
  });
  const hard = page.getByRole("button", {
    name: /^Hard Solved, with difficulty/,
  });
  expect(await easy.locator("small").innerText()).not.toBe(
    await hard.locator("small").innerText(),
  );
  await easy.click();
  await page.reload();
  const result = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem(
          Object.keys(localStorage).find((k) =>
            /^grind-recall:account:[^:]+$/.test(k),
          )!,
        )!,
      ).state,
  );
  expect(result.history.at(-1).rating).toBe(4);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/grind-plan-mobile.png", fullPage: true });
});

test("completed lists preserve review budget and allow saving settings after deadline", async ({
  page,
}) => {
  const { default: problems } = await import("../../src/problems.json", {
    with: { type: "json" },
  });
  await page.goto("./");
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .click();
  await expect(page.locator('.account-bar [role="status"]')).toHaveText(
    "Saved to your account",
  );
  await page.evaluate(
    (ids) => {
      const s = JSON.parse(
        localStorage.getItem(
          Object.keys(localStorage).find((k) =>
            /^grind-recall:account:[^:]+$/.test(k),
          )!,
        )!,
      ).state;
      s.settings.planMode = "deadline";
      s.settings.startDate = "2020-01-01";
      s.settings.weeks = 1;
      for (const id of ids)
        s.progress[id] = {
          due: "2026-10-05",
          card: null,
          imported: true,
          note: "",
          independent: false,
        };
      const key = Object.keys(localStorage).find((k) =>
        /^grind-recall:account:[^:]+$/.test(k),
      )!;
      const envelope = JSON.parse(localStorage.getItem(key)!);
      localStorage.setItem(
        key,
        JSON.stringify({
          ...envelope,
          state: s,
          pending: true,
          mutationId: crypto.randomUUID(),
        }),
      );
    },
    problems.map((p) => p.id),
  );
  await page.reload();
  await expect(page.getByLabel("Plan estimate")).toContainText(
    "All 169 problems practiced",
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Estimated review duration").selectOption("0.5");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  const result = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem(
          Object.keys(localStorage).find((k) =>
            /^grind-recall:account:[^:]+$/.test(k),
          )!,
        )!,
      ).state,
  );
  expect(result.settings.hours).toBe(10);
  expect(result.settings.reviewMultiplier).toBe(0.5);
});

test("morning study survives reload, stays unrated, and evening rating completes it", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .click();
  const before = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem(
          Object.keys(localStorage).find((k) =>
            /^grind-recall:account:[^:]+$/.test(k),
          )!,
        )!,
      ).state,
  );
  await page
    .getByRole("button", {
      name: "Studied Balanced Binary Tree this morning",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", { name: "Practice tonight" }),
  ).toContainText("Balanced Binary Tree");
  await page.reload();
  const marked = await page.evaluate(
    () =>
      JSON.parse(
        localStorage.getItem(
          Object.keys(localStorage).find((k) =>
            /^grind-recall:account:[^:]+$/.test(k),
          )!,
        )!,
      ).state,
  );
  expect(marked.progress).toEqual(before.progress);
  expect(marked.history).toEqual(before.history);
  // Reload first checks the account asynchronously; wait for the restored UI.
  await expect(
    page.locator(".problem-row").filter({ hasText: "Balanced Binary Tree" }),
  ).toHaveCount(1);
  await page
    .getByRole("region", { name: "Practice tonight" })
    .locator(".problem-row")
    .click();
  await expect(
    page.getByRole("button", { name: "Undo morning mark", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Rate my attempt", exact: true })
    .click();
  await page
    .getByRole("button", { name: /^Good Solved independently/ })
    .click();
  await expect(
    page.getByRole("region", { name: "Practice tonight" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Undo last attempt" }).click();
  await expect(
    page.getByRole("region", { name: "Practice tonight" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/grind-morning-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Undo morning mark for Balanced Binary Tree" })
    .click();
  await expect(
    page.getByRole("region", { name: "Practice tonight" }),
  ).toHaveCount(0);
});
