import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { BoundaryFeature, BoundaryIndex, BoundaryProps } from "@/types/boundary";
import type { ModernCountry, ModernCountryProps } from "@/types/geo";
import { unpackChronology, type CompactChronology } from "@/lib/chronology/compact";
import type { Repository } from "./repository";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`無法載入 ${path}（${res.status}）`);
  return (await res.json()) as T;
}

/** 同一路徑只下載與解析一次；失敗時移除快取以便重試 */
const cache = new Map<string, Promise<unknown>>();
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  let p = cache.get(key) as Promise<T> | undefined;
  if (!p) {
    p = load().catch((err) => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, p);
  }
  return p;
}

export const staticRepository: Repository = {
  getModernCountries() {
    const path = "/data/modern/ne_110m_admin0.topojson";
    return cached(path, async () => {
      const topo = await fetchJson<Topology<{ countries: GeometryCollection<ModernCountryProps> }>>(path);
      return feature(topo, topo.objects.countries).features as ModernCountry[];
    });
  },

  getBoundaryIndex() {
    const path = "/data/boundaries/index.json";
    return cached(path, () => fetchJson<BoundaryIndex>(path));
  },

  getBoundarySnapshot(snapshot) {
    const path = `/data/boundaries/${snapshot.file}`;
    return cached(path, async () => {
      const topo = await fetchJson<Topology<{ regions: GeometryCollection<BoundaryProps> }>>(path);
      return feature(topo, topo.objects.regions).features as BoundaryFeature[];
    });
  },

  getEvents() {
    // 〈世界史年表〉與各國歷史年表（取自維基百科，見 scripts/build-world-chronology.mts）；示範事件只保留給 Supabase seed 與測試
    const world = "/data/chronology/world-chronology.json";
    const countries = "/data/chronology/country-chronologies.json";
    return cached("events", async () => {
      const [a, b] = await Promise.all([
        fetchJson<CompactChronology>(world).then(unpackChronology),
        fetchJson<CompactChronology>(countries).then(unpackChronology, () => []),
      ]);
      return [...a, ...b];
    });
  },
};
