import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const original: { id: string }[] = JSON.parse(
  readFileSync(
    new URL("../../docs/catalog/original-problems.json", import.meta.url),
    "utf8",
  ),
);
import type { StudyState } from "../../src/types";
for (const width of [1280, 390]) {
  test(`focused roadmap preserves legacy extras, archives untouched problems, and saves new Bloomberg work (${width}px)`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const register = await page.request.post("/api/grind/register", {
      data: {
        email: `focused-${crypto.randomUUID()}@example.com`,
        password: "test-password-123",
      },
    });
    expect(register.status()).toBe(201);
    await page.goto("./");
    await page.getByRole("button", { name: "Start from problem one" }).click();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    const day = new Date().toISOString().slice(0, 10);
    const state: StudyState = {
      version: 1,
      revision: 1,
      settings: {
        startDate: day,
        weeks: 15,
        hours: 10,
        timezone: "UTC",
        reviewMultiplier: 1,
      },
      history: [],
      progress: Object.fromEntries(
        original.slice(0, 26).map((p) => [
          p.id,
          {
            due: "2099-01-01",
            card: null,
            imported: true,
            note: `Saved note: ${p.id}`,
            independent: false,
          },
        ]),
      ),
    };
    for (const id of [
      "min-stack",
      "house-robber",
      "maximum-subarray",
      "subarray-sum-equals-k",
    ])
      state.progress[id] = {
        due: "2099-01-01",
        card: null,
        imported: true,
        note: `Saved note: ${id}`,
        independent: false,
      };
    page.on("dialog", (d) => d.accept());
    await page.getByLabel("Import backup file").setInputFiles({
      name: "legacy.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(state)),
    });
    await expect(page.locator(".sidebar-plan")).toContainText(
      "30 of 172 practiced",
    );
    await page
      .getByRole("button", { name: "All problems", exact: true })
      .click();
    await expect(page.locator(".week-group .problem-row")).toHaveCount(172);
    const orders = await page
      .locator(".week-group .problem-row .meta")
      .allTextContents();
    expect(orders.map((t) => Number(t.match(/#(\d+)/)![1]))).toEqual(
      Array.from({ length: 172 }, (_, i) => i + 1),
    );
    await page.getByLabel("Search problems").fill("Meeting Rooms");
    await expect(page.locator(".week-group .problem-row")).toHaveCount(1);
    await page.getByRole("button", { name: /Meeting Rooms/ }).click();
    await page.getByRole("button", { name: "Rate my attempt" }).click();
    await expect(page.getByLabel("What should you remember?")).toHaveValue(
      "Saved note: meeting-rooms",
    );
    await page.getByRole("button", { name: "Close practice" }).click();
    await page.getByLabel("Search problems").fill("");
    await page.getByLabel("Problem collection").selectOption("Archive");
    await expect(page.locator("a.problem-row")).toHaveCount(94);
    await expect(
      page.getByRole("link", { name: /Sudoku Solver/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Stone Game IV/ }),
    ).toBeVisible();
    await page.getByLabel("Search problems").fill("Meeting Rooms");
    await expect(
      page.getByRole("link", { name: /Meeting Rooms II/ }),
    ).toBeVisible();
    await page.getByLabel("Search problems").fill("");
    await page.getByLabel("Problem collection").selectOption("Active plan");
    await page.getByLabel("Search problems").fill("Using a Robot");
    await page.getByRole("button", { name: /Using a Robot/ }).click();
    await page.getByRole("button", { name: "Rate my attempt" }).click();
    await page
      .getByLabel("What should you remember?")
      .fill("Track the minimum remaining character");
    await page
      .getByRole("button", { name: /^Good Solved independently/ })
      .click();
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await page.reload();
    await expect(page.locator(".sidebar-plan")).toContainText(
      "31 of 172 practiced",
    );
    const remote = await (await page.request.get("/api/grind/state")).json();
    expect(
      remote.state.progress[
        "using-a-robot-to-print-the-lexicographically-smallest-string"
      ].note,
    ).toBe("Track the minimum remaining character");
    for (const [id, progress] of Object.entries(state.progress))
      expect(remote.state.progress[id]).toEqual(progress);
    await page
      .getByRole("button", { name: "All problems", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/grind-focused-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}
