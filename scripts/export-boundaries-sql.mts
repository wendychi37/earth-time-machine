/**
 * 將 public/data/boundaries 的快照匯出為 SQL，可用 psql 匯入資料庫：
 *   node scripts/export-boundaries-sql.mts && psql "$DATABASE_URL" -f data/raw/boundaries.sql
 * 只匯出有名稱的區域；未標示政權的區域不建立疆域紀錄。
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, Geometry, MultiPolygon } from "geojson";
import { lit } from "./sql.mts";

interface Props {
  id: string;
  name: string | null;
  subjecto: string | null;
  borderPrecision: number | null;
  confidence: number;
}

const index = JSON.parse(await readFile("public/data/boundaries/index.json", "utf8"));
const out: string[] = ["-- 由 scripts/export-boundaries-sql.mts 產生", "begin;"];
out.push(`delete from public.historical_boundaries where source_id = ${lit(index.source.id)};`);
let count = 0;

const toMulti = (g: Geometry): MultiPolygon | null =>
  g.type === "MultiPolygon" ? g : g.type === "Polygon" ? { type: "MultiPolygon", coordinates: [g.coordinates] } : null;

for (const snap of index.snapshots) {
  const topo = JSON.parse(await readFile(`public/data/boundaries/${snap.file}`, "utf8")) as Topology<{
    regions: GeometryCollection<Props>;
  }>;
  const features = feature(topo, topo.objects.regions).features as Feature<Geometry, Props>[];
  for (const f of features) {
    const geom = f.geometry && toMulti(f.geometry);
    if (!f.properties.name || !geom) continue;
    out.push(
      "insert into public.historical_boundaries (id, geom, snapshot_year, confidence, border_precision, control_type, name_in_source, subject_to, source_id, source_feature_ref, license) values (" +
        [
          lit(f.properties.id),
          `extensions.st_multi(extensions.st_collectionextract(extensions.st_makevalid(extensions.st_setsrid(extensions.st_geomfromgeojson(${lit(JSON.stringify(geom))}), 4326)), 3))::extensions.geometry(MultiPolygon, 4326)`,
          lit(snap.year),
          lit(f.properties.confidence),
          lit(f.properties.borderPrecision),
          lit("unknown"),
          lit(f.properties.name),
          lit(f.properties.subjecto),
          lit(index.source.id),
          lit(snap.file),
          lit(index.source.license),
        ].join(", ") +
        ");",
    );
    count++;
  }
}
out.push("commit;");
await mkdir("data/raw", { recursive: true });
await writeFile("data/raw/boundaries.sql", out.join("\n"));
console.log(`已寫入 data/raw/boundaries.sql（${count} 筆疆域）`);
