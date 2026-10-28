"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { PerspectiveCamera } from "three";
import { fovForAspect } from "./initialView";

/** 視窗變高時加大視野角度，讓地球大小維持不變（見 fovForAspect）。 */
export function KeepGlobeSize() {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const initialAspect = useRef<number | null>(null);

  useEffect(() => {
    if (size.width === 0 || size.height === 0) return;
    const aspect = size.width / size.height;
    initialAspect.current ??= aspect;
    const camera = get().camera as PerspectiveCamera;
    camera.fov = fovForAspect(initialAspect.current, aspect);
    camera.updateProjectionMatrix();
    invalidate();
  }, [get, size.width, size.height, invalidate]);

  return null;
}
