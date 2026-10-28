/**
 * 由 data/chronology/raw.json（fetch-world-chronology.mjs 下載）產生 public/data/chronology/world-chronology.json。
 * 用法：npx tsx scripts/build-world-chronology.mts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { buildChronology, type RawChronology } from "../src/lib/chronology/build";
import { makeCountryLocator } from "../src/lib/chronology/country";
import { COUNTRY_CHRONOLOGIES } from "../src/lib/chronology/sources";
import type { ModernCountry, ModernCountryProps } from "../src/types/geo";

const raw = JSON.parse(readFileSync("data/chronology/raw.json", "utf8")) as RawChronology;
const topo = JSON.parse(readFileSync("public/data/modern/ne_110m_admin0.topojson", "utf8")) as Topology<{
  countries: GeometryCollection<ModernCountryProps>;
}>;
const countries = feature(topo, topo.objects.countries).features as ModernCountry[];
const countryAt = makeCountryLocator(countries);
const { events, skipped } = buildChronology(raw, { countryAt });
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

// 各國歷史年表（scripts/fetch-country-chronologies.mts 下載）
if (existsSync("data/chronology/countries-raw.json")) {
  const countriesRaw = JSON.parse(readFileSync("data/chronology/countries-raw.json", "utf8")) as RawChronology;
  const byIso = new Map(countries.map((c) => [c.properties.iso, { iso: c.properties.iso, nameZh: c.properties.nameZh }]));
  const built = buildChronology(countriesRaw, {
    countryAt,
    idPrefix: "cc",
    pageCountry: (page) => {
      const source = COUNTRY_CHRONOLOGIES.find((s) => s.page === page.sourcePage);
      const country = source && byIso.get(source.iso);
      return source && country ? { country, fallback: source.fallback } : null;
    },
  });
  writeFileSync(
    "public/data/chronology/country-chronologies.json",
    JSON.stringify({
      notice: "內容取自中文維基百科各國歷史年表（CC BY-SA 4.0），未經改寫；地點由原文連結的 Wikidata 條目推算，找不到時以該國代表位置示意。",
      license: countriesRaw.license,
      fetchedAt: countriesRaw.fetchedAt,
      pages: countriesRaw.pages.map((p) => ({ title: p.title, displayTitle: p.displayTitle, revid: p.revid, items: p.items.length })),
      events: built.events,
    }) + "\n",
  );
  console.log(`各國年表：${built.events.length} 條，略過 ${built.skipped.length} 條`);
  for (const p of countriesRaw.pages) console.log(`  ${p.displayTitle}：${built.events.filter((e) => e.sources[0].title.includes(p.displayTitle)).length} 條`);
}
