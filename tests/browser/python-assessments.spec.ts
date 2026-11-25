import { test, expect, navigate } from "./fixtures";

test("a new account starts Python Assessments", async ({ page }) => {
  const registered = await page.request.post("/api/grind/register", {
    data: {
      email: "new-assessment@example.com",
      password: "assessment-test-password",
    },
  });
  expect(registered.status()).toBe(201);
  await page.goto("./");
  await page.getByRole("button", { name: "Start Python Assessments" }).click();
  await expect(
    page.getByRole("region", { name: "Study progress" }),
  ).toContainText("of 2 practiced");
  await navigate(page, "All problems");
  await expect(page.getByText("2 active problems")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Tool Lending Desk/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Community Workshop/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Problem collection")).toHaveCount(0);
});

test("an existing account can switch plans and recover its assessment review", async ({
  page,
}) => {
  const registered = await page.request.post("/api/grind/register", {
    data: {
      email: "switch-assessment@example.com",
      password: "assessment-test-password",
    },
  });
  expect(registered.status()).toBe(201);
  await page.goto("./");
  await page.getByRole("button", { name: "Start from problem one" }).click();
  const progress = page.getByRole("region", { name: "Study progress" });
  const readRemote = async () =>
    (await (await page.request.get("/api/grind/state")).json()).state;
  await expect(progress).toContainText("of 75 practiced");

  await navigate(page, "Settings");
  const plan = page.getByLabel("Study curriculum");
  const save = page.getByRole("button", { name: "Save settings" });
  await plan.selectOption({ label: "Python Assessments" });
  await expect(progress).toContainText("of 75 practiced");
  await save.click();
  await expect(progress).toContainText("of 2 practiced");

  await navigate(page, "All problems");
  await page.getByRole("button", { name: /Tool Lending Desk/ }).click();
  await expect(
    page.getByRole("link", { name: "Open on Cojudge" }),
  ).toHaveAttribute(
    "href",
    "https://cojudge.musel.dev/assessments/tool-lending-desk",
  );
  await page.getByRole("button", { name: "Rate my attempt" }).click();
  await expect(page.getByLabel("Time spent (minutes)")).toHaveValue("90");
  await page
    .getByLabel("What should you remember?")
    .fill("Check the expiry boundary");
  await page
    .getByRole("button", { name: /^Good Solved independently/ })
    .click();
  await expect(progress).toContainText("1 of 2 practiced");

  await navigate(page, "Settings");
  await plan.selectOption({ label: "Python Next Steps" });
  await save.click();
  await expect(progress).toContainText("0 of 40 practiced");
  await expect
    .poll(async () => (await readRemote())?.settings.curriculum)
    .toBe("python-next-steps");
  const savedReview = (await readRemote()).progress["tool-lending-desk"];

  await plan.selectOption({ label: "Python Assessments" });
  await save.click();
  await expect(progress).toContainText("1 of 2 practiced");

  await expect
    .poll(async () => (await readRemote())?.settings.curriculum)
    .toBe("python-assessments");
  const stored = await readRemote();
  expect(stored.progress["tool-lending-desk"]).toEqual(savedReview);
  expect(stored.progress["tool-lending-desk"]).toMatchObject({
    note: "Check the expiry boundary",
    independent: true,
    card: expect.any(Object),
  });
  expect(stored.history.at(-1)).toMatchObject({
    problemId: "tool-lending-desk",
    minutes: 90,
    rating: 3,
  });
  await page.reload();
  await expect(progress).toContainText("1 of 2 practiced");
});
