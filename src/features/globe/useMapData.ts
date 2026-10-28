"use client";

import { useEffect, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { AdminLineData, CultureData, MapCountry, MapCountryProps, MapLabelData } from "@/types/geo";

/** 同一路徑只下載一次；失敗時移除快取以便下次重試 */
const cache = new Map<string, Promise<unknown>>();
function load<T>(path: string, parse: (json: unknown) => T = (j) => j as T): Promise<T> {
  let p = cache.get(path) as Promise<T> | undefined;
  if (!p) {
    p = fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`無法載入 ${path}（${res.status}）`);
        return res.json();
      })
      .then(parse)
      .catch((err) => {
        cache.delete(path);
        throw err;
      });
    cache.set(path, p);
  }
  return p;
}

const loaders = {
  countries: () =>
    load("/data/modern/ne_50m_admin0_map.topojson", (json) => {
      const topo = json as Topology<{ countries: GeometryCollection<MapCountryProps> }>;
      return feature(topo, topo.objects.countries).features as MapCountry[];
    }),
  labels: () => load<MapLabelData>("/data/modern/map-labels.json"),
  adminLines: () => load<AdminLineData>("/data/modern/ne_10m_admin1_lines.json"),
  cultures: () => load<CultureData>("/data/archaeology/cultures.json"),
};

/** 載入地圖模式用的現代資料；enabled 為 false 時不下載。 */
function useLoaded<K extends keyof typeof loaders>(key: K, enabled = true) {
  type T = Awaited<ReturnType<(typeof loaders)[K]>>;
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (loaders[key]() as Promise<T>).then((d) => !cancelled && setData(d)).catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [key, enabled]);
  return data;
}

export const useMapCountries = (enabled = true) => useLoaded("countries", enabled);
export const useMapLabels = (enabled = true) => useLoaded("labels", enabled);
export const useAdminLines = (enabled = true) => useLoaded("adminLines", enabled);
export const useCultures = (enabled = true) => useLoaded("cultures", enabled);
