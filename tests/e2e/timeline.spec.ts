import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("current-year")).toHaveText(/西元 1500 年/);
});

test("拖曳時間軸改變年份，可拖到西元前", async ({ page }, info) => {
  const track = page.getByTestId("timeline-track");
  const box = await track.boundingBox();
  if (!box) throw new Error("找不到時間軸");
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.76, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.1, y, { steps: 15 });
  await page.mouse.up();
  await expect(page.getByTestId("current-year")).toContainText("西元前");
  await page.screenshot({ path: `test-results/timeline-${info.project.name}-bce.png` });

  // 版面可能因圖例變化而移動，重新取得位置
  const after = await track.boundingBox();
  if (!after) throw new Error("找不到時間軸");
  await page.mouse.click(after.x + after.width - 1, after.y + after.height / 2);
  await expect(page.getByTestId("current-year")).toHaveText(/西元 20\d\d 年/);
});

test("輸入年份：西元前 221", async ({ page }) => {
  await page.getByTestId("year-input").fill("西元前221");
  await page.getByTestId("year-input").press("Enter");
  await expect(page.getByTestId("current-year")).toHaveText(/西元前 221 年/);
  await expect(page.getByTestId("timeline-thumb")).toHaveAttribute("aria-valuenow", "-220");
});

test("輸入無效年份顯示錯誤", async ({ page }) => {
  await page.getByTestId("year-input").fill("西元0年");
  await page.getByTestId("year-input").press("Enter");
  await expect(page.getByTestId("year-error")).toContainText("沒有西元 0 年");
  await page.getByTestId("year-input").fill("前5000");
  await page.getByTestId("year-input").press("Enter");
  await expect(page.getByTestId("year-error")).toContainText("西元前 3000 年");
});

test("鍵盤操作：西元 1 年往前一年是西元前 1 年", async ({ page }) => {
  await page.getByTestId("year-input").fill("1");
  await page.getByTestId("year-input").press("Enter");
  await page.getByTestId("timeline-thumb").focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByTestId("current-year")).toHaveText(/西元前 1 年/);
  await page.keyboard.press("Shift+ArrowRight"); // 西元前 1 年 + 10 年 = 西元 10 年（沒有 0 年）
  await expect(page.getByTestId("current-year")).toHaveText(/西元 10 年/);
});
