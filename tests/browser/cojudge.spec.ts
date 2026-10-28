import { test, expect } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`Cojudge course links, completion, reload and undo (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
      route.abort(),
    );
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.request.post("/api/grind/register", {
      data: {
        email: `cojudge-${crypto.randomUUID()}@example.com`,
        password: "test-password-123",
      },
    });
    expect(response.status()).toBe(201);
    await page.goto("./");
    await page
      .getByRole("button", { name: "Continue with my first 10 completed" })
      .click();
    await expect(page.locator(".sidebar-plan")).toContainText("10 of 169");
    await page
      .getByRole("button", { name: "Python courses", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Python courses" }),
    ).toBeVisible();
    const courses = page.locator(".course-group");
    await expect(courses).toHaveCount(5);
    await expect(courses.locator("summary")).toHaveText([
      "Pybites OOP Path0/22",
      "Pybites Pytest Path0/10",
      "Pybites Data Formats Path0/17",
      "Pybites Collections Path0/11",
      "Pybites Decorators and Context Managers Path0/12",
    ]);
    await expect(
      courses.first().getByRole("link", { name: "Open course on Cojudge" }),
    ).toHaveAttribute("href", "https://cojudge.musel.dev/?course=pybites-oop");
    await courses
      .first()
      .getByRole("button", { name: /01. Write a property/ })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("link", { name: "Open on Cojudge" }),
    ).toHaveAttribute(
      "href",
      "https://cojudge.musel.dev/problems/pb-01-write-a-property",
    );
    await expect(
      dialog.getByRole("button", { name: "Rate my attempt" }),
    ).toHaveCount(0);
    await expect(
      dialog.getByRole("button", { name: "Studied this morning" }),
    ).toHaveCount(0);
    await dialog.getByLabel("Time spent (minutes)").fill("25");
    await dialog
      .getByLabel("Notes (optional)")
      .fill("A computed read-only property.");
    await dialog.getByRole("button", { name: "Mark complete" }).click();
    await expect(courses.first().locator("summary")).toContainText("1/22");
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await page.reload();
    await page
      .getByRole("button", { name: "Python courses", exact: true })
      .click();
    await expect(courses.first().locator("summary")).toContainText("1/22");
    await courses
      .first()
      .getByRole("button", { name: /01. Write a property/ })
      .click();
    await expect(dialog).toContainText("No review is scheduled.");
    await expect(dialog).toContainText("A computed read-only property.");
    await expect(
      dialog.getByRole("button", { name: "Mark complete" }),
    ).toHaveCount(0);
    await dialog.getByRole("button", { name: "Close practice" }).click();
    await page.screenshot({
      path: `/tmp/grind-cojudge-courses-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const saved = await page.evaluate(
      async () => (await (await fetch("/api/grind/state")).json()).state,
    );
    expect(saved.history.at(-1).rating).toBe(null);
    expect(saved.progress["pb-01-write-a-property"].card).toBe(null);
    expect(saved.progress["two-sum"].imported).toBe(true);
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await page.getByRole("button", { name: "Undo last attempt" }).click();
    await page
      .getByRole("button", { name: "Python courses", exact: true })
      .click();
    await expect(courses.first().locator("summary")).toContainText("0/22");
    await courses.first().locator("summary").click();
    await courses.last().locator("summary").click();
    await courses.last().locator(".problem-row").first().click();
    await expect(
      dialog.getByRole("link", { name: "Open on Cojudge" }),
    ).toHaveAttribute(
      "href",
      "https://cojudge.musel.dev/problems/pbdc-01-create-a-sandwich-decorator",
    );
    await expect(
      dialog.getByRole("button", { name: "Rate my attempt" }),
    ).toHaveCount(0);
    await dialog.getByLabel("Time spent (minutes)").fill("20");
    await dialog.getByRole("button", { name: "Mark complete" }).click();
    await expect(courses.last().locator("summary")).toContainText("1/12");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/grind-decorators-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}
