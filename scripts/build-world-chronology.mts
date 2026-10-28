/**
 * 由 data/chronology/raw.json（fetch-world-chronology.mjs 下載）產生 public/data/chronology/world-chronology.json。
 * 用法：npx tsx scripts/build-world-chronology.mts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { buildChronology, type RawChronology } from "../src/lib/chronology/build";
import { makeCountryLocator } from "../src/lib/chronology/country";
import type { ModernCountry, ModernCountryProps } from "../src/types/geo";

const raw = JSON.parse(readFileSync("data/chronology/raw.json", "utf8")) as RawChronology;
const topo = JSON.parse(readFileSync("public/data/modern/ne_110m_admin0.topojson", "utf8")) as Topology<{
  countries: GeometryCollection<ModernCountryProps>;
}>;
const countries = feature(topo, topo.objects.countries).features as ModernCountry[];
const { events, skipped } = buildChronology(raw, makeCountryLocator(countries));
const out = {
  notice: "內容取自中文維基百科〈世界史年表〉各頁（CC BY-SA 4.0），未經改寫；地點由原文連結的 Wikidata 條目推算。",
  source: raw.source,
  license: raw.license,
  fetchedAt: raw.fetchedAt,
  pages: raw.pages.map((p) => ({ title: p.title, displayTitle: p.displayTitle, revid: p.revid })),
  events,
};
writeFileSync("public/data/chronology/world-chronology.json", JSON.stringify(out) + "\n");
const located = events.filter((e) => e.location).length;
const withCountry = events.filter((e) => e.country).length;
console.log(`${events.length} 條事件（${located} 條可放上地球，${withCountry} 條對應到今日國家），略過 ${skipped.length} 條：`);
for (const s of skipped) console.log("  " + s);
