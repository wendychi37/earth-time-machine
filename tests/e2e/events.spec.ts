import { expect, test, type Page } from "@playwright/test";
import { PerspectiveCamera } from "three";
import { latLonToVector3 } from "../../src/lib/geo/sphere";

async function goToYear(page: Page, text: string) {
  await page.getByTestId("year-input").fill(text);
  await page.getByTestId("year-input").press("Enter");
}

/** 以與 GlobeCanvas 相同的初始相機設定，算出某經緯度在畫面上的位置 */
function projectInitialView(lat: number, lon: number, width: number, height: number) {
  const aspect = width / height;
  const fitWidth = 1 / (0.8 * Math.tan((45 / 2) * (Math.PI / 180)) * aspect);
  const distance = Math.min(5, Math.max(3.2, fitWidth));
  const camera = new PerspectiveCamera(45, aspect, 0.01, 100);
  camera.position.copy(latLonToVector3(22, 112, distance));
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const p = latLonToVector3(lat, lon, 1.006).project(camera);
  return { x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height };
}

test("點擊地球上的事件標記，開啟事件卡片", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByTestId("globe-canvas").locator("canvas")).toBeVisible({ timeout: 30_000 });
  await goToYear(page, "前221");
  await expect(page.getByTestId("boundary-legend")).toContainText("的快照", { timeout: 30_000 });
  await page.waitForTimeout(2500);

  const viewport = page.viewportSize()!;
  const { x, y } = projectInitialView(34.33, 108.71, viewport.width, viewport.height);
  if (info.project.name === "mobile") await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);

  const card = page.getByTestId("event-card");
  await expect(card).toBeVisible();
  await expect(page.getByTestId("event-title")).toHaveText("秦統一六國");
  await expect(card).toContainText("示範資料");
  await expect(page.getByTestId("event-date")).toHaveText("西元前 221 年");
  await expect(card).toContainText("原始紀年：秦王政二十六年");
  await expect(card).toContainText("咸陽");
  await expect(page.getByTestId("wiki-zh")).toHaveAttribute("href", /zh\.wikipedia\.org/);
  await page.screenshot({ path: `test-results/events-${info.project.name}-card.png` });

  await card.getByRole("button", { name: "關閉" }).click();
  await expect(card).toHaveCount(0);
});

test("鍵盤使用者可從事件清單開啟卡片", async ({ page }) => {
  await page.goto("/");
  await goToYear(page, "1453");
  const item = page.getByRole("button", { name: /君士坦丁堡陷落/ });
  await item.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("event-date")).toHaveText("西元 1453 年 5 月 29 日（儒略曆）");
});

test("關閉事件標記圖層後不顯示清單", async ({ page }) => {
  await page.goto("/");
  await goToYear(page, "1453");
  await expect(page.getByRole("button", { name: /君士坦丁堡陷落/ })).toHaveCount(1);
  await page.getByLabel("事件標記").uncheck();
  await expect(page.getByRole("button", { name: /君士坦丁堡陷落/ })).toHaveCount(0);
});
