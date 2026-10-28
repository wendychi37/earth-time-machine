export const FOV = 45;
/** 初始視角：東亞上空 */
export const INITIAL_VIEW = { lat: 22, lon: 112 };

/**
 * 依地球視窗的長寬比決定相機初始距離：直式（窄）的視窗拉遠，讓整顆地球放得進寬度；
 * 橫式（寬）的視窗則讓地球大約塞滿高度。
 */
export function initialDistance(aspect: number): number {
  const fitWidth = 1 / (0.9 * Math.tan((FOV / 2) * (Math.PI / 180)) * aspect);
  return Math.min(5, Math.max(2.7, fitWidth));
}

/**
 * 視窗大小改變（例如手機切換分頁、收起下方面板）時的視野角度：保持水平視野不變，
 * 地球在畫面上的大小就跟著寬度走，不會因為視窗變高變矮而忽大忽小。
 */
export function fovForAspect(initialAspect: number, aspect: number): number {
  const half = Math.atan((Math.tan((FOV / 2) * (Math.PI / 180)) * initialAspect) / aspect);
  return Math.min(90, Math.max(20, (2 * half * 180) / Math.PI));
}
