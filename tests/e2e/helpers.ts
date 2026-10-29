import type { Page, TestInfo } from "@playwright/test";
import { PerspectiveCamera } from "three";
import { FOV, INITIAL_VIEW, initialDistance } from "../../src/features/globe/initialView";
import { latLonToVector3 } from "../../src/lib/geo/sphere";

type Tab = "time" | "sameEra" | "layers" | "details";

/** 切到某個分頁（已經在顯示就不再點，避免手機上再點一次把面板收起） */
export async function openTab(page: Page, tab: Tab) {
  if (await page.locator(`#panel-${tab}`).isVisible()) return;
  await page.getByTestId(`panel-tab-${tab}`).click();
}

/** 用年份輸入框跳到某一年（手機的輸入框在「年份」分頁） */
export async function goToYear(page: Page, text: string) {
  const input = page.getByTestId("year-input");
  if (!(await input.isVisible())) await openTab(page, "time");
  await input.fill(text);
  await input.press("Enter");
}

/** 以與 GlobeCanvas 相同的初始相機設定，算出某經緯度在地球畫布上的位置（畫布左上角為原點） */
export function projectInitialView(lat: number, lon: number, width: number, height: number) {
  const aspect = width / height;
  const camera = new PerspectiveCamera(FOV, aspect, 0.01, 100);
  camera.position.copy(latLonToVector3(INITIAL_VIEW.lat, INITIAL_VIEW.lon, initialDistance(aspect)));
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const p = latLonToVector3(lat, lon, 1.006).project(camera);
  return { x: ((p.x + 1) / 2) * width, y: ((1 - p.y) / 2) * height };
}

/** 點地球上的某個經緯度（初始視角；手機用觸控） */
export async function tapGlobe(page: Page, info: TestInfo, lat: number, lon: number) {
  const box = await page.getByTestId("globe-canvas").locator("canvas").boundingBox();
  if (!box) throw new Error("找不到地球畫布");
  const p = projectInitialView(lat, lon, box.width, box.height);
  const x = box.x + p.x;
  const y = box.y + p.y;
  if (info.project.name === "mobile") await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}
