import { test, expect } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`Cojudge course links, ratings, reload and undo (${width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
      route.abort(),
    );
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await page.request.post("/api/grind/register", {
      data: {
        email: `cojudge-${crypto.randomUUID()}@example.com`,
        password: "test-password-123",
      },
    });
    expect(response.status()).toBe(201);
    await page.goto("./");
    await page
      .getByRole("button", { name: "Continue with my first 10 completed" })
      .click();
    await expect(page.locator(".sidebar-plan")).toContainText("10 of 136");
    await page
      .getByRole("button", { name: "Python courses", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Python courses" }),
    ).toBeVisible();
    const courses = page.locator(".course-group");
    await expect(courses).toHaveCount(5);
    await expect(courses.locator(".problem-row")).toHaveCount(39);
    await expect(
      courses.getByRole("button", { name: /06. Subclass the dict built-in/ }),
    ).toHaveCount(0);
    await expect(courses.locator("summary")).toHaveText([
      "Pybites OOP Path0/9",
      "Pybites Pytest Path0/8",
      "Pybites Data Formats Path0/7",
      "Pybites Collections Path0/8",
      "Pybites Decorators and Context Managers Path0/7",
    ]);
    await expect(
      courses.first().getByRole("link", { name: "Open course on Cojudge" }),
    ).toHaveAttribute("href", "https://cojudge.musel.dev/?course=pybites-oop");
    await courses
      .first()
      .getByRole("button", { name: /01. Write a property/ })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("link", { name: "Open on Cojudge" }),
    ).toHaveAttribute(
      "href",
      "https://cojudge.musel.dev/problems/pb-01-write-a-property",
    );
    await expect(
      dialog.getByRole("button", { name: "Studied this morning" }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Rate my attempt" }).click();
    await expect(dialog.getByLabel("Time spent (minutes)")).toHaveValue("18");
    await dialog.getByLabel("Time spent (minutes)").fill("25");
    await dialog
      .getByLabel("What should you remember?")
      .fill("A computed read-only property.");
    await dialog
      .getByRole("button", { name: /^Good Solved independently/ })
      .click();
    await expect(courses.first().locator("summary")).toContainText("1/9");
    await expect(page.locator('.account-bar [role="status"]')).toHaveText(
      "Saved to your account",
    );
    await page.reload();
    await page
      .getByRole("button", { name: "Python courses", exact: true })
      .click();
    await expect(courses.first().locator("summary")).toContainText("1/9");
    await courses
      .first()
      .getByRole("button", { name: /01. Write a property/ })
      .click();
    await expect(dialog).toContainText("Recorded for today. Next review");
    await expect(dialog).toContainText("A computed read-only property.");
    await expect(
      dialog.getByRole("button", { name: "Rate my attempt" }),
    ).toHaveCount(0);
    await dialog.getByRole("button", { name: "Close practice" }).click();
    await page.screenshot({
      path: `/tmp/grind-cojudge-courses-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const saved = await page.evaluate(
      async () => (await (await fetch("/api/grind/state")).json()).state,
    );
    expect(saved.history.at(-1).rating).toBe(3);
    expect(saved.progress["pb-01-write-a-property"].card).not.toBe(null);
    expect(saved.progress["two-sum"].imported).toBe(true);
    await page.getByRole("button", { name: "Today", exact: true }).click();
    await page.getByRole("button", { name: "Undo last attempt" }).click();
    await page
      .getByRole("button", { name: "Python courses", exact: true })
      .click();
    await expect(courses.first().locator("summary")).toContainText("0/9");
    await courses.first().locator("summary").click();
    await courses.last().locator("summary").click();
    await courses.last().locator(".problem-row").first().click();
    await expect(
      dialog.getByRole("link", { name: "Open on Cojudge" }),
    ).toHaveAttribute(
      "href",
      "https://cojudge.musel.dev/problems/pbdc-01-create-a-sandwich-decorator",
    );
    await dialog.getByRole("button", { name: "Rate my attempt" }).click();
    await expect(dialog.getByLabel("Time spent (minutes)")).toHaveValue("18");
    await dialog.getByLabel("Time spent (minutes)").fill("20");
    await dialog
      .getByRole("button", { name: /^Good Solved independently/ })
      .click();
    await expect(courses.last().locator("summary")).toContainText("1/7");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/tmp/grind-decorators-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "All problems", exact: true })
      .click();
    await expect(page.locator(".week-group .problem-row")).toHaveCount(136);
    await expect(
      page.getByRole("button", { name: /06. Subclass the dict built-in/ }),
    ).toHaveCount(0);
    await page.getByLabel("Problem collection").selectOption("Archive");
    const optional = page.getByRole("link", {
      name: /06. Subclass the dict built-in/,
    });
    await expect(optional).toHaveAttribute(
      "href",
      "https://cojudge.musel.dev/problems/pb-06-subclass-the-dict-built-in",
    );
    await expect(optional).toContainText("Optional · Open on Cojudge");
    expect(errors).toEqual([]);
  });
}

test("old Python completions can be reviewed, synced, and undone without losing completion history", async ({
  page,
}) => {
  const response = await page.request.post("/api/grind/register", {
    data: {
      email: `legacy-python-${crypto.randomUUID()}@example.com`,
      password: "test-password-123",
    },
  });
  expect(response.status()).toBe(201);
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
    route.abort(),
  );
  await page.goto("./");
  await page.getByRole("button", { name: "Start from problem one" }).click();
  await expect(page.locator('.account-bar [role="status"]')).toHaveText(
    "Saved to your account",
  );
  const current = (await (await page.request.get("/api/grind/state")).json())
    .state;
  const first = "pb-06-subclass-the-dict-built-in";
  current.progress[first] = {
    due: "2026-10-01",
    card: null,
    imported: false,
    independent: false,
    note: "Original course note",
  };
  current.history.push({
    id: "old-completion",
    problemId: first,
    day: "2026-10-01",
    rating: null,
    minutes: 25,
    wasNew: true,
    previous: null,
  });
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByLabel("Import backup file").setInputFiles({
    name: "old-python.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(current)),
  });
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page
    .locator(".problem-row")
    .filter({ hasText: "06. Subclass the dict built-in" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("link", { name: "Open on Cojudge" }),
  ).toHaveAttribute("href", `https://cojudge.musel.dev/problems/${first}`);
  await dialog.getByRole("button", { name: "Rate my attempt" }).click();
  await expect(dialog.getByLabel("Time spent (minutes)")).toHaveValue("18");
  await expect(dialog.getByLabel("What should you remember?")).toHaveValue(
    "Original course note",
  );
  await dialog
    .getByRole("button", { name: /^Again Needed help or forgot/ })
    .click();
  await expect(page.locator('.account-bar [role="status"]')).toHaveText(
    "Saved to your account",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Undo last attempt" }),
  ).toBeVisible();
  const reviewed = (await (await page.request.get("/api/grind/state")).json())
    .state;
  expect(reviewed.history[0]).toEqual(current.history[0]);
  expect(reviewed.history.at(-1).rating).toBe(1);
  expect(reviewed.progress[first].card).not.toBe(null);
  await page.getByRole("button", { name: "Undo last attempt" }).click();
  await expect(page.locator('.account-bar [role="status"]')).toHaveText(
    "Saved to your account",
  );
  const undone = (await (await page.request.get("/api/grind/state")).json())
    .state;
  expect(undone.history).toEqual(current.history);
  expect(undone.progress).toEqual(current.progress);
});
