import { test, expect } from "./fixtures";
import { initialState, setDayMinutes } from "../../src/model";

test("an Again attempt gives clear daily and weekly progress after reload", async ({
  page,
}) => {
  const register = await page.request.post("/api/grind/register", {
    data: {
      email: `feedback-${crypto.randomUUID()}@example.com`,
      password: "test-password-123",
    },
  });
  expect(register.status()).toBe(201);
  await page.goto("./");
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .click();

  const summary = page.getByRole("region", { name: "Today's summary" });
  await expect(summary).toContainText("0 done today");
  await expect(summary).toContainText(/0m of .* this week/);
  await expect(
    page.getByRole("region", { name: "Study progress" }),
  ).not.toContainText("solved independently");

  await page.getByRole("button", { name: "Start practice" }).click();
  await page.getByRole("button", { name: "Rate my attempt" }).click();
  await page.getByLabel("Time spent (minutes)").fill("20");
  await page.getByRole("button", { name: /^Again Needed help/ }).click();

  await expect(page.getByRole("status")).toContainText("1 done today");
  await expect(page.getByRole("status")).toContainText("Next review");
  await expect(summary).toContainText("1 done today");
  await expect(summary).toContainText(/20m of .* this week/);

  await page.reload();
  await expect(summary).toContainText("1 done today");
  await expect(summary).toContainText(/20m of .* this week/);
});

test("finishing due reviews gives a review milestone even with an Again rating", async ({
  page,
}) => {
  const day = new Date().toISOString().slice(0, 10);
  const state = setDayMinutes(initialState(day), day, 0);
  state.settings.timezone = "UTC";
  state.progress["two-sum"] = {
    due: day,
    card: null,
    imported: true,
    independent: false,
    note: "Keep this note",
  };
  const register = await page.request.post("/api/grind/register", {
    data: {
      email: `review-feedback-${crypto.randomUUID()}@example.com`,
      password: "test-password-123",
    },
  });
  expect(register.status()).toBe(201);
  const { accountId } = await (
    await page.request.get("/api/grind/state")
  ).json();
  const saved = await page.request.put("/api/grind/state", {
    data: {
      accountId,
      state,
      baseVersion: 0,
      mutationId: crypto.randomUUID(),
    },
  });
  expect(saved.ok()).toBe(true);

  await page.goto("./");
  await expect(
    page.getByRole("region", { name: "Today's summary" }),
  ).toContainText("1due reviews");
  await page.getByRole("button", { name: "Start practice" }).click();
  await page.getByRole("button", { name: "Rate my attempt" }).click();
  await page.getByRole("button", { name: /^Again Needed help/ }).click();

  await expect(page.getByRole("status")).toContainText(
    "All due reviews done today",
  );
  await expect(
    page.getByRole("region", { name: "Today's summary" }),
  ).toContainText("1 done today");
  const remote = (await (await page.request.get("/api/grind/state")).json())
    .state;
  expect(remote.history.at(-1).rating).toBe(1);
  expect(remote.progress["two-sum"].note).toBe("Keep this note");
});
