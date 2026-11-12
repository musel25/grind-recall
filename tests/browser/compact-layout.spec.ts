import { test, expect } from "./fixtures";

test.beforeEach(async ({ page }) => {
  const response = await page.request.post("/api/grind/register", {
    data: {
      email: `compact-${crypto.randomUUID()}@example.com`,
      password: "test-password-123",
    },
  });
  expect(response.status()).toBe(201);
  await page.goto("./");
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .click();
});

for (const width of [1440, 390]) {
  test(`practice starts with compact navigation and visible progress (${width}px)`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(page.locator(".main .sidebar-plan")).toContainText(
      "10 of 75 practiced",
    );
    await expect(page.locator(".main .sidebar-plan")).toContainText(
      "solved independently",
    );
    await expect(page.getByText("Your daily practice space")).toHaveCount(0);
    await expect(page.getByText(/day on average\. Today's budget/)).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("region", { name: "Daily and weekly plan" }),
    ).not.toContainText("today's budget");
    await expect(
      page.getByRole("region", { name: "Daily and weekly plan" }),
    ).not.toContainText("Assigned today:");
    await expect(
      page.getByRole("region", { name: "Daily and weekly plan" }),
    ).not.toContainText("At most");
    await expect(
      page.getByRole("navigation", { name: "Practice navigation" }),
    ).toHaveCount(0);
    await expect(page.getByLabel("Plan estimate")).toContainText(
      "Today's target:",
    );
    await expect(page.getByLabel("Plan estimate")).not.toContainText(
      "This week:",
    );
    await expect(page.locator(".workload-note")).not.toContainText(
      "Today's list takes about",
    );
    await expect(
      page.getByRole("region", { name: "Daily and weekly plan" }),
    ).not.toContainText("/day on average");
    await expect(page.getByLabel("Plan estimate")).not.toContainText(
      "Includes new problems and spaced reviews",
    );
    await page.screenshot({
      path: testInfo.outputPath("compact-practice.png"),
      fullPage: true,
    });
    const menu = page.getByRole("button", { name: "Open navigation" });
    await menu.focus();
    await menu.click();
    await expect(page.getByRole("complementary")).toBeVisible();
    await expect(
      page.getByRole("complementary").getByRole("button", { name: "Today" }),
    ).toBeFocused();
    const sidebar = page.getByRole("complementary");
    const firstLink = sidebar.locator("a").first();
    const lastLink = sidebar.locator("a").last();
    await lastLink.focus();
    await page.keyboard.press("Tab");
    await expect(firstLink).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(lastLink).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(menu).toBeFocused();
    await menu.click();
    await page
      .getByRole("complementary")
      .getByRole("button", { name: "All problems" })
      .click();
    await expect(page.getByRole("complementary")).toHaveCount(0);
    await expect(
      page.getByRole("textbox", { name: "Search problems" }),
    ).toBeVisible();
  });
}

test("account actions stay available without a full account bar", async ({
  page,
}) => {
  await expect(page.getByRole("button", { name: "Sync now" })).toHaveCount(0);
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sync now" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Sync now" })).toHaveCount(0);
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await page.getByRole("heading", { name: "Your practice, today." }).click();
  await expect(page.getByRole("button", { name: "Sync now" })).toHaveCount(0);
});

test("opening one menu closes the other", async ({ page }) => {
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await expect(page.getByRole("complementary")).toHaveCount(0);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Sync now" })).toBeFocused();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("button", { name: "Sync now" })).toHaveCount(0);
  await expect(page.getByRole("complementary")).toBeVisible();
});
