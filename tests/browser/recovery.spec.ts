import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { StudyState } from "../../src/types";
const problems = JSON.parse(
  readFileSync(new URL("../../src/problems.json", import.meta.url), "utf8"),
) as { id: string }[];
function progress(): StudyState {
  return {
    version: 1,
    revision: 16,
    settings: {
      startDate: "2026-10-05",
      weeks: 15,
      hours: 10,
      timezone: "America/Tijuana",
      reviewMultiplier: 1,
    },
    progress: Object.fromEntries(
      problems
        .slice(0, 26)
        .map((p, i) => [
          p.id,
          {
            due: "2026-10-13",
            card: null,
            imported: i < 10,
            note: "",
            independent: i >= 10,
          },
        ]),
    ),
    history: problems
      .slice(10, 26)
      .map((p) => ({
        id: "attempt-" + p.id,
        problemId: p.id,
        day: "2026-10-05",
        rating: 3,
        minutes: 30,
        wasNew: true,
        previous: null,
      })),
  };
}
test("refresh and Sync now expose all eight attempts from an old tab and recover them", async ({
  page,
}) => {
  const original = progress();
  const older = {
    ...original,
    progress: Object.fromEntries(
      Object.entries(original.progress).slice(0, 18),
    ),
    history: original.history.slice(0, 8),
  };
  let remote = {
    accountId: "recovery-test",
    version: 1,
    mutationId: "first",
    state: older,
  };
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.route("**/api/grind/**", async (route) => {
    if (route.request().url().includes("/account"))
      return route.fulfill({
        json: { user: { id: "recovery-test", email: "test@example.com" } },
      });
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON();
      if (body.baseVersion !== remote.version)
        return route.fulfill({ status: 409, json: { error: "conflict" } });
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
  // Simulate the original pre-account application saving after migration.
  await page.evaluate(
    (state) => localStorage.setItem("grind-recall:v1", JSON.stringify(state)),
    original,
  );
  await page.reload();
  await page.getByRole("button", { name: "Sync now", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "8 additional problems, 8 attempts",
  );
  await expect(page.locator('.account-bar [role="status"]')).toContainText(
    "needs recovery",
  );
  await page
    .getByRole("button", { name: "Restore browser progress to my account" })
    .click();
  await expect(
    page.getByText("26 of 169 practiced", { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.account-bar [role="status"]')).toContainText(
    "Saved to your account",
  );
  expect(Object.keys(remote.state.progress)).toHaveLength(26);
  expect(remote.state.history).toHaveLength(16);
  await page.reload();
  await expect(
    page.getByText("26 of 169 practiced", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some((k) => k.includes(":recovery:")),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("grind-recall:v1")!).history.length,
    ),
  ).toBe(16);
});
