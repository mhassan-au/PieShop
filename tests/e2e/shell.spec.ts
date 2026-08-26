import { expect, test } from "@playwright/test";

test("renders the accessible PieShop foundation without horizontal overflow", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "PieShop" }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
  expect(browserErrors).toEqual([]);
});
