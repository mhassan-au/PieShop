import { expect, test } from "@playwright/test";

test("renders the accessible observability showcase without horizontal overflow", async ({
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
      name: /PieShop.*Useful evidence. Less exposure/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("Structured debug event")).toBeVisible();
  await expect(page.getByText("Telegram critical alert")).toBeVisible();
  await expect(page.getByText(/Nothing was transmitted/i)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cloud database foundation" }),
  ).toBeVisible();
  await expect(page.getByText(/No credentials are displayed/i)).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalOverflow).toBe(false);
  expect(browserErrors).toEqual([]);
});
