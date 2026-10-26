import { expect, test, type Page } from "@playwright/test";

async function goToYear(page: Page, text: string) {
  await page.getByTestId("year-input").fill(text);
  await page.getByTestId("year-input").press("Enter");
}

async function globeShot(page: Page) {
  await page.waitForTimeout(1500);
  return page.getByTestId("globe-canvas").locator("canvas").screenshot();
}

test("疆域圖層依年份切換，並標示快照與來源", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByTestId("globe-canvas").locator("canvas")).toBeVisible({ timeout: 30_000 });
  const legend = page.getByTestId("boundary-legend");
  await expect(legend).toContainText("顯示 西元 1500 年 的快照", { timeout: 20_000 });
  await expect(legend).toContainText("GPL-3.0");
  const y1500 = await globeShot(page);
  await page.screenshot({ path: `test-results/boundaries-${info.project.name}-1500.png` });

  await goToYear(page, "1914");
  await expect(legend).toContainText("顯示 西元 1914 年 的快照", { timeout: 20_000 });
  const y1914 = await globeShot(page);
  expect(y1914.equals(y1500)).toBe(false);
  await page.screenshot({ path: `test-results/boundaries-${info.project.name}-1914.png` });

  await goToYear(page, "前221");
  await expect(legend).toContainText("西元前 200 年");
  await expect(legend).toContainText("與選取年份相差 21 年");
});

test("沒有可靠資料的年份顯示資料不足，且不畫疆域", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByTestId("boundary-legend")).toBeVisible({ timeout: 30_000 });
  await goToYear(page, "西元前2500");
  await expect(page.getByTestId("data-gap")).toContainText("西元前 2500 年尚無可靠的疆域資料");
  await expect(page.getByTestId("data-gap")).toContainText("最接近的快照為 西元前 3000 年");
  await expect(page.getByTestId("boundary-legend")).toHaveCount(0);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `test-results/boundaries-${info.project.name}-gap.png` });
});

test("點擊區域顯示歷史疆域名稱、精度與來源", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByTestId("boundary-legend")).toContainText("的快照", { timeout: 30_000 });
  await page.waitForTimeout(2000);
  const box = await page.getByTestId("globe-canvas").locator("canvas").boundingBox();
  if (!box) throw new Error("找不到地球");
  const c = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (info.project.name === "mobile") await page.touchscreen.tap(c.x, c.y);
  else await page.mouse.click(c.x, c.y);
  const region = page.getByTestId("region-info");
  await expect(region).toBeVisible();
  await expect(region).toContainText("近似");
  await expect(region).toContainText("historical-basemaps");
  await expect(page.getByTestId("region-name")).not.toBeEmpty();
  await page.screenshot({ path: `test-results/boundaries-${info.project.name}-region.png` });
});
