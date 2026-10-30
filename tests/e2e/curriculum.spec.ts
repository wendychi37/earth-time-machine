import { expect, test } from "@playwright/test";
import { goToYear, openTab } from "./helpers";

test("「重點」分頁：大時代、基本架構、四門課章節與重點事件", async ({ page }, info) => {
  await page.goto("/");
  await goToYear(page, "1624");
  await expect(page.getByTestId("current-period")).toHaveText("近代早期世界");
  await expect(page.getByTestId("period-band-early-modern")).toHaveAttribute("aria-current", "true");

  await openTab(page, "focus");
  const panel = page.getByTestId("focus-panel");
  await expect(page.getByTestId("focus-period")).toHaveText("近代早期世界");
  await expect(page.getByTestId("focus-themes")).toContainText("宗教改革");
  await expect(page.getByTestId("focus-course-tw")).toContainText("L3【大航海與荷治時期】");
  await expect(page.getByTestId("focus-course-tw")).toContainText("荷西");
  await expect(page.getByTestId("focus-course-cn")).toContainText("L10【明與海洋選擇】");
  await expect(page.getByTestId("focus-course-ea")).toContainText("L8【全球貿易與海上帝國】");
  await expect(page.getByTestId("focus-course-world")).toContainText("三十年戰爭");

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

test("四門課章節：時間軸章節列、地球上的章節標籤，點章節跳到那一章", async ({ page }, info) => {
  await page.goto("/");
  await goToYear(page, "1684");
  await expect(page.getByTestId("course-lane-tw").locator("[aria-current=true]")).toHaveAttribute("aria-label", /臺灣史 L5/);
  await expect(page.getByTestId("chapter-tag").filter({ hasText: "臺灣史 L5" })).toHaveCount(1);
  await expect(page.getByTestId("chapter-tag").filter({ hasText: "世界史 L8" })).toHaveCount(1);

  await openTab(page, "focus");
  await page.getByTestId("focus-course-tw").getByTestId("focus-chapter").click();
  await expect(page.getByTestId("current-year")).toContainText("1684");
  await page.screenshot({ path: `test-results/courses-${info.project.name}.png` });

  // 時代重點：年表新增的事件註明出自四門課複習年表
  await goToYear(page, "2014");
  await openTab(page, "focus");
  await page.getByTestId("focus-key-events").getByRole("button", { name: /太陽花運動/ }).click();
  await expect(page.getByTestId("key-chapter")).toContainText("臺灣史 L11【1991以後的自由臺灣】");
  await expect(page.getByTestId("event-card")).toContainText("四門課複習年表");
});

test("關掉「課綱重點」圖層：時間軸色帶與時代名稱不顯示", async ({ page }) => {
  await page.goto("/");
  await openTab(page, "layers");
  await page.getByRole("checkbox", { name: /課綱重點/ }).uncheck();
  await openTab(page, "time");
  await expect(page.getByTestId("period-bands")).toHaveCount(0);
  await expect(page.getByTestId("course-lanes")).toHaveCount(0);
  await expect(page.getByTestId("chapter-tag")).toHaveCount(0);
  await expect(page.getByTestId("current-period")).toHaveCount(0);
});
