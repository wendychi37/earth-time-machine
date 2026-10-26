import { expect, test } from "@playwright/test";

test("首頁顯示繁體中文標題", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-Hant");
  await expect(page.getByRole("heading", { name: "地球時光機" })).toBeVisible();
});

test("資料來源頁列出授權與限制", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "資料來源與限制" })).toBeVisible();
  await expect(page.getByText("GPL-3.0")).toBeVisible();
  await expect(page.getByText("不代表古代國界")).toBeVisible();
});
