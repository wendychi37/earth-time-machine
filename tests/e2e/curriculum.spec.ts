import { expect, test } from "@playwright/test";
import { goToYear, openTab } from "./helpers";

test("「重點」分頁：大時代、基本架構、臺灣・中國・世界同一年與重點事件", async ({ page }, info) => {
  await page.goto("/");
  await goToYear(page, "1624");
  await expect(page.getByTestId("current-period")).toHaveText("近代早期世界");
  await expect(page.getByTestId("period-band-early-modern")).toHaveAttribute("aria-current", "true");

  await openTab(page, "focus");
  const panel = page.getByTestId("focus-panel");
  await expect(page.getByTestId("focus-period")).toHaveText("近代早期世界");
  await expect(page.getByTestId("focus-themes")).toContainText("宗教改革");
  const trio = page.getByTestId("focus-trio");
  await expect(trio).toContainText("荷西時期");
  await expect(trio).toContainText("明");
  await expect(trio).toContainText("三十年戰爭");

  // 點基本架構：只列出相關的重點事件，年份跳過去
  await page.getByTestId("focus-themes").getByRole("button", { name: "宗教改革" }).click();
  await expect(page.getByTestId("current-year")).toContainText("1517");
  await expect(page.getByTestId("focus-key-events")).toContainText("九十五條");
  await expect(page.getByTestId("focus-key-events")).not.toContainText("荷蘭統治臺灣");

  // 點重點事件：打開介紹卡，標示課綱重點與講義說明
  await page.getByTestId("focus-key-events").getByRole("button", { name: /九十五條/ }).click();
  await expect(page.getByTestId("key-badge")).toContainText("課綱重點");
  await page.screenshot({ path: `test-results/curriculum-${info.project.name}.png` });

  // 下一個時代
  await openTab(page, "focus");
  await panel.getByRole("button", { name: "下一個時代" }).click();
  await expect(page.getByTestId("focus-period")).toContainText("19 世紀");
});

test("關掉「課綱重點」圖層：時間軸色帶與時代名稱不顯示", async ({ page }) => {
  await page.goto("/");
  await openTab(page, "layers");
  await page.getByRole("checkbox", { name: /課綱重點/ }).uncheck();
  await openTab(page, "time");
  await expect(page.getByTestId("period-bands")).toHaveCount(0);
  await expect(page.getByTestId("current-period")).toHaveCount(0);
});
