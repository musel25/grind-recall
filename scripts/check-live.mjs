import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
const origin = "https://timer.musel.dev";
const password = randomBytes(24).toString("hex");
const created = [];
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  args: ["--no-sandbox"],
});
async function register(page, email) {
  await page.goto(`${origin}/grind/`);
  await page
    .getByRole("button", { name: "New here? Create an account" })
    .click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  const response = page.waitForResponse(
    (r) =>
      r.url().includes("/api/grind/register") &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  const res = await response;
  assert.equal(res.status(), 201);
  created.push((await res.json()).user);
}
async function state(page) {
  return page.evaluate(async () =>
    (
      await fetch(`/api/grind/state?verify=${crypto.randomUUID()}`, {
        cache: "no-store",
      })
    ).json(),
  );
}
try {
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await desktop.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin);
  await page.evaluate(() =>
    Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) =>
        setTimeout(
          () => reject(Error("Service worker activation timed out")),
          15000,
        ),
      ),
    ]),
  );
  await page.reload();
  const email = `grind-live-test-${randomUUID()}@example.com`;
  await register(page, email);
  await page.getByRole("button", { name: "Start from problem one" }).click();
  await page
    .locator('.account-bar [role="status"]')
    .filter({ hasText: "Saved to your account" })
    .waitFor();
  await page
    .getByRole("button", { name: "Studied Two Sum this morning", exact: true })
    .click();
  await page
    .locator('.account-bar [role="status"]')
    .filter({ hasText: "Saved to your account" })
    .waitFor();
  const saved = await state(page);
  assert.ok(saved.state.morningStudy["two-sum"]);
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const mobile = await phone.newPage();
  mobile.setDefaultTimeout(30000);
  await mobile.goto(`${origin}/grind/`);
  await mobile.getByLabel("Email", { exact: true }).fill(email);
  await mobile.getByLabel("Password", { exact: true }).fill(password);
  await mobile.getByRole("button", { name: "Sign in", exact: true }).click();
  await mobile.getByRole("region", { name: "Practice tonight" }).waitFor();
  assert.deepEqual((await state(mobile)).state, saved.state);
  assert.equal(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await mobile.screenshot({
    path: "/tmp/grind-live-sync-mobile.png",
    fullPage: true,
  });
  const separate = await browser.newContext();
  const partner = await separate.newPage();
  partner.setDefaultTimeout(30000);
  await register(partner, `grind-live-test-${randomUUID()}@example.com`);
  await partner
    .getByRole("button", { name: "Start from problem one" })
    .waitFor();
  assert.equal((await state(partner)).state, null);
  assert.deepEqual((await state(page)).state, saved.state);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: live HTTPS, Planner service worker compatibility, account signup/login, VPS persistence, separate phone session, account isolation, mobile layout.",
  );
} finally {
  await browser.close();
  // Delete only the exact throwaway accounts this run created, never real users.
  if (created.length) {
    const script = `const Database = require('better-sqlite3');
const db = new Database(process.env.TIMER_DB);
const accounts = ${JSON.stringify(created)};
db.transaction(() => { for (const account of accounts) {
  if (!account.email.startsWith('grind-live-test-') || !/^[a-f0-9]{32}$/.test(account.id)) throw Error('Invalid test identity');
  const row = db.prepare('SELECT email FROM users WHERE id=?').get(account.id);
  if (row?.email !== account.email) throw Error('Identity mismatch');
  db.prepare('DELETE FROM grind_states WHERE user_id=?').run(account.id);
  db.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(account.id);
  db.prepare('DELETE FROM users WHERE id=?').run(account.id);
}})();
db.close();`;
    execFileSync("ssh", ["my-vps", "docker exec -i timer node"], {
      input: script,
      stdio: ["pipe", "inherit", "inherit"],
    });
    console.log("Removed temporary verification accounts.");
  }
}
