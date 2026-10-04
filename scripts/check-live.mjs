import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  // Reproduce a returning Planner user, whose root service worker used to
  // intercept /grind/ and substitute the Planner shell.
  await page.goto("https://timer.musel.dev/");
  await page.evaluate(() =>
    Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(Error("Service worker did not activate")),
          15000,
        ),
      ),
    ]),
  );
  await page.reload();
  const response = await page.goto("https://timer.musel.dev/grind/");
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .waitFor();
  assert.equal(response.status(), 200);
  assert.equal(await page.title(), "Grind Recall");
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page
    .getByRole("button", { name: "Continue with my first 10 completed" })
    .click();
  await page.getByRole("heading", { name: "Your practice, today." }).waitFor();
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await page.getByRole("button", { name: "Rate my attempt" }).click();
  await page
    .getByRole("button", { name: /^Good Solved independently/ })
    .click();
  await page.reload();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("grind-recall:v1")).history.length,
    ),
    1,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: production HTTPS, existing Planner service worker, practice, persistence, mobile layout.",
  );
} finally {
  await browser.close();
}
