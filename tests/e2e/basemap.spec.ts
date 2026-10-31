import { expect, test } from "@playwright/test";
import { openTab } from "./helpers";

test("立體地球顯示繁體中文國名，可切換到平面地圖", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByTestId("globe-canvas").locator("canvas")).toBeVisible({ timeout: 30_000 });

  const labels = page.getByTestId("map-labels").locator(".map-label:not([hidden])");
  // 預設視角在東亞上空（中國、日本的國名會讓位給朝代名牌，改看泰國、印尼）
  await expect(labels.filter({ hasText: /^泰國$/ })).toBeVisible({ timeout: 30_000 });
  await expect(labels.filter({ hasText: /^印尼$/ })).toBeVisible();

  await openTab(page, "layers");
  const mapButton = page.getByRole("radio", { name: /平面地圖/ });
  const globeButton = page.getByRole("radio", { name: /立體地球/ });
  await expect(globeButton).toHaveAttribute("aria-checked", "true");
  await page.screenshot({ path: `test-results/basemap-${info.project.name}-globe.png` });

  await mapButton.click();
  await expect(mapButton).toHaveAttribute("aria-checked", "true");
  // 平面地圖一開始對準東亞，一樣有國名
  await expect(labels.filter({ hasText: /^泰國$/ })).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: `test-results/basemap-${info.project.name}-flat.png` });

  // 關掉「國名與行政區」後標籤消失
  await openTab(page, "layers");
  await page.getByLabel("國名與行政區（現代）").uncheck();
  await expect(labels.and(page.locator(":not([data-kind=\"culture\"])"))).toHaveCount(0);
});
