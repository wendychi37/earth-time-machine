"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { isFlatProjection, latLonToFlat, latLonToVector3 } from "@/lib/geo/sphere";
import { useAppStore } from "@/store/useAppStore";

/** 轉過去要幾秒 */
const DURATION = 0.9;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * 點了重點事件或基本架構時，把地球轉到那個地點（距離不變，只換方向）。
 * 使用者自己拖曳時，OrbitControls 照常運作；轉動途中拖曳則以使用者為主。
 */
export function CameraFocus() {
  const target = useAppStore((s) => s.focusTarget);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as { target: Vector3; update: () => void } | null;
  const flatAnim = useRef<{ from: Vector3; to: Vector3; t: number } | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  const anim = useRef<{ from: Vector3; to: Vector3; t: number } | null>(null);

  useEffect(() => {
    if (!target) return;
    if (isFlatProjection()) {
      // 平面地圖：平移過去，高度不變
      flatAnim.current = {
        from: camera.position.clone().setZ(0),
        to: latLonToFlat(target.lat, target.lon, 1),
        t: 0,
      };
      invalidate();
      return;
    }
    anim.current = {
      from: camera.position.clone().normalize(),
      to: latLonToVector3(target.lat, target.lon, 1).normalize(),
      t: 0,
    };
    invalidate();
    // 只在 n 改變（新的一次點選）時開始
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.n]);

  useFrame((_, delta) => {
    const f = flatAnim.current;
    if (f) {
      f.t = Math.min(1, f.t + delta / DURATION);
      const p = f.from.clone().lerp(f.to, ease(f.t));
      camera.position.set(p.x, p.y, camera.position.z);
      controls?.target.set(p.x, p.y, 0);
      controls?.update();
      if (f.t >= 1) flatAnim.current = null;
      else invalidate();
      return;
    }
    const a = anim.current;
    if (!a) return;
    a.t = Math.min(1, a.t + delta / DURATION);
    const k = ease(a.t);
    const distance = camera.position.length();
    // 球面插值：沿著大圓轉過去
    const angle = a.from.angleTo(a.to);
    const dir =
      angle < 1e-6
        ? a.to.clone()
        : a.from
            .clone()
            .multiplyScalar(Math.sin((1 - k) * angle))
            .add(a.to.clone().multiplyScalar(Math.sin(k * angle)))
            .divideScalar(Math.sin(angle));
    camera.position.copy(dir.normalize().multiplyScalar(distance));
    camera.lookAt(0, 0, 0);
    if (a.t >= 1) anim.current = null;
    else invalidate();
  });

  return null;
}
