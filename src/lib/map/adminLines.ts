import type { AdminLineData } from "@/types/geo";
import { latLonToVector3 } from "@/lib/geo/sphere";
import { Vector3 } from "three";

/** 解開差值編碼的行政區界線，轉成 LineSegments 用的頂點陣列。 */
export function adminLinePositions(data: AdminLineData, radius = 1.0015): Float32Array {
  let segments = 0;
  for (const line of data.lines) segments += line.length / 2 - 1;
  const out = new Float32Array(segments * 6);
  const a = new Vector3();
  const b = new Vector3();
  let o = 0;
  for (const line of data.lines) {
    let x = line[0];
    let y = line[1];
    latLonToVector3(y / data.precision, x / data.precision, radius, a);
    for (let i = 2; i < line.length; i += 2) {
      x += line[i];
      y += line[i + 1];
      latLonToVector3(y / data.precision, x / data.precision, radius, b);
      out[o++] = a.x;
      out[o++] = a.y;
      out[o++] = a.z;
      out[o++] = b.x;
      out[o++] = b.y;
      out[o++] = b.z;
      a.copy(b);
    }
  }
  return out;
}
