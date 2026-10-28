import { test, expect } from "@playwright/test";

test("Bank follows deadline weeks, preserves every problem and updates practice labels", async ({
  page,
}) => {
  const response = await page.request.post("/api/grind/register", {
    data: {
      email: `bank-${crypto.randomUUID()}@example.com`,
      password: "test-password-123",
    },
  });
  expect(response.status()).toBe(201);
  await page.goto("./");
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .click();
  const readProgress = () =>
    page.evaluate(() => {
      const key = Object.keys(localStorage).find((k) =>
        /^grind-recall:account:[^:]+$/.test(k),
      )!;
      const saved = JSON.parse(localStorage.getItem(key)!).state;
      return { progress: saved.progress, history: saved.history };
    });
  const before = await readProgress();
  for (const weeks of [16, 8, 20]) {
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByLabel("Plan by").selectOption("deadline");
    await page.getByLabel("Plan length (weeks)").fill(String(weeks));
    await page
      .getByRole("button", { name: "Save settings", exact: true })
      .click();
    await page
      .getByRole("button", { name: "All problems", exact: true })
      .click();
    await expect(page.locator(".week-group")).toHaveCount(weeks);
    await expect(
      page.locator(".week-group").last().locator("summary"),
    ).toContainText(`Week ${weeks}`);
    await expect(page.locator(".week-group .problem-row")).toHaveCount(169);
    const house = page
      .locator(".week-group")
      .filter({ hasText: "House Robber" });
    const week = (await house.locator("summary").innerText()).match(
      /Week (\d+)/,
    )![1];
    await page.getByLabel("Search problems").fill("House Robber");
    await expect(page.locator(".week-group summary")).toContainText(
      `Week ${week}`,
    );
    await page.getByRole("button", { name: /House Robber/ }).click();
    await expect(page.locator(".session-dialog .meta")).toContainText(
      `Plan week ${week}`,
    );
    await page.getByRole("button", { name: "Close practice" }).click();
    await page.getByLabel("Search problems").fill("");
    await expect(page.locator(".week-group .problem-row")).toHaveCount(169);
  }
  await page.reload();
  await page.getByRole("button", { name: "All problems", exact: true }).click();
  await expect(page.locator(".week-group")).toHaveCount(20);
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Plan by").selectOption("time");
  await page.getByLabel("Study time (hours/day)").fill("2");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  const estimatedWeeks = Number(
    (await page.locator(".sidebar-plan .small-heading").innerText()).match(
      /(\d+)-week/,
    )![1],
  );
  await page.getByRole("button", { name: "All problems", exact: true }).click();
  await expect(page.locator(".week-group")).toHaveCount(estimatedWeeks);
  await expect(page.locator(".week-group .problem-row")).toHaveCount(169);
  expect(await readProgress()).toEqual(before);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/grind-order-review/bank-mobile.png",
    fullPage: true,
  });
});
