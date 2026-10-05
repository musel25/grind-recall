import { test, expect, type Page } from "@playwright/test";

const password = "test-password-123";
test.beforeEach(async ({ page }) => {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
    route.abort(),
  );
});
async function signedIn(page: Page, email: string) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
    route.abort(),
  );
  await page.goto("./");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
async function serverState(page: Page) {
  return page.evaluate(async () =>
    (await fetch("/api/grind/state", { cache: "no-store" })).json(),
  );
}
test("migrates the original plan unchanged, syncs to a phone, and isolates a second account", async ({
  page,
  browser,
}) => {
  const email = `migration-${crypto.randomUUID()}@example.com`;
  const registration = await page.request.post("/api/grind/register", {
    data: { email, password },
  });
  expect(registration.status()).toBe(201);
  const day = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Tijuana",
  });
  const { default: problems } = await import("../../src/problems.json", {
    with: { type: "json" },
  });
  const legacy = {
    version: 1,
    revision: 1,
    settings: {
      startDate: day,
      weeks: 15,
      hours: 10,
      timezone: "America/Tijuana",
      reviewMultiplier: 1,
    },
    progress: Object.fromEntries(
      problems
        .slice(0, 10)
        .map((p) => [
          p.id,
          {
            due: "2026-10-07",
            card: null,
            imported: true,
            note: "",
            independent: false,
          },
        ]),
    ),
    history: [],
    morningStudy: { "balanced-binary-tree": day },
    planning: { breaks: ["2026-10-08", "2026-10-09"], days: {}, weeks: {} },
  };
  await page.addInitScript((s) => {
    if (!localStorage.getItem("grind-recall:v1"))
      localStorage.setItem("grind-recall:v1", JSON.stringify(s));
  }, legacy);
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Keep your progress." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Save existing progress to my account" })
    .click();
  await expect
    .poll(async () => (await serverState(page)).state)
    .toEqual(legacy);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("grind-recall:v1")!),
    ),
  ).toEqual(legacy);
  const phone = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    viewport: { width: 390, height: 844 },
  });
  const mobile = await phone.newPage();
  await signedIn(mobile, email);
  await expect(
    mobile.getByRole("region", { name: "Practice tonight" }),
  ).toContainText("Balanced Binary Tree");
  expect((await serverState(mobile)).state).toEqual(legacy);
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Rate my attempt", exact: true })
    .click();
  await page
    .getByLabel("What should you remember?")
    .fill("Keep this unfinished note");
  await mobile
    .getByRole("button", { name: "Add one more problem", exact: true })
    .click();
  await expect.poll(async () => (await serverState(mobile)).version).toBe(2);
  await expect(page.locator('.account-bar [role="status"]')).toContainText(
    "Close the editor",
    { timeout: 10000 },
  );
  await expect(page.getByLabel("What should you remember?")).toHaveValue(
    "Keep this unfinished note",
  );
  expect(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await mobile.screenshot({
    path: "/tmp/grind-cloud-mobile.png",
    fullPage: true,
  });
  const partner = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
  });
  const other = await partner.newPage();
  await other.goto("./");
  await other
    .getByRole("button", { name: "New here? Create an account" })
    .click();
  await other
    .getByLabel("Email", { exact: true })
    .fill(`partner-${crypto.randomUUID()}@example.com`);
  await other.getByLabel("Password", { exact: true }).fill(password);
  await other
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await other.getByRole("button", { name: "Start from problem one" }).click();
  await expect
    .poll(async () => (await serverState(other)).state?.progress)
    .toEqual({});
  expect((await serverState(page)).state.progress).toEqual(legacy.progress);
  await phone.close();
  await partner.close();
});
test("offline work retries and concurrent device edits require explicit recovery", async ({
  page,
  browser,
}) => {
  const email = `offline-${crypto.randomUUID()}@example.com`;
  expect(
    (
      await page.request.post("/api/grind/register", {
        data: { email, password },
      })
    ).status(),
  ).toBe(201);
  await page.goto("./");
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .click();
  await expect.poll(async () => (await serverState(page)).version).toBe(1);
  const phone = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
  });
  const mobile = await phone.newPage();
  await signedIn(mobile, email);
  await expect(
    mobile.getByRole("heading", { name: "Your practice, today." }),
  ).toBeVisible();
  await page.context().setOffline(true);
  await page
    .getByRole("button", {
      name: "Studied Balanced Binary Tree this morning",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", { name: "Practice tonight" }),
  ).toBeVisible();
  await mobile
    .getByRole("button", { name: "Add one more problem", exact: true })
    .click();
  await expect.poll(async () => (await serverState(mobile)).version).toBe(2);
  await page.context().setOffline(false);
  await page.getByRole("button", { name: "Sync now", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Load server progress" }),
  ).toBeVisible();
  expect((await serverState(mobile)).state.morningStudy ?? {}).toEqual({});
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export this device’s progress" })
    .click();
  expect((await download).suggestedFilename()).toMatch(/grind-recall/);
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Load server progress" }).click();
  await expect(
    page.getByRole("button", { name: "Load server progress" }),
  ).toHaveCount(0);
  // After recovery, a later offline save can sync normally.
  await page.context().setOffline(true);
  await page
    .getByRole("button", {
      name: "Studied Balanced Binary Tree this morning",
      exact: true,
    })
    .click();
  await page.context().setOffline(false);
  await expect
    .poll(
      async () =>
        (await serverState(page)).state.morningStudy?.["balanced-binary-tree"],
    )
    .toBeTruthy();
  await mobile.getByRole("button", { name: "Sync now", exact: true }).click();
  await expect(
    mobile.getByRole("region", { name: "Practice tonight" }),
  ).toContainText("Balanced Binary Tree");
  await phone.close();
});
