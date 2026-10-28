import { expect, test } from "@playwright/test";
import { goToYear, openTab } from "./helpers";

test("各地朝代：名牌隨年份改變，點色帶打開朝代介紹卡", async ({ page }) => {
  await page.goto("/");
  await goToYear(page, "前221");
  await expect(page.getByTestId("era-label-cn")).toHaveText("秦");
  await goToYear(page, "1100");
  await expect(page.getByTestId("era-label-cn")).toHaveText("北宋");

  // 色帶在「同一時期」分頁，預設收起
  await openTab(page, "sameEra");
  await expect(page.getByTestId("era-bands")).toBeHidden();
  await page.getByTestId("era-bands-open").click();
  const bands = page.getByTestId("era-bands");
  await expect(bands).toBeVisible();
  await bands.getByRole("button", { name: "平安時代" }).click();
  const card = page.getByTestId("era-card");
  await expect(card).toBeVisible();
  await expect(page.getByTestId("era-title")).toHaveText("平安時代");
  await expect(card).toContainText("西元 794 年～西元 1185 年");
  await expect(page.getByTestId("era-same-time")).toContainText("北宋");

  // 從「同一時間的世界」換到別的地區
  await page.getByTestId("era-same-time").getByRole("button", { name: /拜占庭帝國/ }).click();
  await expect(page.getByTestId("era-title")).toHaveText("拜占庭帝國");
  await card.getByRole("button", { name: "關閉" }).click();
  await expect(card).toBeHidden();
});

test("關閉各地朝代圖層後，名牌與色帶都不顯示", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("era-label-cn")).toBeAttached();
  await openTab(page, "layers");
  await page.getByLabel("各地朝代（依年份）").uncheck();
  await expect(page.getByTestId("era-label-cn")).toHaveCount(0);
  await expect(page.getByTestId("era-bands")).toHaveCount(0);
});
