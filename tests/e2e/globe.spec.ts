import { expect, test, type Page } from "@playwright/test";
import { openTab, tapGlobe } from "./helpers";

async function waitForGlobe(page: Page) {
  await page.goto("/");
  const canvas = page.getByTestId("globe-canvas").locator("canvas");
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  // 等待貼圖載入與第一次繪製
  await page.waitForTimeout(2500);
  return canvas;
}

async function center(page: Page) {
  const box = await page.getByTestId("globe-canvas").locator("canvas").boundingBox();
  if (!box) throw new Error("找不到地球畫布");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test("顯示 3D 地球，可拖曳旋轉與縮放", async ({ page }, info) => {
  const canvas = await waitForGlobe(page);
  const before = await canvas.screenshot();
  await page.screenshot({ path: `test-results/globe-${info.project.name}-initial.png` });

  const c = await center(page);
  await page.mouse.move(c.x, c.y);
  await page.mouse.down();
  await page.mouse.move(c.x + 160, c.y + 30, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(800);
  const rotated = await canvas.screenshot();
  expect(rotated.equals(before)).toBe(false);

  await page.mouse.move(c.x, c.y);
  await page.mouse.wheel(0, -600);
  await page.waitForTimeout(800);
  const zoomed = await canvas.screenshot();
  expect(zoomed.equals(rotated)).toBe(false);
  await page.screenshot({ path: `test-results/globe-${info.project.name}-zoomed.png` });
});

test("點擊地球顯示經緯度與現代國家（參考）", async ({ page }, info) => {
  await waitForGlobe(page);
  await openTab(page, "layers");
  await page.getByLabel("國名與行政區（現代）").check();
  if (info.project.name === "mobile") await openTab(page, "time");
  // 中南半島（避開地球正中央可點的朝代名牌）
  await tapGlobe(page, info, 15, 103);
  await expect(page.getByTestId("selection-coords")).toContainText("緯");
  await expect(page.getByTestId("selection-modern-country")).toBeVisible();
  await page.screenshot({ path: `test-results/globe-${info.project.name}-selected.png` });
});

test("手機可用觸控拖曳旋轉", async ({ page }, info) => {
  test.skip(info.project.name !== "mobile", "僅手機");
  const canvas = await waitForGlobe(page);
  const before = await canvas.screenshot();
  const c = await center(page);
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", x: number, y: number) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
  await touch("touchStart", c.x, c.y);
  for (let i = 1; i <= 10; i++) await touch("touchMove", c.x + i * 12, c.y);
  await touch("touchEnd", c.x + 120, c.y);
  await page.waitForTimeout(800);
  expect((await canvas.screenshot()).equals(before)).toBe(false);
});
