import { expect, test } from "@playwright/test";

test("拉到史前年代，地球上出現考古文化，點了顯示年代與維基百科原文", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByTestId("globe-canvas").locator("canvas")).toBeVisible({ timeout: 30_000 });

  await page.getByTestId("year-input").fill("西元前1000");
  await page.getByTestId("year-input").press("Enter");
  await expect(page.getByTestId("current-year")).toHaveText(/西元前 1000 年/);

  // 預設視角在東亞上空，臺灣與中國的考古文化應該看得到
  const cultures = page.getByTestId("map-labels").locator('.map-label[data-kind="culture"]:not([hidden])');
  await expect(cultures.first()).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: `test-results/cultures-${info.project.name}.png` });

  const name = (await cultures.first().textContent())!;
  await cultures.first().click();
  const card = page.getByTestId("culture-card");
  await expect(card).toBeVisible();
  await expect(page.getByTestId("culture-title")).toHaveText(name);
  await expect(card).toContainText("維基百科原文");

  // 關掉「考古文化」圖層後不再顯示
  await page.getByLabel("考古文化（依年份）").uncheck();
  await expect(cultures).toHaveCount(0);
});
