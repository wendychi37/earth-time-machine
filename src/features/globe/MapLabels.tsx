"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Matrix4, Vector3 } from "three";
import { latLonToVector3 } from "@/lib/geo/sphere";
import {
  isCandidateAtZoom,
  placeLabels,
  zoomForDistance,
  type LabelCandidate,
  type LabelKind,
  type Rect,
} from "@/lib/map/labels";
import type { MapLabel, MapLabelData } from "@/types/geo";

interface MapLabelsProps {
  data: MapLabelData;
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
 * 國名、行政區名、海洋名。每次相機移動後重新計算：
 * 只顯示朝向自己的半球、依縮放程度決定顯示哪些，並避開彼此重疊。
 */
export function MapLabels({ data, container, tone }: MapLabelsProps) {
  const { camera, size, invalidate } = useThree();
  // 優先順序：海洋 → 國家 → 行政區（各自依 Natural Earth 建議的顯示等級排序）
  const candidates = useMemo(
    () => [...toCandidates(data.marine, "marine"), ...toCandidates(data.countries, "country"), ...toCandidates(data.admin1, "admin1")],
    [data],
  );
  const pool = useRef<HTMLSpanElement[]>([]);
  const lastMatrix = useRef(new Matrix4());
  const dirty = useRef(true);

  useEffect(() => {
    dirty.current = true;
    invalidate();
  }, [candidates, size, tone, invalidate]);

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
        blocked.push({ x0: r.left - origin.left, y0: r.top - origin.top, x1: r.right - origin.left, y1: r.bottom - origin.top });
      }
    });

    const zoom = zoomForDistance(camera.position.length());
    const visible = candidates.filter((c) => isCandidateAtZoom(c.kind, c.minZoom, zoom));
    const placed = placeLabels(visible, {
      camera: camera.position,
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
      span.style.transform = `translate(${p.sx.toFixed(1)}px, ${p.sy.toFixed(1)}px) translate(-50%, -50%)`;
      span.style.opacity = p.opacity.toFixed(2);
      span.hidden = false;
    });
    for (let i = placed.length; i < spans.length; i++) spans[i].hidden = true;
  });

  return null;
}
