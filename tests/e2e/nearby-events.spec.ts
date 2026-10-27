import { expect, test } from "@playwright/test";

// 測試環境無法連線 Wikidata，以固定的 API 回應模擬
const fakeResponse = {
  source: "wikidata",
  query: { lat: 0, lon: 0, year: 1500, radiusKm: 300, windowYears: 25 },
  events: [
    {
      id: "wikidata:Q1",
      title: "測試事件甲",
      summary: "測試用簡述",
      period: { start: { earliest: 1498, latest: 1498, precision: 11, qualifier: "exact", calendar: "gregorian", month: 5, day: 20 }, end: null },
      location: { lat: 0, lon: 0 },
      locationLabel: "測試地點",
      locationPrecision: "approximate",
      category: "other",
      wikidataQid: "Q1",
      wikipedia: { zh: "測試", en: null },
      sources: [{ title: "Wikidata Q1", url: "https://www.wikidata.org/wiki/Q1", supports: "overall" }],
      isDemo: false,
      reviewStatus: "unreviewed",
      distanceKm: 12.3,
      sitelinks: 5,
    },
  ],
};

test("點擊地球後列出附近事件，可開啟事件卡片再返回", async ({ page }, info) => {
  const requests: string[] = [];
  await page.route("**/api/events/nearby**", (route) => {
    requests.push(route.request().url());
    return route.fulfill({ json: fakeResponse });
  });
  await page.goto("/");
  const canvas = page.getByTestId("globe-canvas").locator("canvas");
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  const box = (await canvas.boundingBox())!;
  const c = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  if (info.project.name === "mobile") await page.touchscreen.tap(c.x, c.y);
  else await page.mouse.click(c.x, c.y);

  const item = page.getByTestId("nearby-event").first();
  await expect(item).toContainText("測試事件甲");
  await expect(page.getByTestId("nearby-events")).toContainText("Wikidata");
  expect(requests[0]).toMatch(/lat=-?[\d.]+&lon=-?[\d.]+&year=-?\d+/);

  await item.click();
  await expect(page.getByTestId("event-title")).toHaveText("測試事件甲");
  await expect(page.getByTestId("event-unreviewed-note")).toBeVisible();
  await page.screenshot({ path: `test-results/nearby-${info.project.name}-card.png` });
  await page.getByRole("button", { name: /回到事件清單/ }).click();
  await expect(page.getByTestId("nearby-event").first()).toBeVisible();
});

test("查詢失敗時顯示錯誤訊息", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "僅桌面");
  await page.route("**/api/events/nearby**", (route) => route.fulfill({ status: 504, json: { error: "timeout" } }));
  await page.goto("/");
  const canvas = page.getByTestId("globe-canvas").locator("canvas");
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(2500);
  const box = (await canvas.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByTestId("nearby-events")).toContainText("暫時無法查詢");
});
