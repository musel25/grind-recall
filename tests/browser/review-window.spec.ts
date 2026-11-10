import { test, expect } from "./fixtures";
import { initialState, recordAttempt, setDayMinutes } from "../../src/model";
import { activeProblems } from "../../src/catalog";
import { addDays } from "../../src/scheduler";

for (const width of [1440, 390]) {
  test(`spread reviews saves a four-review limit and restores daily time (${width}px)`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 950 });
    const day = new Date().toISOString().slice(0, 10);
    let state = initialState(addDays(day, -7));
    state.settings.timezone = "UTC";
    state.settings.reviewMultiplier = 0.5;
    state.settings.hours = 9;
    state = setDayMinutes(state, day, 51);
    state = setDayMinutes(state, addDays(day, 1), 50);
    for (const p of activeProblems(state).slice(0, 12)) {
      state = recordAttempt(state, p.id, 3, addDays(day, -7), 15, "keep note");
      state.progress[p.id].due = day;
      state.progress[p.id].card!.due = day + "T12:00:00.000Z";
    }
    const before = structuredClone(state);
    const registered = await page.request.post("/api/grind/register", {
      data: {
        email: `reviews-${crypto.randomUUID()}@example.com`,
        password: "test-password-123",
      },
    });
    expect(registered.status()).toBe(201);
    const { accountId } = await (
      await page.request.get("/api/grind/state")
    ).json();
    const put = await page.request.put("/api/grind/state", {
      data: {
        accountId,
        state,
        baseVersion: 0,
        mutationId: crypto.randomUUID(),
      },
    });
    expect(put.ok()).toBe(true);
    await page.goto("./");
    await expect(
      page.getByRole("region", { name: "Today's summary" }),
    ).toContainText("12due reviews");
    await page.getByText("Adjust time", { exact: true }).click();
    await expect(page.getByLabel("Maximum reviews per day")).toHaveValue("4");
    await page
      .getByRole("button", { name: "Spread these reviews", exact: true })
      .click();
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await expect(
      page.getByRole("region", { name: "Today's summary" }),
    ).toContainText("4due reviews");
    await expect(
      page.getByRole("region", { name: "Daily and weekly plan" }),
    ).toContainText("At most 4 scheduled reviews");
    const saved = (await (await page.request.get("/api/grind/state")).json())
      .state;
    expect(saved.planning.reviewWindow).toEqual({
      start: day,
      end: addDays(day, 6),
      maxPerDay: 4,
    });
    expect(saved.planning.days[day].minutes).toBeUndefined();
    expect(saved.planning.days[addDays(day, 1)].minutes).toBeUndefined();
    expect(saved.history).toEqual(before.history);
    expect(saved.settings.reviewMultiplier).toBe(
      before.settings.reviewMultiplier,
    );
    for (const [id, progress] of Object.entries(before.progress)) {
      expect(saved.progress[id].note).toBe(progress.note);
      expect(saved.progress[id].card.stability).toBe(progress.card!.stability);
    }
    await page.reload();
    await expect(
      page.getByRole("region", { name: "Today's summary" }),
    ).toContainText("4due reviews");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("region", { name: "Daily and weekly plan" })
      .screenshot({ path: testInfo.outputPath("daily-plan.png") });
  });
}

test("daily summary adds row times and does not refill after fast completion", async ({
  page,
}) => {
  const day = new Date().toISOString().slice(0, 10);
  const state = setDayMinutes(initialState(day), day, 78);
  state.settings.timezone = "UTC";
  const registered = await page.request.post("/api/grind/register", {
    data: {
      email: `daily-${crypto.randomUUID()}@example.com`,
      password: "test-password-123",
    },
  });
  expect(registered.status()).toBe(201);
  const { accountId } = await (
    await page.request.get("/api/grind/state")
  ).json();
  expect(
    (
      await page.request.put("/api/grind/state", {
        data: {
          accountId,
          state,
          baseVersion: 0,
          mutationId: crypto.randomUUID(),
        },
      })
    ).ok(),
  ).toBe(true);
  await page.goto("./");
  await expect(
    page.getByRole("region", { name: "Today's summary" }),
  ).toContainText("1h 30mremaining");
  await expect(
    page.getByRole("region", { name: "Daily and weekly plan" }),
  ).toContainText("Assigned today: 1h 30m");
  await expect(page.locator(".problem-row")).toHaveCount(3);
  await page.locator(".problem-row").first().click();
  await page.getByRole("button", { name: "Rate my attempt" }).click();
  await page.getByLabel("Time spent (minutes)").fill("5");
  await page.getByRole("button", { name: /^Good/ }).click();
  await expect(page.locator('.account-bar [role="status"]')).toHaveText(
    "Saved to your account",
  );
  await expect(page.locator(".problem-row")).toHaveCount(2);
  await expect(
    page.getByRole("region", { name: "Today's summary" }),
  ).toContainText("1hremaining");
  await page.reload();
  await expect(page.locator(".problem-row")).toHaveCount(2);
});
