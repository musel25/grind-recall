import { test, expect } from "./fixtures";

test("a new account starts Python Next Steps and keeps the plan on another device", async ({
  page,
  browser,
  baseURL,
}) => {
  const email = `python-${crypto.randomUUID()}@example.com`;
  const password = "python-course-password-123";
  await page.goto("./");
  await page
    .getByRole("button", { name: "New here? Create an account" })
    .click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("button", { name: "Start Python Next Steps" }).click();

  await expect(
    page.getByRole("region", { name: "Study progress" }),
  ).toContainText("of 40 practiced");
  await expect
    .poll(async () =>
      page.evaluate(async () => {
        const response = await fetch("/api/grind/state", { cache: "no-store" });
        const data = await response.json();
        return data.state?.settings.curriculum;
      }),
    )
    .toBe("python-next-steps");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("link", { name: "Python Next Steps on Cojudge" }),
  ).toHaveAttribute(
    "href",
    "https://cojudge.musel.dev/?course=python-next-steps",
  );
  await page
    .getByRole("complementary")
    .getByRole("button", { name: "All problems" })
    .click();
  await expect(page.getByText("40 active problems")).toBeVisible();
  await expect(page.getByLabel("Problem collection")).toHaveCount(0);
  await expect(page.getByText("01. Sum Even Numbers")).toBeVisible();
  await page.getByText("01. Sum Even Numbers").click();
  await expect(
    page.getByRole("link", { name: "Open on Cojudge" }),
  ).toHaveAttribute(
    "href",
    "https://cojudge.musel.dev/problems/pns-01-sum-even-numbers",
  );

  const phone = await browser.newContext({ baseURL });
  try {
    const mobile = await phone.newPage();
    await mobile.goto("./");
    await mobile.getByLabel("Email", { exact: true }).fill(email);
    await mobile.getByLabel("Password", { exact: true }).fill(password);
    await mobile.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      mobile.getByRole("region", { name: "Study progress" }),
    ).toContainText("of 40 practiced");
  } finally {
    await phone.close();
  }
});
