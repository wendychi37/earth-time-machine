import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { PerspectiveCamera } from "three";
import { unpackChronology, type CompactChronology } from "../../src/lib/chronology/compact";
import { capPerCountry, eventsNearYear } from "../../src/lib/events/visible";
import { spreadMarkers } from "../../src/lib/events/spread";
import { latLonToVector3 } from "../../src/lib/geo/sphere";
import type { HistoricalEvent } from "../../src/types/event";

const load = (f: string) => unpackChronology(JSON.parse(readFileSync(`public/data/chronology/${f}`, "utf8")) as CompactChronology);
const events: HistoricalEvent[] = [...load("world-chronology.json"), ...load("country-chronologies.json")];

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

test("點擊地球上的年表大事，開啟事件卡片與出處", async ({ page }, info) => {
  const year = 1600;
  // 選一個離初始視角中心（東亞）最近、且附近沒有其他標記的事件
  const markers = spreadMarkers(capPerCountry(eventsNearYear(events, year), year));
  const distance = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => Math.hypot(a.lat - b.lat, a.lon - b.lon);
  const target = markers
    .filter((m) => markers.every((o) => o === m || distance(o, m) > 4))
    .sort((a, b) => distance(a, { lat: 22, lon: 112 }) - distance(b, { lat: 22, lon: 112 }))[0];
  expect(target).toBeTruthy();

  await page.goto("/");
  await expect(page.getByTestId("globe-canvas").locator("canvas")).toBeVisible({ timeout: 30_000 });
  await goToYear(page, String(year));
  await expect(page.getByTestId("boundary-legend")).toContainText("的快照", { timeout: 30_000 });
  await page.waitForTimeout(2500);

  const viewport = page.viewportSize()!;
  const { x, y } = projectInitialView(target.lat, target.lon, viewport.width, viewport.height);
  if (info.project.name === "mobile") await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);

  const card = page.getByTestId("event-card");
  await expect(card).toBeVisible();
  await expect(page.getByTestId("event-title")).toHaveText(target.event.title);
  await expect(card).toContainText(target.event.summary);
  await expect(card).toContainText("世界史年表");
  await expect(card.getByRole("link", { name: /世界史年表/ })).toHaveAttribute("href", /zh\.wikipedia\.org.+oldid=\d+/);
  await expect(card).not.toContainText("示範資料");
  await page.screenshot({ path: `test-results/events-${info.project.name}-card.png` });

  await card.getByRole("button", { name: "關閉" }).click();
  await expect(card).toHaveCount(0);
});

test("鍵盤使用者可從事件清單開啟卡片", async ({ page }) => {
  await page.goto("/");
  await goToYear(page, "1453");
  const item = page.getByRole("navigation", { name: "此時期的事件" }).getByRole("button", { name: /攻陷拜占庭/ });
  await item.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("event-date")).toHaveText("西元 1453 年");
  await expect(page.getByTestId("event-card")).toContainText("原始紀年：1453年");
});

test("關閉事件標記圖層後不顯示清單", async ({ page }) => {
  await page.goto("/");
  await goToYear(page, "1453");
  const list = page.getByRole("navigation", { name: "此時期的事件" });
  await expect(list.getByRole("button", { name: /攻陷拜占庭/ })).toHaveCount(1);
  await page.getByLabel("事件標記").uncheck();
  await expect(list.getByRole("button", { name: /攻陷拜占庭/ })).toHaveCount(0);
});
