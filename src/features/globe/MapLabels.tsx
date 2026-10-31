"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Matrix4, Vector3 } from "three";
import { cameraDistance, isFlatProjection, latLonToVector3 } from "@/lib/geo/sphere";
import {
  CULTURE_ANCHOR_PX,
  isCandidateAtZoom,
  placeLabels,
  zoomForDistance,
  type LabelCandidate,
  type LabelKind,
  type Rect,
} from "@/lib/map/labels";
import type { ArchaeologicalCulture, MapLabel, MapLabelData } from "@/types/geo";

interface MapLabelsProps {
  /** 現代國名、行政區名、海洋名；關閉「國名與行政區」時為 null */
  data: MapLabelData | null;
  /** 選取年份存在的考古文化（可點選） */
  cultures: ArchaeologicalCulture[];
  onSelectCulture: (id: string) => void;
  /** 疊在畫布上方的 HTML 容器，標籤畫在這裡（中文字由瀏覽器排版，清楚又省記憶體） */
  container: RefObject<HTMLDivElement | null>;
  tone: "dark" | "light";
}

function toCandidates(list: MapLabel[], kind: LabelKind): LabelCandidate[] {
  const v = new Vector3();
  return list.map((l) => {
    latLonToVector3(l.lat, l.lon, 1, v);
    return { ...l, kind, x: v.x, y: v.y, z: v.z };
  });
}

/**
 * 考古文化、國名、行政區名、海洋名。每次相機移動後重新計算：
 * 只顯示朝向自己的半球、依縮放程度決定顯示哪些，並避開彼此重疊。
 */
export function MapLabels({ data, cultures, onSelectCulture, container, tone }: MapLabelsProps) {
  const { camera, size, invalidate } = useThree();
  // 優先順序：考古文化 → 海洋 → 國家 → 行政區（各自依 Natural Earth 建議的顯示等級排序）
  const baseCandidates = useMemo(
    () =>
      data
        ? [...toCandidates(data.marine, "marine"), ...toCandidates(data.countries, "country"), ...toCandidates(data.admin1, "admin1")]
        : [],
    [data],
  );
  const candidates = useMemo(() => {
    const cultureCandidates = toCandidates(
      cultures.map((c) => ({ name: c.name, lat: c.lat, lon: c.lon, minZoom: 0 })),
      "culture",
    ).map((c, i) => ({ ...c, id: cultures[i].id }));
    return [...cultureCandidates, ...baseCandidates];
  }, [baseCandidates, cultures]);
  const pool = useRef<HTMLSpanElement[]>([]);
  const lastMatrix = useRef(new Matrix4());
  const dirty = useRef(true);

  useEffect(() => {
    dirty.current = true;
    invalidate();
  }, [candidates, size, tone, invalidate]);

  // 考古文化標籤可點選（滑鼠、觸控或鍵盤 Enter／空白鍵）
  const onSelect = useRef(onSelectCulture);
  useEffect(() => {
    onSelect.current = onSelectCulture;
  }, [onSelectCulture]);
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const pick = (e: Event) => {
      const id = (e.target as HTMLElement).closest<HTMLElement>("[data-culture-id]")?.dataset.cultureId;
      if (!id) return;
      if (e instanceof KeyboardEvent && e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      onSelect.current(id);
    };
    root.addEventListener("click", pick);
    root.addEventListener("keydown", pick);
    return () => {
      root.removeEventListener("click", pick);
      root.removeEventListener("keydown", pick);
    };
  }, [container]);

  useEffect(() => {
    const root = container.current;
    const spans = pool.current;
    return () => {
      spans.forEach((s) => s.remove());
      spans.length = 0;
      if (root) root.replaceChildren();
    };
  }, [container]);

  const projected = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const root = container.current;
    if (!root) return;
    camera.updateMatrixWorld();
    if (!dirty.current && lastMatrix.current.equals(camera.matrixWorld)) return;
    lastMatrix.current.copy(camera.matrixWorld);
    dirty.current = false;

    // 標題、圖層開關、時間軸等面板蓋住的地方不放標籤
    const origin = root.getBoundingClientRect();
    const blocked: Rect[] = [];
    document.querySelectorAll("[data-label-avoid]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) {
        blocked.push({
          x0: r.left - origin.left,
          y0: r.top - origin.top,
          x1: r.right - origin.left,
          y1: r.bottom - origin.top,
        });
      }
    });

    const zoom = zoomForDistance(cameraDistance(camera.position));
    const visible = candidates.filter((c) => isCandidateAtZoom(c.kind, c.minZoom, zoom));
    const placed = placeLabels(visible, {
      camera: camera.position,
      flat: isFlatProjection(),
      width: size.width,
      height: size.height,
      blocked,
      project: (c) => {
        projected.set(c.x, c.y, c.z).project(camera);
        if (projected.z > 1) return null;
        return { sx: ((projected.x + 1) / 2) * size.width, sy: ((1 - projected.y) / 2) * size.height };
      },
    });

    const spans = pool.current;
    while (spans.length < placed.length) {
      const span = document.createElement("span");
      span.className = "map-label";
      root.appendChild(span);
      spans.push(span);
    }
    placed.forEach((p, i) => {
      const span = spans[i];
      if (span.textContent !== p.candidate.name) span.textContent = p.candidate.name;
      span.dataset.kind = p.candidate.kind;
      span.dataset.tone = tone;
      if (p.candidate.kind === "culture" && p.candidate.id) {
        span.dataset.cultureId = p.candidate.id;
        span.setAttribute("role", "button");
        span.tabIndex = 0;
        span.removeAttribute("aria-hidden");
      } else {
        delete span.dataset.cultureId;
        span.removeAttribute("role");
        span.removeAttribute("tabindex");
        span.setAttribute("aria-hidden", "true");
      }
      span.style.transform =
        p.candidate.kind === "culture"
          ? `translate(${(p.sx - CULTURE_ANCHOR_PX).toFixed(1)}px, ${p.sy.toFixed(1)}px) translateY(-50%)`
          : `translate(${p.sx.toFixed(1)}px, ${p.sy.toFixed(1)}px) translate(-50%, -50%)`;
      span.style.opacity = p.opacity.toFixed(2);
      span.hidden = false;
    });
    for (let i = placed.length; i < spans.length; i++) spans[i].hidden = true;
  });

  return null;
}
