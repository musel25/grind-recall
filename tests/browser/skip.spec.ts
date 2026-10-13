import { test, expect } from "@playwright/test";
import type { StudyState } from "../../src/types";

for (const width of [1280, 390]) {
  test(`Not today skips reviews and evening work, survives reload and can be undone (${width}px)`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const day = new Date().toISOString().slice(0, 10);
    const state: StudyState = {
      version: 1,
      revision: 0,
      settings: {
        startDate: day,
        weeks: 15,
        hours: 10,
        timezone: "UTC",
        reviewMultiplier: 1,
      },
      progress: {},
      history: [],
      planning: { days: { [day]: { minutes: 120, extras: [] } }, weeks: {} },
      morningStudy: { "valid-parentheses": day },
    };
    state.progress["two-sum"] = {
      due: day,
      card: null,
      imported: true,
      independent: false,
      note: "keep",
    };
    let remote = {
      accountId: "skip-test",
      version: 1,
      mutationId: "initial",
      state,
    };
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
      route.abort(),
    );
    await page.route("**/api/grind/**", async (route) => {
      if (route.request().url().includes("/account"))
        return route.fulfill({
          json: { user: { id: "skip-test", email: "test@example.com" } },
        });
      if (route.request().method() === "PUT") {
        const body = route.request().postDataJSON();
        remote = {
          ...remote,
          version: remote.version + 1,
          state: body.state,
          mutationId: body.mutationId,
        };
      }
      await route.fulfill({ json: remote });
    });
    await page.goto("./");
    await expect(
      page.getByRole("button", { name: "Skip Two Sum today", exact: true }),
    ).toBeVisible();
    const originalCount = await page.locator(".problem-row").count();
    const initialProgress = structuredClone(state.progress);
    for (const [i, title] of ["Two Sum", "Valid Parentheses"].entries()) {
      await page
        .getByRole("button", { name: `Skip ${title} today`, exact: true })
        .click();
      await expect(page.locator(".problem-row")).toHaveCount(
        originalCount - i - 1,
      );
      await expect(
        page.getByRole("button", {
          name: `Restore ${title} to today`,
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText("Saved to your account", { exact: true }),
      ).toBeVisible();
    }
    await page.reload();
    await expect(page.locator(".problem-row")).toHaveCount(originalCount - 2);
    await page
      .getByRole("region", { name: "Skipped today" })
      .screenshot({ path: testInfo.outputPath("skipped-today.png") });
    await page
      .getByRole("button", {
        name: "Restore Valid Parentheses to today",
        exact: true,
      })
      .click();
    await expect(
      page
        .getByRole("region", { name: "Practice tonight" })
        .getByRole("button", {
          name: "Skip Valid Parentheses today",
          exact: true,
        }),
    ).toBeVisible();
    await expect(
      page.getByText("Saved to your account", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Restore Two Sum to today", exact: true })
      .click();
    await expect(page.locator(".problem-row")).toHaveCount(originalCount);
    await expect(
      page.getByText("Saved to your account", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.locator(".problem-row")).toHaveCount(originalCount);
    expect(remote.state.progress).toEqual(initialProgress);
    expect(remote.state.history).toEqual([]);
    const extraTitle = (
      await page
        .locator(".extra-action")
        .filter({
          has: page.getByRole("button", {
            name: "Add one more problem",
            exact: true,
          }),
        })
        .locator("span")
        .innerText()
    ).replace("Next: ", "");
    await page
      .getByRole("button", { name: "Add one more problem", exact: true })
      .click();
    await expect(
      page.getByText("Saved to your account", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: `Skip ${extraTitle} today`, exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Undo last added problem" }),
    ).toHaveCount(0);
    await expect(
      page.getByText("Saved to your account", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: `Restore ${extraTitle} to today`,
        exact: true,
      })
      .click();
    await expect(page.locator(".problem-row")).toHaveCount(originalCount + 1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
