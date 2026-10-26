import { messages } from "@/messages/zh-Hant";
import type { LatLon } from "./sphere";

/** 例：{ lat: 25.03, lon: 121.56 } → 「北緯 25.03°、東經 121.56°」 */
export function formatLatLon({ lat, lon }: LatLon, digits = 2): string {
  const { north, south, east, west } = messages.coords;
  const ns = `${lat >= 0 ? north : south} ${Math.abs(lat).toFixed(digits)}°`;
  const ew = `${lon >= 0 ? east : west} ${Math.abs(lon).toFixed(digits)}°`;
  return `${ns}、${ew}`;
}
