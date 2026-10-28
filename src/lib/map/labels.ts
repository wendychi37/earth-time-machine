import type { MapLabel } from "@/types/geo";

export type LabelKind = "country" | "admin1" | "marine" | "culture";

export interface LabelCandidate extends MapLabel {
  kind: LabelKind;
  /** 可點選的標籤（考古文化）對應的資料 id */
  id?: string;
  /** 單位球面上的位置 */
  x: number;
  y: number;
  z: number;
}

export interface PlacedLabel {
  candidate: LabelCandidate;
  /** 螢幕座標（CSS 像素，標籤中心） */
  sx: number;
  sy: number;
  /** 接近地平線時淡出，0～1 */
  opacity: number;
}

/**
 * 相機距離（地球半徑 = 1）換算成約略的網頁地圖縮放等級，
 * 好沿用 Natural Earth 的 min_label 判斷何時該出現。
 * 整顆地球（距離約 3.2）≈ 2；最近（1.12）≈ 6.2。
 */
export function zoomForDistance(distance: number): number {
  return 2 + Math.log2(2.2 / Math.max(0.01, distance - 1));
}

/** 各種標籤在此縮放等級是否該列入候選。 */
export function isCandidateAtZoom(kind: LabelKind, minZoom: number, zoom: number): boolean {
  switch (kind) {
    case "culture":
      // 考古文化依年份篩選，不論遠近都顯示
      return true;
    case "marine":
      return minZoom <= zoom + 1;
    case "country":
      // 小國（例如臺灣 4.5）看整顆地球時也列入候選，有空位就顯示
      return minZoom <= zoom + 2.5;
    case "admin1":
      return zoom >= 3.2 && minZoom <= zoom + 2.5;
  }
}

/** 考古文化標籤左側圓點的中心，距離標籤左緣的像素 */
export const CULTURE_ANCHOR_PX = 10;

export const LABEL_FONT_PX: Record<LabelKind, number> = { country: 14, admin1: 11, marine: 12, culture: 13 };

/** 估計標籤寬高（中文字約等寬），用來避免文字重疊。 */
export function labelSize(name: string, kind: LabelKind): { w: number; h: number } {
  const font = LABEL_FONT_PX[kind];
  let units = 0;
  for (const ch of name) units += /[\u0000-ÿ]/.test(ch) ? 0.6 : 1;
  // 考古文化標籤有左右內距與圓點
  return { w: units * font + (kind === "culture" ? 28 : 6), h: font * (kind === "culture" ? 1.8 : 1.35) };
}

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

const overlaps = (a: Rect, b: Rect) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

export interface PlaceOptions {
  /** 相機位置（地心座標） */
  camera: { x: number; y: number; z: number };
  width: number;
  height: number;
  /** 球面點 → 螢幕座標（CSS 像素）；在畫面外回傳 null */
  project: (c: LabelCandidate) => { sx: number; sy: number } | null;
  maxLabels?: number;
  /** 被介面面板蓋住的區域，標籤不放在這裡 */
  blocked?: Rect[];
}

/**
 * 依優先順序（陣列順序）放置標籤：只放在朝向相機的半球、
 * 不超出畫面、且不和已放的標籤重疊。
 */
export function placeLabels(candidates: LabelCandidate[], opts: PlaceOptions): PlacedLabel[] {
  const { camera, width, height, project, maxLabels = 160, blocked = [] } = opts;
  const dist = Math.hypot(camera.x, camera.y, camera.z);
  const cx = camera.x / dist;
  const cy = camera.y / dist;
  const cz = camera.z / dist;
  // 單位球上的點 p 在 p·ĉ > 1/d 時才看得到（地平線）
  const horizon = 1 / dist;
  const placed: PlacedLabel[] = [];
  const rects: Rect[] = [...blocked];

  for (const c of candidates) {
    if (placed.length >= maxLabels) break;
    const facing = c.x * cx + c.y * cy + c.z * cz;
    if (facing < horizon + 0.04) continue;
    const p = project(c);
    if (!p) continue;
    const { w, h } = labelSize(c.name, c.kind);
    // 考古文化的圓點對準位置、文字往右延伸；其他標籤置中
    const x0 = c.kind === "culture" ? p.sx - CULTURE_ANCHOR_PX : p.sx - w / 2;
    const rect = { x0, y0: p.sy - h / 2, x1: x0 + w, y1: p.sy + h / 2 };
    if (rect.x0 < 0 || rect.y0 < 0 || rect.x1 > width || rect.y1 > height) continue;
    if (rects.some((r) => overlaps(r, rect))) continue;
    rects.push(rect);
    placed.push({ candidate: c, sx: p.sx, sy: p.sy, opacity: Math.min(1, (facing - horizon - 0.04) / 0.12) });
  }
  return placed;
}

/** 選取年份時存在的考古文化 */
export function culturesAtYear<T extends { start: number; end: number }>(cultures: T[], year: number): T[] {
  return cultures.filter((c) => c.start <= year && year <= c.end);
}
