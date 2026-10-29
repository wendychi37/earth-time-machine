import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { goToYear, openTab, tapGlobe } from "./helpers";
import { unpackChronology, type CompactChronology } from "../../src/lib/chronology/compact";
import { capPerCountry, eventsNearYear } from "../../src/lib/events/visible";
import { CLUSTER_DEGREES, clusterMarkers, markerScale, scaleStep, stepScale } from "../../src/lib/events/cluster";
import { initialDistance } from "../../src/features/globe/initialView";
import type { HistoricalEvent } from "../../src/types/event";

const load = (f: string) => unpackChronology(JSON.parse(readFileSync(`public/data/chronology/${f}`, "utf8")) as CompactChronology);
const events: HistoricalEvent[] = [...load("world-chronology.json"), ...load("country-chronologies.json")];


test("點擊地球上的年表大事，開啟事件卡片與出處", async ({ page }, info) => {
  const year = 1600;
  await page.goto("/");
  // 選一個離初始視角中心（東亞）最近、且沒有和其他標記合併的事件
  await expect(page.getByTestId("globe-canvas").locator("canvas")).toBeVisible({ timeout: 30_000 });
  const vp = (await page.getByTestId("globe-canvas").locator("canvas").boundingBox())!;
  const threshold = CLUSTER_DEGREES * stepScale(scaleStep(markerScale(initialDistance(vp.width / vp.height))));
  const clusters = clusterMarkers(capPerCountry(eventsNearYear(events, year), year), threshold);
  const distance = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => Math.hypot(a.lat - b.lat, a.lon - b.lon);
  const single = clusters.filter((c) => c.events.length === 1 && clusters.every((o) => o === c || distance(o, c) > 4));
  const target = single.map((c) => ({ event: c.events[0], lat: c.lat, lon: c.lon })).sort((a, b) => distance(a, { lat: 22, lon: 112 }) - distance(b, { lat: 22, lon: 112 }))[0];
  expect(target).toBeTruthy();

  await expect(page.getByTestId("globe-canvas").locator("canvas")).toBeVisible({ timeout: 30_000 });
  await goToYear(page, String(year));
  await expect(page.getByTestId("boundary-legend")).toContainText("的快照", { timeout: 30_000 });
  await page.waitForTimeout(2500);

  // 朝代名牌可能剛好蓋在事件標記上，先關掉；再回到「年份」分頁，讓地球視窗和剛載入時一樣大
  await openTab(page, "layers");
  await page.getByLabel("各地朝代（依年份）").uncheck();
  if (info.project.name === "mobile") await openTab(page, "time");
  await page.waitForTimeout(1000);
  await tapGlobe(page, info, target.lat, target.lon);

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
  await openTab(page, "layers");
  await page.getByLabel(/^歷史大事/).uncheck();
  await expect(list.getByRole("button", { name: /攻陷拜占庭/ })).toHaveCount(0);
});
