import { expect, test, type Page } from "@playwright/test";

async function goToYear(page: Page, text: string) {
  await page.getByTestId("year-input").fill(text);
  await page.getByTestId("year-input").press("Enter");
}

test("「同一時期的世界」依大洲並列年表大事，點一條開啟卡片", async ({ page }, info) => {
  await page.goto("/");
  await goToYear(page, "1453");
  const panel = page.getByTestId("same-era-panel");
  // 手機預設收起，以免擋住地球
  if (info.project.name === "mobile") {
    await expect(panel).toBeHidden();
    await page.getByTestId("same-era-open").click();
  }
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("同一時期的世界");
  await expect(panel).toContainText("西元 1403 年～西元 1503 年");

  if (info.project.name === "desktop") {
    const columns = page.getByTestId("same-era-columns");
    for (const name of ["亞洲", "歐洲", "非洲", "美洲", "大洋洲"]) await expect(columns).toContainText(name);
    await columns.getByRole("button", { name: /君士坦丁堡/ }).click();
  } else {
    await panel.getByRole("tab", { name: /歐洲/ }).click();
    await panel.getByRole("tabpanel").getByRole("button", { name: /君士坦丁堡/ }).click();
  }
  const card = page.getByTestId("event-card");
  await expect(card).toBeVisible();
  await expect(page.getByTestId("event-title")).toContainText("君士坦丁堡");
  await page.screenshot({ path: `test-results/same-era-${info.project.name}.png` });

  // 年份改變，表格內容跟著換
  await card.getByRole("button", { name: "關閉" }).click();
  await goToYear(page, "前221");
  await expect(panel).toContainText(/秦/);
});

test("對照表可以收起再打開", async ({ page }, info) => {
  await page.goto("/");
  const panel = page.getByTestId("same-era-panel");
  if (info.project.name === "mobile") await page.getByTestId("same-era-open").click();
  await panel.getByRole("button", { name: "收起" }).click();
  await expect(panel).toBeHidden();
  await page.getByTestId("same-era-open").click();
  await expect(page.getByTestId("same-era-panel")).toBeVisible();
});
