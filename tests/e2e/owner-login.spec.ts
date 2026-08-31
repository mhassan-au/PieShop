import { expect, test } from "@playwright/test";

test("renders an accessible owner login without public account paths", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  await page.goto("/login");

  await expect(
    page.getByRole("heading", { level: 1, name: "Platform owner sign in" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("type", "email");
  await expect(page.getByLabel("Password")).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled();
  await expect(
    page.getByRole("link", { name: /sign up|register|forgot|recover/iu }),
  ).toHaveCount(0);

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);
  expect(browserErrors).toEqual([]);
});

test("rejects malformed input with central wording", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("synthetic-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.locator("p[role='alert']")).toHaveText(
    "Enter a valid email address and password.",
  );
});

test("direct protected entry redirects a signed-out browser", async ({
  page,
}) => {
  await page.goto("/control");

  await expect(page).toHaveURL(/\/login$/u);
  await expect(
    page.getByRole("heading", { level: 1, name: "Platform owner sign in" }),
  ).toBeVisible();
});
