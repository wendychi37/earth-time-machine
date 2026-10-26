import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { ModernCountry, ModernCountryProps } from "@/types/geo";
import type { Repository } from "./repository";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`無法載入 ${path}（${res.status}）`);
  return (await res.json()) as T;
}

let modernCache: Promise<ModernCountry[]> | null = null;

export const staticRepository: Repository = {
  getModernCountries() {
    modernCache ??= fetchJson<Topology<{ countries: GeometryCollection<ModernCountryProps> }>>(
      "/data/modern/ne_110m_admin0.topojson",
    ).then((topo) => feature(topo, topo.objects.countries).features as ModernCountry[]);
    return modernCache;
  },
};
