import { test, expect } from "@playwright/test";
import type { StudyState } from "../../src/types";

test("extra additions can be undone in reverse order after reload without losing progress", async ({
  page,
}) => {
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
    progress: {
      "two-sum": {
        due: "2099-01-01",
        card: null,
        imported: true,
        note: "Keep this note",
        independent: true,
      },
    },
    history: [],
  };
  state.planning = { days: { [day]: { minutes: 0, extras: [] } }, weeks: {} };
  let remote = {
    accountId: "extra-test",
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
        json: { user: { id: "extra-test", email: "test@example.com" } },
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
  const undo = page.getByRole("button", { name: "Undo last added problem" });
  await expect(undo).toHaveCount(0);
  for (let i = 1; i <= 2; i++) {
    await page
      .getByRole("button", { name: "Add one more problem", exact: true })
      .click();
    await expect(page.locator(".problem-row")).toHaveCount(i);
    await expect
      .poll(() => remote.state.planning!.days[day].extras.length)
      .toBe(i);
  }
  const first = await page.locator(".problem-row").first().innerText();
  await page.reload();
  await undo.click();
  await expect(page.locator(".problem-row")).toHaveCount(1);
  await expect(page.locator(".problem-row")).toHaveText(first, {
    useInnerText: true,
  });
  await expect
    .poll(() => remote.state.planning!.days[day].extras.length)
    .toBe(1);
  await undo.click();
  await expect(page.locator(".problem-row")).toHaveCount(0);
  await expect(undo).toHaveCount(0);
  await expect
    .poll(() => remote.state.planning!.days[day].extras.length)
    .toBe(0);
  await page.reload();
  await expect(page.locator(".problem-row")).toHaveCount(0);
  expect(remote.state.progress).toEqual(state.progress);
  expect(remote.state.history).toEqual(state.history);
});
