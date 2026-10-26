import { expect, test } from "@playwright/test";

test("首頁顯示繁體中文標題", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant");
  await expect(page.getByRole("heading", { name: "地球時光機" })).toBeVisible();
});
