import { getSupabase } from "@/lib/supabase/client";
import type { BoundaryIndex } from "@/types/boundary";
import type { Repository } from "./repository";
import { staticRepository } from "./staticRepository";
import { toBoundaryFeature, toHistoricalEvent, type BoundaryRow, type EventRow } from "./supabaseMappers";

const BOUNDARY_SOURCE_ID = "historical-basemaps";
/** PostgREST 預設每次最多回傳 1000 列 */
const PAGE_SIZE = 1000;
/** 涵蓋大爆炸至今的年份範圍 */
const ALL_TIME: [number, number] = [-1e11, 1e11];

async function rpcAll<T>(fn: string, args: Record<string, unknown>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await getSupabase()
      .rpc(fn, args)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${fn} 查詢失敗：${error.message}`);
    rows.push(...(data as T[]));
    if ((data as T[]).length < PAGE_SIZE) return rows;
  }
}

/**
 * Supabase 版本的資料存取。現代國界為固定的參考檔，仍由靜態檔案提供。
 * 疆域需先以 scripts/export-boundaries-sql.mts 匯入資料庫。
 */
export const supabaseRepository: Repository = {
  getModernCountries: () => staticRepository.getModernCountries(),

  async getBoundaryIndex(): Promise<BoundaryIndex> {
    const supabase = getSupabase();
    const [source, snapshots] = await Promise.all([
      supabase.from("data_sources").select("*").eq("id", BOUNDARY_SOURCE_ID).single(),
      rpcAll<{ source_id: string; snapshot_year: number; feature_count: number }>("get_boundary_snapshots", {}),
    ]);
    if (source.error) throw new Error(`讀取來源失敗：${source.error.message}`);
    const s = source.data;
    return {
      source: {
        id: s.id,
        title: s.title,
        author: s.author ?? "",
        url: s.url ?? "",
        license: s.license,
        version: s.version ?? "",
        retrievedAt: s.retrieved_at ?? "",
        note: s.note ?? "",
      },
      snapshots: snapshots
        .filter((r) => r.source_id === BOUNDARY_SOURCE_ID)
        .map((r) => ({ year: r.snapshot_year, sourceLabel: r.snapshot_year, file: `db:${r.snapshot_year}`, featureCount: r.feature_count })),
    };
  },

  async getBoundarySnapshot(snapshot) {
    const rows = await rpcAll<BoundaryRow>("get_boundaries_at", { p_year: snapshot.year, p_tolerance: 0 });
    return rows.map(toBoundaryFeature);
  },

  async getEvents() {
    const rows = await rpcAll<EventRow>("get_events_between", { p_from: ALL_TIME[0], p_to: ALL_TIME[1] });
    return rows.map(toHistoricalEvent);
  },
};
