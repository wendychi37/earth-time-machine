import { expect, test } from "@playwright/test";

/**
 * 迴歸測試：拖曳時間軸時不能一直建立新的 WebGL context。
 * Chrome 同時最多約 16 個 context，超過就會回收最舊的那個（也就是地球），畫面因此消失。
 */
test("拖曳時間軸多次後，地球的 WebGL 畫面仍在", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __webglContexts: number; __contextLost: number };
    w.__webglContexts = 0;
    w.__contextLost = 0;
    const original = HTMLCanvasElement.prototype.getContext;
    const seen = new WeakSet<HTMLCanvasElement>();
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      const ctx = (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
      if (ctx && type.startsWith("webgl") && !seen.has(this)) {
        seen.add(this);
        w.__webglContexts++;
        // 只計算頁面上的畫布；檢查支援度用的暫時畫布會被主動釋放
        this.addEventListener("webglcontextlost", () => {
          if (this.isConnected) w.__contextLost++;
        });
      }
      return ctx;
    } as typeof original;
  });

  await page.goto("/");
  await expect(page.getByTestId("globe-canvas").locator("canvas")).toBeVisible({ timeout: 30_000 });

  const track = page.getByTestId("timeline-track");
  const box = (await track.boundingBox())!;
  const y = box.y + box.height / 2;
  for (let round = 0; round < 3; round++) {
    await page.mouse.move(box.x + 5, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 5, y, { steps: 30 });
    await page.mouse.up();
  }

  const stats = await page.evaluate(() => {
    const w = window as unknown as { __webglContexts: number; __contextLost: number };
    return { __webglContexts: w.__webglContexts, __contextLost: w.__contextLost };
  });
  console.log("WebGL contexts:", stats);
  expect(stats.__contextLost).toBe(0);
  // 地球本身 1 個；檢查瀏覽器是否支援 WebGL 最多再用 1 個
  expect(stats.__webglContexts).toBeLessThanOrEqual(2);
  await expect(page.getByTestId("globe-canvas").locator("canvas")).toBeVisible();
});

test("WebGL 畫面被瀏覽器回收時，地球會自動重新載入", async ({ page }) => {
  await page.goto("/");
  const canvas = page.getByTestId("globe-canvas").locator("canvas");
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  // 模擬顯示卡重置
  await canvas.evaluate((el: HTMLCanvasElement) => {
    const gl = el.getContext("webgl2") ?? el.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.getByRole("status")).toContainText("正在重新載入");
  await expect(page.getByTestId("globe-canvas").locator("canvas")).toBeVisible({ timeout: 30_000 });
  const lost = await page
    .getByTestId("globe-canvas")
    .locator("canvas")
    .evaluate((el: HTMLCanvasElement) => (el.getContext("webgl2") ?? el.getContext("webgl"))?.isContextLost());
  expect(lost).toBe(false);
});
