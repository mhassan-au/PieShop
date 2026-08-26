import { expect, test } from "@playwright/test";

test("renders the accessible message showcase without horizontal overflow", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /PieShop.*Clear words when they matter/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("Validation", { exact: true })).toBeVisible();
  await expect(page.getByText("Confirmation", { exact: true })).toBeVisible();
  await expect(page.getByText("Success", { exact: true })).toBeVisible();
  await expect(page.getByText("Failure", { exact: true })).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
  expect(browserErrors).toEqual([]);
});
